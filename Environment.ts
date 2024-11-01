import type {
  VarName,
} from './Tokens.types'

// Environment implements variable scope, using prototypal inheritance of objects

export class Environment {
  private vars:Record<VarName,any>
  private parent:Environment|null

  constructor(parent:Environment|null=null) {
    this.vars = Object.create(parent ?? null)
    this.parent = parent
  }

  public extend() { // create a subscope
    return new Environment(this)
  }

  private lookup(name:VarName) { // find the scope where the variable with the given name is defined
    let scope:Environment|null = this
    while (scope) {
      if (Object.prototype.hasOwnProperty.call(scope.vars, name))
        return scope
      scope = scope.parent
    }
  }

  public get(name:VarName) { // get the current value of a variable
    if (name in this.vars)
      return this.vars[name]
    throw new Error(`Environment#get: Undefined variable: ${name}`)
  }

  public set(name:VarName, value) { // set the value of a variable
    const scope = this.lookup(name)
    // do not allow defining globals from a nested environment
    if (!scope && this.parent)
      throw new Error(`Environment#set: Undefined variable: ${name}`)
    return (scope || this).vars[name] = value
  }

  public def(name:VarName, value) { // create/shadow/overwrite a variable in the current scope
    return this.vars[name] = value
  }

}
