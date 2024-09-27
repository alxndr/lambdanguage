import {InputStream} from './InputStream'
import {Parser} from './Parser.ts'

import type {
  AnyToken,
  AssignmentToken,
  BinaryToken,
  // BlockVariableToken,
  BooleanToken,
  ConditionalToken,
  FunctionToken,
  FunctionCallToken,
  IdentifierToken,
  KeywordToken,
  NumberToken,
  StringToken,
} from './Tokens.types.ts'

export class Tokenizer {
  static KEYWORDS = [
    Parser.KEYWORD_IF,
    Parser.KEYWORD_THEN,
    Parser.KEYWORD_ELSE,
    Parser.KEYWORD_LAMBDA,
    Parser.KEYWORD_LMBD,
    Parser.KEYWORD_TRUE,
    Parser.KEYWORD_FALSE,
  ]
  static REGEX_DIGIT = /\d/
  static REGEX_IDENTIFIER_START = /[a-z_λ]/i
  static REGEX_IDENTIFIER_REST = /[\wλ?!-<>=]*/i // lispy
  static REGEX_OPERATOR = /[+\-*/%=&|<>!]/
  static REGEX_PUNCTUATION = /[,;(){}[]]/
  static REGEX_SPACE = /[ \t\n]/

  private input:InputStream
  private current:AnyToken|null = null // "The next() function doesn't always call read_next(), because it might have been peeked before (in which case read_next() was already called and the stream advanced). Therefore we need a current variable which keeps track of the current token"

  constructor(rawInput:string) {
    this.input = new InputStream(rawInput)
  }

  public next():AnyToken|null {
    let token = this.current
    this.current = null
    return token || this.readNext()
  }

  public peek():AnyToken|null {
    // if (!this.current)
    //   this.current = this.readNext() // hmm this doesn't seem peek-y…
    // return this.current
    return this.current || (this.current = this.readNext())
  }

  public isAtEnd():boolean {
    return this.peek() === null
  }

  public croak(msg:string):never {
    this.input.croak(msg)
  }

  private log(...msgs:string[]):void {
    console.log(...msgs)
  }

  private isDigit(char:string):boolean {
    if (char.length > 1)
      throw new Error('isDigit should only be passed one char at a time')
    return Tokenizer.REGEX_DIGIT.test(char)
  }

  private isIdentifier(char:string):boolean {
    if (char.length > 1)
      throw new Error('isIdentifier should only be passed one char at a time')
    return Tokenizer.REGEX_IDENTIFIER_REST.test(char)
  }

  private isKeyword(term:string):boolean {
    return Tokenizer.KEYWORDS.includes(term)
  }

  private isOnSameLine(char:string):boolean {
    if (char.length > 1)
      throw new Error('isOnSameLine should only be passed one char at a time')
    return char !== '\n'
  }

  private isOperator(char:string):boolean {
    if (char.length > 1)
      throw new Error('isOperator should only be passed one char at a time')
    return Tokenizer.REGEX_OPERATOR.test(char)
  }

  private isSpace(char:string):boolean {
    if (char.length > 1)
      throw new Error('isSpace should only be passed one char at a time')
    return Tokenizer.REGEX_SPACE.test(char)
  }

  private readNext():AnyToken|null {
    this.readWhile(this.isSpace)
    if (this.input.isAtEnd())
      return null
    const char = this.input.peek()
    this.log(`>>> readNext: char=${char}`)

    // TODO is this any better with a switch??
    if (char === '#') {
      this.skipComment()
      return this.readNext()
    }

    if (char === '"')
      return this.readString()

    if (this.isDigit(char))
      return this.readNumber()

    if (Tokenizer.REGEX_IDENTIFIER_START.test(char))
      return this.readIdentifier()

    if (Tokenizer.REGEX_PUNCTUATION.test(char))
      return {type: 'punc', value: this.input.next()}

    if (Tokenizer.REGEX_OPERATOR.test(char))
      return {type: 'operator', value: this.readWhile(this.isOperator)}

    this.input.croak(`Can't handle character: ${char}`)
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
