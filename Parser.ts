import {
  Tokenizer,
  KEYWORD_IF,
  KEYWORD_ELSE,
  KEYWORD_LAMBDA,
  KEYWORD_LMBD,
  KEYWORD_TRUE,
  KEYWORD_FALSE,
} from './Tokenizer'

import type {
  AssignmentToken,
  ASTNode,
  BinaryToken,
  // BlockVariableToken,
  BooleanToken,
  ConditionalToken,
  FunctionCallToken,
  FunctionToken,
  IdentifierToken,
  // NumberToken,
  Operator,
  SequenceToken,
  // StringToken,
  VarName,
} from './Tokens.types'

export const CHAR_PAREN_OPEN  = '('
export const CHAR_PAREN_CLOSE = ')'
export const CHAR_BRACE_OPEN  = '{'
export const CHAR_BRACE_CLOSE = '}'
export const CHAR_SEPARATOR_EXPRESSION = ';'
export const CHAR_SEPARATOR_SEQUENCE   = ','
export const VALUE_TRUE:BooleanToken  = {type: 'bool', value: true}
export const VALUE_FALSE:BooleanToken = {type: 'bool', value: false}
export const OPERATOR_PRECEDENCE:Record<Operator,number> = {
  '=' : 1,
  '||': 2,
  '&&': 3,
  '<' : 7,  '>': 7, '<=': 7, '>=': 7, '==': 7, '!=': 7,
  '+' : 10, '-': 10,
  '*' : 20, '/': 20, '%': 20,
}

export class Parser { // recursive descent parser
  private input:Tokenizer
  public ast:SequenceToken

  constructor(input:string) {
    this.input = new Tokenizer(input)
    console.log('Tokenizer#constructor...', {input}, this.input)
    this.ast = this.parseTopLevel()
  }

  private parseTopLevel():SequenceToken {
    console.log('Parser#parseTopLevel...')
    const prog:ASTNode[] = []
    while (!this.input.isAtEnd()) {
      prog.push(this.parseExpression())
      console.log('Parser#parseTopLevel now has prog:', prog)
      if (!this.input.isAtEnd()) {
        console.log('tryna skip semicolon....', CHAR_SEPARATOR_EXPRESSION)
        this.skipPunctuation(CHAR_SEPARATOR_EXPRESSION)
      }
    }
    return {
      type: 'prog',
      prog,
    }
  }

  private parseAtom():AssignmentToken|BinaryToken|BooleanToken|ConditionalToken|FunctionCallToken|SequenceToken {
    const log = (...msgs) => console.log('#parseAtom', ...msgs)
    return this.maybeCall(() => {
      log('starting')
      if (this.isPunctuation(CHAR_PAREN_OPEN)) {
        log('open paren')
        this.input.next()
        const exp = this.parseExpression()
        log({exp})
        this.skipPunctuation(CHAR_PAREN_CLOSE)
        log('close paren...', {exp})
        return exp
      }
      if (this.isPunctuation(CHAR_BRACE_OPEN)) {
        log('open brace found')
        return this.parseProg()
      }
      if (this.isKeyword(KEYWORD_IF)) {
        log('conditional found')
        return this.parseIf()
      }
      if (this.isKeyword(KEYWORD_TRUE) || this.isKeyword(KEYWORD_FALSE)) {
        log('boolean found')
        return this.parseBool()
      }
      if (this.isKeyword(KEYWORD_LAMBDA) || this.isKeyword(KEYWORD_LMBD)) {
        log('lambda!')
        this.input.next() // skip over the lambda keyword
        return this.parseLambda()
      }
      log('not a lambda... must be a token?')
      const token = this.input.next()
      log({token})
      switch (token?.type) {
        case 'var':
        case 'num':
        case 'str':
          return token
        default:
          log('ruh roh...')
          this.unexpected()
      }
    })
  }

  private parseBool():BooleanToken {
    const bool = this.input.next() as BooleanToken
    // this.log('parseBool...', JSON.stringify(bool))
    return {
      type: 'bool',
      value: bool?.value == true,
    }
  }

  private parseProg():AssignmentToken|BinaryToken|BooleanToken|FunctionCallToken|SequenceToken {
    console.log('#parseProg...', CHAR_BRACE_OPEN, CHAR_SEPARATOR_EXPRESSION, CHAR_BRACE_CLOSE)
    const prog = this.delimited(
      CHAR_BRACE_OPEN,
      CHAR_BRACE_CLOSE,
      CHAR_SEPARATOR_EXPRESSION,
      this.parseExpression
    )
    console.log('#parseProg', {prog})
    if (prog.length == 0)
      return VALUE_FALSE
    if (prog.length == 1)
      return prog[0]
    return {
      type: 'prog',
      prog,
    }
  }

  private parseIf():ConditionalToken {
    this.skipKeyword(KEYWORD_IF)
    const cond = this.parseExpression()
    if (!this.isPunctuation(CHAR_BRACE_OPEN))
      this.skipKeyword('then')
    const then = this.parseExpression()
    const ret:ConditionalToken = {
      type: 'if',
      cond,
      then,
    }
    if (this.isKeyword(KEYWORD_ELSE)) {
      this.input.next()
      ret.else = this.parseExpression()
    }
    return ret
  }

  private isKeyword(term:string|false=false) {
    const token = this.input.peek()
    if (token && token.type == 'kw' && (!term || token.value == term))
      return token
    return false
  }

  private skipKeyword(kw:string) {
    if (this.isKeyword(kw))
      this.input.next()
    else
      this.input.croak(`Parser#skipKeyword: Expecting keyword: "${kw}"`)
  }

  private skipOp(op:string) {
    if (this.isOp(op))
      this.input.next()
    else
      this.input.croak(`Parser#skipOp: Expecting operator: "${op}"`)
  }

  private skipPunctuation(char:string) {
    if (this.isPunctuation(char))
      this.input.next()
    else
      this.input.croak(`Parser#skipPunctuation: Expecting punctuation: "${char}"`)
  }

  private parseLambda():FunctionToken {
    console.log('#parseLambda starting')
    const vars = this.delimited<VarName>(
      CHAR_PAREN_OPEN,
      CHAR_PAREN_CLOSE,
      CHAR_SEPARATOR_SEQUENCE,
      this.parseVarname
    )
    console.log('#parseLambda', {vars})
    const body = this.parseExpression()
    console.log('#parseLambda', {body})
    return {
      type: 'lambda',
      vars,
      body,
    }
  }

  private parseVarname():VarName {
    const log = (...msgs) => console.log('#parseVarname', ...msgs)
    log('starting', this.input)
    log('input', this.input)
    const name = this.input.next()
    log({name})
    if (name?.type !== 'var')
      this.input.croak('Parser#parseVarname: expecting variable name!')
    log('returning the value', name.value)
    return name.value
  }

  private parseExpression() {
    console.log('#parseExpression...')
    return this.maybeCall(() => this.maybeBinary(this.parseAtom(), 0))
  }

  private maybeCall(expr:Function):FunctionCallToken|AssignmentToken|BinaryToken { // TODO what's the type for the expression??
    const e = expr()
    return this.isPunctuation(CHAR_PAREN_OPEN) ? this.parseCall(e) : e
  }

  private parseCall(func:IdentifierToken):FunctionCallToken {
    return {
      type: 'call',
      func,
      args: this.delimited(
        CHAR_PAREN_OPEN,
        CHAR_PAREN_CLOSE,
        CHAR_SEPARATOR_SEQUENCE,
        this.parseExpression
      )
    }
  }

  private unexpected():never {
    this.input.croak(`Parser: Unexpected token: ${JSON.stringify(this.input.peek())}`)
  }

  private maybeBinary(lhs, precedenceCurrent:number):AssignmentToken|BinaryToken {
    const token = this.isOp()
    if (token && token.value) {
      const precedenceNext = OPERATOR_PRECEDENCE[token.value]
      if (!precedenceNext)
        throw new Error(`ruh roh: maybeBinary did not find a precedence for "${token.value}"`)
      if (precedenceNext > precedenceCurrent) {
        this.input.next()
        const rhs = this.maybeBinary(this.parseAtom(), precedenceNext)
        const binary = {
          type: token.value === '=' ? 'assign' : 'binary',
          operator: token.value,
          left: lhs,
          right: rhs,
        } as AssignmentToken|BinaryToken
        return this.maybeBinary(binary, precedenceCurrent)
      }
    }
    return lhs
  }

  private isPunctuation(char:string|null=null) {
    const token = this.input.peek()
    if (token && token.type == 'punc' && (!char || token.value == char))
      return token
    return false
  }

  private isOp(op:string|null=null) {
    const token = this.input.peek()
    if (token && token.type == 'operator' && (!op || token.value == op))
      return token
    return false
  }

  private delimited<T>(startChar:string, endChar:string, separatorChar:string, parser:() => T):T[] {
    const log = (...msgs) => console.log('#delimited', parser, ...msgs)
    log({startChar, separatorChar, endChar})
    const ast:T[] = []
    let first = true
    log(`skipping the initial... ${startChar}`)
    this.skipPunctuation(startChar)
    log('bout to start the loop...')
    while (!this.input.isAtEnd()) {
      log('in the loop now', {ast})
      if (this.isPunctuation(endChar)) {
        log(`saw ${endChar}, ending`)
        break
      }
      if (first)
        first = false
      else {
        log(`skipping separator ${separatorChar}`)
        this.skipPunctuation(separatorChar)
      }
      if (this.isPunctuation(endChar)) {
        log(`saw end ${endChar}... break`)
        break
      }
      log('gonna call parser...')
      const p = parser.apply(this) // huh that's not real pretty
      log('push result of parser:', p)
      ast.push(p)
    }
    this.skipPunctuation(endChar)
    return ast
  }
}
