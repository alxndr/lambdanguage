export type VarName = string

export type Keyword =
   'if'
 | 'else'
 | 'then'
 | 'true'
 | 'false'
 | 'lambda'
 | 'λ'

export type Operator =
    '='
  | '||'
  | '&&'
  | '<'
  | '>'
  | '<='
  | '>='
  | '=='
  | '!='
  | '+'
  | '-'
  | '*'
  | '/'
  | '%'

export type ASTNode =
    AssignmentToken
  | BinaryToken
  | BlockVariableToken
  | BooleanToken
  | ConditionalToken
  | FunctionCallToken
  | FunctionToken
  | IdentifierToken
  | NumberToken
  | SequenceToken
  | StringToken

export type AssignmentToken = {
  type:'assign',
  operator:'=',
  left:ASTNode,
  right:ASTNode,
}

export type BinaryToken = {
  type:'binary',
  operator:Operator,
  left:ASTNode,
  right:ASTNode,
}

export type BlockVariableToken = {
  type:'let',
  vars:VarName[],
  body:ASTNode,
}

export type BooleanToken = {
  type:'bool',
  value:true|false,
}

export type ConditionalToken = {
  type:'if',
  cond:ASTNode,
  then:ASTNode,
  else?:ASTNode,
}

export type FunctionCallToken = {
  type:'call',
  func:IdentifierToken,
  args:ASTNode[],
}

export type FunctionToken = {
  type:'lambda',
  vars:VarName[],
  body:ASTNode,
}

export type KeywordToken = {
  type:'kw',
  value:string,
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
  value:string,
}

export type SequenceToken = {
  type:'prog',
  prog:ASTNode[],
}

export type StringToken = {
  type:'str',
  value:string,
}
