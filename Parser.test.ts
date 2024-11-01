import {describe, it} from 'node:test'
import assert from 'node:assert'

import {Parser} from './Parser'

describe('Parser', () => {
  it('is a constructor function', () => {
    assert.strictEqual(typeof Parser, 'function')
    const parser = new Parser('')
    assert.strictEqual(typeof parser, 'object')
    assert.strictEqual(parser instanceof Parser, true)
  })
  describe('with empty input', () => {
    it('returns AST with single empty prog token', () => {
      const {ast} = new Parser('')
      assert.deepEqual(ast, {type: 'prog', prog: []})
    })
  })
  describe('with numerical input', () => {
    it('returns AST with single number token', () => {
      const {ast} = new Parser('1337')
      assert.deepEqual(ast, {type: 'prog', prog: [
        {
          type: 'num',
          value: 1337
        }
      ]})
    })
  })
  describe('with a semicolon', () => {
    it('can handle it', () => {
      const {ast} = new Parser('123;')
      assert.equal(typeof ast, 'object')
      assert.equal(ast.hasOwnProperty('prog'), true)
      assert.deepEqual(ast.prog, [{
        type: 'num',
        value: 123
      }])
    })
  })
  describe('multi-line input', () => {
    it('splits it up', () => {
      const {ast} = new Parser('123;\n456')
      assert.equal(typeof ast, 'object')
      assert.equal(typeof ast.prog, 'object')
      assert.equal(ast.prog.length, 2)
      assert.deepEqual(ast.prog[0], {type: 'num', value: 123})
      assert.deepEqual(ast.prog[1], {type: 'num', value: 456})
    })
    it('with assignment', () => {
      const {ast} = new Parser('foo = "bar"')
      assert.equal(typeof ast, 'object')
      assert.equal(typeof ast.prog, 'object')
      const firstNode = ast.prog[0]
      assert.equal(firstNode.type, 'assign')
      assert.deepEqual(firstNode.left, { type: 'var', value: 'foo' })
      assert.deepEqual(firstNode.right, { type: 'str', value: 'bar' })
    })
    it('with assignment and function calls', () => {
      const {ast} = new Parser('sum = lambda(x, y) x + y; print(sum(2, 3))')
      assert.equal(typeof ast, 'object')
      assert.equal(typeof ast.prog, 'object')
      assert.equal(ast.prog.length, 2)
      assert.equal(ast.prog[0].type, 'assign')
      assert.equal(ast.prog[0].left.value, 'sum')
      assert.equal(ast.prog[0].right.type, 'lambda')
      assert.equal(ast.prog[1].type, 'call')
      assert.equal(ast.prog[1].args.length, 1)
    })
  })
})
