import {describe, it} from 'node:test'
import assert from 'node:assert'

import {Tokenizer} from './Tokenizer'

describe('Tokenizer', () => {
  it('is a constructor function', () => {
    assert.strictEqual(typeof Tokenizer, 'function')
    const tokenizer = new Tokenizer('')
    assert.strictEqual(typeof tokenizer, 'object')
    assert.strictEqual(tokenizer instanceof Tokenizer, true)
  })
  describe('with zero-length string', () => {
    it('is at end', () => {
      const tokenizer = new Tokenizer('')
      assert.strictEqual(tokenizer.isAtEnd(), true)
    })
  })
  describe('with a single integer', () => {
    it('generates single num token', () => {
      const t = new Tokenizer('1337')
      assert.deepEqual(t.peek(), {type: 'num', value: 1337})
      assert.deepEqual(t.isAtEnd(), false)
      assert.deepEqual(t.next(), {type: 'num', value: 1337})
      assert.deepEqual(t.isAtEnd(), true)
      assert.deepEqual(t.next(), null)
    })
  })
  describe('croak', () => {
    it('throws', () => {
      const t = new Tokenizer('')
      assert.throws(() => t.croak('ruh roh'), /ruh roh \(1:0\)/)
    })
  })
  describe('with a string', () => {
    it('generates a string token', () => {
      const t = new Tokenizer('"foo bar"')
      assert.deepEqual(t.next(), {type: 'str', value: 'foo bar'})
    })
  })
  describe('assignment', () => {
    it('generates a var token', () => {
      const t = new Tokenizer('foo = 4')
      assert.deepEqual(t.next(), {type: 'var', value: 'foo = 4'})
    })
  })
})
