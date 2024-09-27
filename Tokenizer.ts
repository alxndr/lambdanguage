import {InputStream} from './InputStream'

const REGEX_DIGIT = /\d/
const REGEX_IDENTIFIER_START = /[a-z_λ]/
const REGEX_IDENTIFIER_REST = /[\wλ?!-<>=]*/ // lispy
const REGEX_OPERATOR = /[+\-*/&|]/
const REGEX_PUNCTUATION = /[]/
const REGEX_SPACE = /[ \n]/

export class Tokenizer {
  private input:InputStream
  private current = null
  private KEYWORDS = ['if', 'then', 'else', 'lambda', 'λ', 'true', 'false']

  constructor(rawInput:string) {
    this.input = new InputStream(rawInput)
  }

  log(...msgs:string[]):void {
    console.log(...msgs)
  }

  isDigit(char:string):boolean {
    if (char.length > 1)
      throw new Error('isDigit should only be passed one char at a time')
    return REGEX_DIGIT.test(char)
  }

  isIdentifier(char:string):boolean {
    if (char.length > 1)
      throw new Error('isIdentifier should only be passed one char at a time')
    return REGEX_IDENTIFIER_REST.test(char)
  }

  isKeyword(term:string):boolean {
    return this.KEYWORDS.includes(term)
  }

  isOnSameLine(char:string):boolean {
    if (char.length > 1)
      throw new Error('isOnSameLine should only be passed one char at a time')
    return char !== '\n'
  }

  isOperator(char:string):boolean {
    if (char.length > 1)
      throw new Error('isOperator should only be passed one char at a time')
    return REGEX_OPERATOR.test(char)
  }

  isSpace(char:string):boolean {
    if (char.length > 1)
      throw new Error('isSpace should only be passed one char at a time')
    return REGEX_SPACE.test(char)
  }

  next() {
    // TODO
  }

  readNext() {
    this.readWhile(this.isSpace)
    if (this.input.eof())
      return null
    const char = this.input.peek()
    this.log(`>>> readNext: char=${char}`)
    if (char === '#') {
      this.skipComment()
      return this.readNext()
    }
    if (char === '"')
      return this.readString()
    if (this.isDigit(char))
      return this.readNumber()
    if (REGEX_IDENTIFIER_START.test(char))
      return this.readIdentifier()
    if (REGEX_PUNCTUATION.test(char))
      return {type: 'punctuation', value: this.input.next()}
    if (REGEX_OPERATOR.test(char))
      return {type: 'operator', value: this.readWhile(this.isOperator)}
    this.input.croak(`Can't handle character: ${char}`)
  }

  readWhile(predicate:Function):string {
    let s:string = ''
    while (!this.input.eof() && predicate(this.input.peek())) {
      s += this.input.next()
    }
    return s
  }

  readIdentifier() {
    const ident = this.readWhile(this.isIdentifier)
    return {
      type: this.isKeyword(ident) ? 'kw' : 'var',
      value: ident,
    }
  }

  readNumber() {
    // TODO
  }

  readString() {
    return {
      type: 'str',
      value: this.readEscaped('"'),
    }
  }

  readEscaped(endChar:string):string {
    let escaped = false
    let quotedString = ''
    this.input.next() // toss out the first quote...
    while (!this.input.eof()) {
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

  skipComment() {
    this.readWhile(this.isOnSameLine)
    this.input.next() // process the line-ending newline
  }
}
