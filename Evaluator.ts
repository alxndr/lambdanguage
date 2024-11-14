import {makeLogger} from './logger'

import type {Environment} from './Environment'
import type {
  ASTNode,
  FunctionToken,
  Operator,
} from './Tokens.types'

export class Evaluator {
  static applyOp(op:Operator, lhs, rhs) {
    switch (op) {
      case '+': return lhs + rhs
      case '-': return lhs - rhs
      case '*': return lhs * rhs
      case '/':
        if (rhs === 0)
          throw new Error(`Evaluator: can't divide by zero`)
        return lhs / rhs
      case '%':
        if (rhs === 0)
          throw new Error(`Evaluator: can't modulo by zero`)
        return lhs % rhs
      case '&&': return lhs !== false && rhs
      case '||': return lhs !== false ? lhs : rhs
      case '<':  return lhs < rhs
      case '>':  return lhs > rhs
      case '<=': return lhs <= rhs
      case '>=': return lhs >= rhs
      case '==': return lhs === rhs
      case '!=': return lhs !== rhs
      default: throw new Error(`Evaluator: Unknown operator: ${JSON.stringify(op)}`)
    }
  }

  private env:Environment

  constructor(env:Environment) {
    this.env = env
  }

  public evaluate(exp:ASTNode) {
    const log = makeLogger('Evaluator#evaluate')
    switch (exp.type) { // TODO more typescript-y way to do this? type guards?
      case 'num':
      case 'str':
      case 'bool':
        return exp.value

      case 'var':
        return this.env.get(exp.value)

      case 'assign': {
        if (exp.left.type !== 'var')
          throw new Error(`Evaluator: Cannot assign to ${JSON.stringify(exp.left)}`)
        const lhsValue = exp.left.value
        const rhsValue = this.evaluate(exp.right)
        log({lhsValue, rhsValue})
        return this.env.set(lhsValue, rhsValue)
      }

      case 'binary':
        return Evaluator.applyOp(
          exp.operator,
          this.evaluate(exp.left),
          this.evaluate(exp.right))

      case 'lambda':
        return this.makeLambda(exp)

      case 'if':
        if (this.evaluate(exp.cond) !== false)
          return this.evaluate(exp.then)
        return exp.else ? this.evaluate(exp.else) : false

      case 'prog': {
        // return exp.prog.reduce((_, elem) => this.evaluate(elem), null)
        log('evaling prog...', exp.prog)
        let val = false
        exp.prog.forEach(p => {
          val = this.evaluate(p)
        })
        return val
      }

      case 'call':
        log('exp is a call...', exp.args)
        return this.evaluate(exp.func).apply(null, exp.args.map(arg => this.evaluate(arg)))

      default:
        throw new Error(`Evaluator: Unexpected evaluation target: ${JSON.stringify(exp.type)}`)
    }
  }

  private makeLambda(exp:FunctionToken) {
    const log = makeLogger('Evaluator#makeLambda')
    return (...args) => {
      const names = exp.vars
      const scope = this.env.extend()
      log({names, scope})
      for (let i = 0; i < names.length; i++)
        scope.def(names[i], i < args.length ? args[i] : false)
      return new Evaluator(scope).evaluate(exp.body)
    }
  }
}
