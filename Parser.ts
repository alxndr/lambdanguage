import {Tokenizer} from './Tokenizer'

import type {
  AST,
  AnyToken,
  AssignmentToken,
  BinaryToken,
  BooleanToken,
  ConditionalToken,
  FunctionCallToken,
  FunctionToken,
  SequenceToken,
} from './Tokens.types'

export class Parser { // recursive descent parser
  static CHAR_PAREN_OPEN  = '('
  static CHAR_PAREN_CLOSE = ')'
  static CHAR_BRACE_OPEN  = '{'
  static CHAR_BRACE_CLOSE = '}'
  static CHAR_SEPARATOR_EXPRESSION = ';'
  static CHAR_SEPARATOR_SEQUENCE   = ','
  static KEYWORD_IF   = 'if'
  static KEYWORD_ELSE = 'else'
  static KEYWORD_THEN = 'then'
  static KEYWORD_TRUE  = 'true'
  static KEYWORD_FALSE = 'false'
  static KEYWORD_LAMBDA = 'lambda'
  static KEYWORD_LMBD   = 'λ'
  static VALUE_TRUE  = {type: 'bool', value: true}
  static VALUE_FALSE = {type: 'bool', value: false}
  static OPERATOR_PRECEDENCE = {
    '=' : 1,
    '||': 2,
    '&&': 3,
    '<' : 7,  '>': 7, '<=': 7, '>=': 7, '==': 7, '!=': 7,
    '+' : 10, '-': 10,
    '*' : 20, '/': 20, '%': 20,
  }

  private input:Tokenizer

  constructor(input:string) {
    this.input = new Tokenizer(input)
    this.parseTopLevel()
  }

  private parseTopLevel():SequenceToken {
    const prog:AST[] = []
    while (!this.input.isAtEnd()) {
      prog.push(this.parseExpression())
      if (!this.input.isAtEnd())
        this.skipPunctuation(Parser.CHAR_SEPARATOR_EXPRESSION)
    }
    return {
      type: 'prog',
      prog,
    }
  }

  private parseAtom() {
    return this.maybeCall(() => {
      if (this.isPunctuation(Parser.CHAR_PAREN_OPEN)) {
        this.input.next()
        const exp = this.parseExpression()
        this.skipPunctuation(Parser.CHAR_PAREN_CLOSE)
        return exp
      }
      if (this.isPunctuation(Parser.CHAR_BRACE_OPEN))
        return this.parseProg()
      if (this.isKeyword(Parser.KEYWORD_IF))
        return this.parseIf()
      if (this.isKeyword(Parser.KEYWORD_TRUE) || this.isKeyword(Parser.KEYWORD_FALSE))
        return this.parseBool()
      if (this.isKeyword(Parser.KEYWORD_LAMBDA) || this.isKeyword(Parser.KEYWORD_LMBD)) {
        this.input.next()
        return this.parseLambda()
      }
      const token = this.input.next()
      if (token)
        if (token.type == 'var' || token.type == 'num' || token.type == 'str')
          return token
      this.unexpected()
    })
  }

  private parseBool():BooleanToken {
    const bool = this.input.next()
    return {
      type: 'bool',
      value: bool?.value == 'true',
    }
  }

  private parseProg():SequenceToken|BooleanToken {
    const prog = this.delimited(Parser.CHAR_BRACE_OPEN, Parser.CHAR_BRACE_CLOSE, Parser.CHAR_SEPARATOR_EXPRESSION, this.parseExpression)
    if (prog.length == 0)
      return Parser.VALUE_FALSE as BooleanToken // TODO
    if (prog.length == 1)
      return prog[0]
    return {
      type: 'prog',
      prog,
    }
  }

  private parseIf():ConditionalToken {
    this.skipKeyword(Parser.KEYWORD_IF)
    const cond = this.parseExpression()
    if (!this.isPunctuation(Parser.CHAR_BRACE_OPEN))
      this.skipKeyword('then')
    const then = this.parseExpression()
    const ret:ConditionalToken = {
      type: 'if',
      cond,
      then,
    }
    if (this.isKeyword(Parser.KEYWORD_ELSE)) {
      this.input.next()
      ret.else = this.parseExpression()
    }
    return ret
  }

  private isKeyword(term:string|false=false) {
    const token = this.input.peek()
    return token && token.type == 'kw' && (!term || token.value == term) && token
  }

  private skipKeyword(kw:string) {
    if (this.isKeyword(kw))
      this.input.next()
    else
      this.input.croak(`Expecting keyword: "${kw}"`)
  }

  private skipPunctuation(char:string) {
    if (this.isPunctuation(char))
      this.input.next()
    else
      this.input.croak(`Expecting punctuation: "${char}"`)
  }

  private parseLambda():FunctionToken {
    return {
      type: 'lambda',
      vars: this.delimited(Parser.CHAR_PAREN_OPEN, Parser.CHAR_PAREN_CLOSE, Parser.CHAR_SEPARATOR_SEQUENCE, this.parseVarname),
      body: this.parseExpression(),
    }
  }

  private parseVarname() {
    const name = this.input.next()
    if (!name || name.type != 'var')
      this.input.croak('expecting variable name!')
    return name.value
  }

  private parseExpression() {
    return this.maybeCall(() => this.maybeBinary(this.parseAtom(), 0))
  }

  private maybeCall(expr:Function):FunctionCallToken|AssignmentToken|BinaryToken { // TODO what's the type for the expression??
    const e = expr()
    return this.isPunctuation(Parser.CHAR_PAREN_OPEN) ? this.parseCall(e) : e
  }

  private parseCall(func:Function):FunctionCallToken {
    return {
      type: 'call',
      func,
      args: this.delimited(Parser.CHAR_PAREN_OPEN, Parser.CHAR_PAREN_CLOSE, Parser.CHAR_SEPARATOR_SEQUENCE, this.parseExpression)
    }
  }

  private unexpected() {
    this.input.croak(`Unexpected token: ${JSON.stringify(this.input.peek())}`)
  }

  private maybeBinary(lhs:AST, precedenceCurrent:number):AssignmentToken|BinaryToken {
    const token = this.isOp()
    if (token && token.value) {
      const precedenceNext = Parser.OPERATOR_PRECEDENCE[token.value]
      if (!precedenceNext)
        throw new Error('ruh roh')
      if (precedenceNext > precedenceCurrent) {
        this.input.next()
        const rhs = this.maybeBinary(this.parseAtom(), precedenceNext)
        const binary = {
          type: token.value === '=' ? 'assign' : 'binary',
          operator: token.value,
          left: lhs,
          right: rhs,
        }
        return this.maybeBinary(binary, precedenceCurrent)
      }
    }
    return lhs
  }

  private isPunctuation(char:string) {
    const token = this.input.peek()
    if (token && token.type == 'punc' && (!char || token.value == char))
      return token
    return false
  }

  private isOp(op=false) {
    const token = this.input.peek()
    if (token && token.type == 'operator' && (!op || token.value == op))
      return token
    return false
  }

  private delimited(startChar:string, endChar:string, separatorChar:string, parser:Function) {
    const a:AST = []
    let first = true
    this.skipPunctuation(startChar)
    while (!this.input.isAtEnd()) {
      if (this.isPunctuation(endChar))
        break
      if (first)
        first = false
      else
        this.skipPunctuation(separatorChar)
      if (this.isPunctuation(endChar))
        break
      a.push(parser())
    }
    this.skipPunctuation(endChar)
    return a
  }
}
