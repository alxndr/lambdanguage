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
  it.only('supports closures', () => {
    const {evaluate} = new Evaluator(new Environment())
    const {ast} = new Parser(`
      adder = λ(a, b) a + b;
      adderOfFive = λ(x) λ() adder(x, 5);
      adderOfFive(10)
    `)
    assert.equal(
      evaluate(ast),
      'baz'
    )
  })
  it('lets you create LISPy lists', () => {
    const parser = new Parser(`
      cons = λ(a, b) λ(fn) fn(a, b);
      car = λ(cell) cell(λ(x, y) x);
      cdr = λ(cell) cell(λ(x, y) y);
      NIL = λ(fn) fn(NIL, NIL);
      z = cons(1, cons(2, cons(3, cons(4, cons(5, NIL)))));
      car(z) # should return 1
    `)
    const evaluator = new Evaluator(new Environment())
    assert.equal(
      evaluator.evaluate(parser.ast),
      'foo bar'
    )
  })
})
