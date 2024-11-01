import {InputStream} from './InputStream'

import type {
  AssignmentToken,
  BinaryToken,
  BlockVariableToken,
  BooleanToken,
  ConditionalToken,
  FunctionToken,
  FunctionCallToken,
  IdentifierToken,
  Keyword,
  KeywordToken,
  NumberToken,
  Operator,
  OperatorToken,
  PunctuationToken,
  StringToken,
} from './Tokens.types.ts'

type AnyToken =
    AssignmentToken
  | BinaryToken
  | BooleanToken
  | ConditionalToken
  | FunctionCallToken
  | FunctionToken
  | IdentifierToken
  | KeywordToken
  | NumberToken
  | OperatorToken
  | PunctuationToken
  | StringToken

export const KEYWORD_IF   = 'if'
export const KEYWORD_ELSE = 'else'
export const KEYWORD_THEN = 'then'
export const KEYWORD_TRUE  = 'true'
export const KEYWORD_FALSE = 'false'
export const KEYWORD_LAMBDA = 'lambda'
export const KEYWORD_LMBD   = 'λ'

export class Tokenizer {
  static KEYWORDS = [
    KEYWORD_IF,
    KEYWORD_THEN,
    KEYWORD_ELSE,
    KEYWORD_LAMBDA,
    KEYWORD_LMBD,
    KEYWORD_TRUE,
    KEYWORD_FALSE,
  ]
  static REGEX_DIGIT = /\d/
  static REGEX_IDENTIFIER_START = /[a-z_λ]/i
  static REGEX_IDENTIFIER_CHAR = /[\wλ?!\-<>=]/i // lispy
  static REGEX_OPERATOR = /[+\-*/%=&|<>!]/
  static REGEX_PUNCTUATION = /[,;(){}[\]]/ // subtle bug if the closing-bracket within the char class isn't escaped
  static REGEX_SPACE = /[ \t\n]/

  private input:InputStream
  private peekedToken:AnyToken|null = null // "The next() function doesn't always call read_next(), because it might have been peeked before (in which case [readNext()] was already called and the stream advanced). Therefore we need a [peekedToken] variable which keeps track of the current token"

  constructor(rawInput:string) {
    this.input = new InputStream(rawInput)
  }

  public next():AnyToken|null {
    if (this.peekedToken) {
      let token = this.peekedToken
      this.peekedToken = null
      return token
    }
    return this.readNext()
  }

  public peek():AnyToken|null {
    if (!this.peekedToken)
      this.peekedToken = this.readNext() // because #peek() can sometimes call #readNext(), we'll store the value in #current when doing so, and then account for that potential value in the implementations of both #peek() and #next()...
    return this.peekedToken
  }

  public isAtEnd():boolean {
    const p = this.peek()
    // console.log(`\tTokenizer#isAtEnd? ${p === null}:`, p)
    return p === null
  }

  public croak(msg:string):never {
    this.input.croak(msg)
  }

  private log(...msgs:string[]):void {
    // console.log(...msgs)
  }

  private isDigit(char:string):boolean {
    if (char.length > 1)
      throw new Error('Tokenizer#isDigit should only be passed one char at a time')
    return Tokenizer.REGEX_DIGIT.test(char)
  }

  private isIdentifier(char:string):boolean {
    // console.log('\tTokenizer#isIdentifier??', char)
    if (char.length > 1)
      throw new Error('Tokenizer#isIdentifier should only be passed one char at a time')
    return Tokenizer.REGEX_IDENTIFIER_CHAR.test(char)
  }

  private isKeyword(term:string):term is Keyword {
    return Tokenizer.KEYWORDS.includes(term)
  }

  private isOnSameLine(char:string):boolean {
    if (char.length > 1)
      throw new Error('Tokenizer#isOnSameLine should only be passed one char at a time')
    return char !== '\n'
  }

  private isOperator(char:string):boolean {
    if (char.length > 1)
      throw new Error('Tokenizer#isOperator should only be passed one char at a time')
    return Tokenizer.REGEX_OPERATOR.test(char)
  }

  private isSpace(char:string):boolean {
    if (char.length > 1)
      throw new Error('Tokenizer#isSpace should only be passed one char at a time')
    return Tokenizer.REGEX_SPACE.test(char)
  }

  private readNext():AnyToken|null {
    // const log = (...msgs) => console.log('\tTokenizer#readNext', ...msgs)
    // log('read past spaces...')
    this.readWhile(this.isSpace)
    if (this.input.isAtEnd()) {
      // log('we are at the end!!!')
      return null
    }
    const char = this.input.peek()
    // log('peeked:', {char})
    if (char === '#') {
      this.skipComment()
      return this.readNext()
    }
    if (char === '"') {
      // log('saw a quote, we got a string')
      return this.readString()
    }
    if (this.isDigit(char)) {
      // log('saw a digit, we got a number')
      return this.readNumber()
    }
    if (Tokenizer.REGEX_IDENTIFIER_START.test(char)) {
      // log('saw an identifier start char...')
      return this.readIdentifier()
    }
    if (Tokenizer.REGEX_PUNCTUATION.test(char)) {
      // log('saw a punctuation...')
      return {type: 'punc', value: this.input.next()}
    }
    if (Tokenizer.REGEX_OPERATOR.test(char)) {
      // log('saw an operator char')
      return {type: 'operator', value: this.readWhile(this.isOperator) as Operator}
    }
    // log('uh oh dunno what this is', {char})
    this.input.croak(`Tokenizer: Can't handle character: ${char}`)
  }

  private readWhile(predicate:Function):string {
    let s:string = ''
    while (!this.input.isAtEnd() && predicate(this.input.peek())) {
      s += this.input.next()
    }
    return s
  }

  private readIdentifier():IdentifierToken|KeywordToken {
    const ident = this.readWhile(this.isIdentifier)
    return {
      type: this.isKeyword(ident) ? 'kw' : 'var',
      value: ident,
    }
  }

  private readNumber():NumberToken { // only supports decimal floats
    let hasDot = false
    const n:string = this.readWhile((char:string) => {
      if (char === '.') {
        if (hasDot) {
          return false // ruh roh
        }
        hasDot = true
        return true
      }
      return this.isDigit(char)
    })
    return {
      type: 'num',
      value: parseFloat(n),
    }
  }

  private readString():StringToken { // only supports double-quoted strings; need to use backslash to escape double-quote and backslash
    return {
      type: 'str',
      value: this.readEscaped('"'),
    }
  }

  private readEscaped(endChar:string):string {
    let escaped = false
    let quotedString = ''
    this.input.next() // toss out the first quote...
    while (!this.input.isAtEnd()) {
      let char = this.input.next()
      if (escaped) {
        quotedString += char
        escaped = false
      } else if (char === '\\') {
        escaped = true
      } else if (char === endChar) {
        break
      } else {
        quotedString += char
      }
    }
    return quotedString
  }

  private skipComment() {
    this.readWhile(this.isOnSameLine)
    this.input.next() // process the line-ending newline
  }
}
