export class InputStream {
  private position:number = 0;
  private line:number = 1;
  private column:number = 0;
  private input:string;

  constructor(rawInput:string) {
    this.input = rawInput
  }

  public next():string {
    const char = this.input.charAt(this.position)
    if (char === '\n') {
      this.line++
      this.column = 0
    } else {
      this.column++
    }
    return char
  }

  public peek():string {
    return this.input.charAt(this.position)
  }

  public eof():boolean {
    return this.peek() === ''
  }

  public croak(msg:string):never {
    throw new Error(`${msg} (${this.line}:${this.column})`)
  }
}
