import {describe, it} from 'node:test'
import assert from 'node:assert'

import {Parser} from './Parser'
import {Evaluator} from './Evaluator'
import {Environment} from './Environment'

describe('Evaluator', () => {
  describe('with test code and an Environment', () => {
    it('evaluates correctly', () => {
      const globalEnv = new Environment()
      globalEnv.def('print', (value) => {
        console.log(value)
      })
      const parser = new Parser('sum = lambda(x, y) x + y; print(sum(2, 3));')
      console.log(parser)
      assert.strictEqual(
        new Evaluator(globalEnv).evaluate(parser.ast),
        5
      )
    })
  })
})
