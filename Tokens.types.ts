export type AST = any // TODO

type Operator = any // TODO

export type AssignmentToken = {
  type:'assign',
  operator:'=',
  left:AST,
  right:AST,
}

export type BinaryToken = {
  type:'binary',
  operator:Operator,
  left:AST,
  right:AST,
}

export type BlockVariableToken = {
  type:'let',
  vars:AST[],
  body:AST,
}

export type BooleanToken = {
  type:'bool',
  value:true|false,
}

export type ConditionalToken = {
  type:'if',
  cond:AST,
  then:AST,
  else?:AST,
}

export type FunctionCallToken = {
  type:'call',
  func:AST,
  args:AST[],
}

export type FunctionToken = {
  type:'lambda',
  vars:string[],
  body:AST,
}

export type KeywordToken = {
  type:'kw',
  value:any, // TODO wtf
}

export type IdentifierToken = {
  type:'var',
  value:string,
}

export type NumberToken = {
  type:'num',
  value:number,
}

export type OperatorToken = {
  type:'operator',
  value:Operator,
}

export type PunctuationToken = {
  type:'punc',
  value:any, // TODO
}

export type SequenceToken = {
  type:'prog',
  prog:AST[],
}

export type StringToken = {
  type:'str',
  value:string,
}

export type AnyToken =
  AssignmentToken
| BinaryToken
// | BlockVariableToken
| BooleanToken
| ConditionalToken
| FunctionToken
| FunctionCallToken
| KeywordToken
| IdentifierToken
| NumberToken
| OperatorToken
| PunctuationToken
| SequenceToken
| StringToken
