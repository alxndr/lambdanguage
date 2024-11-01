import {describe, it} from 'node:test'
import assert from 'node:assert'

import {Parser} from './Parser'
import {Evaluator} from './Evaluator'
import {Environment} from './Environment'

describe('Evaluator', () => {
  describe('with test code and an Environment', () => {
    it('evaluates correctly', () => {
      const parser = new Parser('sum = lambda(x, y) x + y; sum(2, 3);')
      assert.strictEqual(
        new Evaluator(new Environment()).evaluate(parser.ast),
        5
      )
    })
    it('allows global functions to be added to scope', () => {
      const globalEnv = new Environment()
      let globalFnCalledWithParam = undefined
      globalEnv.def('print', (value) => {
        globalFnCalledWithParam = value
      })
      const parser = new Parser('sum = lambda(x, y) x + y; print(sum(2, 3));')
      new Evaluator(globalEnv).evaluate(parser.ast),
      assert.equal(globalFnCalledWithParam, 5)
    })
  })
})
