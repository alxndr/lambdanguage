import {describe, it} from 'node:test'
import assert from 'node:assert'

import {InputStream} from './InputStream'
import {Tokenizer} from './Tokenizer'
import {Parser} from './Parser'

describe('InputStream', () => {
  it('is a constructor function', () => {
    assert.strictEqual(typeof InputStream, 'function')
    const inputStream = new InputStream('')
    assert.strictEqual(typeof inputStream, 'object')
    assert.strictEqual(inputStream instanceof InputStream, true)
  })
  describe('with zero-length string', () => {
    it('is at end', () => {
      const inputStream = new InputStream('')
      assert.strictEqual(inputStream.isAtEnd(), true)
    })
  })
  describe('with single-char input', () => {
    it('implements basic ops', () => {
      const inputStream = new InputStream('1')
      assert.deepEqual(inputStream.peek(), '1')
      assert.deepEqual(inputStream.isAtEnd(), false)
      assert.deepEqual(inputStream.next(), '1')
      assert.deepEqual(inputStream.isAtEnd(), true)
      assert.deepEqual(inputStream.peek(), '')
      assert.throws(() => inputStream.next())
    })
  })
  describe('with multi-char input', () => {
    it('implements basic ops', () => {
      const inputStream = new InputStream('leet')
      assert.deepEqual(inputStream.isAtEnd(), false)
      assert.deepEqual(inputStream.peek(), 'l')
      assert.deepEqual(inputStream.next(), 'l')
      assert.deepEqual(inputStream.next(), 'e')
      assert.deepEqual(inputStream.isAtEnd(), false)
      assert.deepEqual(inputStream.next(), 'e')
      assert.deepEqual(inputStream.next(), 't')
      assert.deepEqual(inputStream.peek(), '')
      assert.deepEqual(inputStream.isAtEnd(), true)
      assert.throws(() => inputStream.next())
    })
  })
  describe('with multi-line input', () => {
    it('implements basic ops', () => {
      const inputStream = new InputStream('33;\n77')
      assert.deepEqual(inputStream.isAtEnd(), false)
      assert.deepEqual(inputStream.next(), '3')
      assert.deepEqual(inputStream.next(), '3')
      assert.deepEqual(inputStream.next(), ';')
      assert.deepEqual(inputStream.next(), '\n')
      assert.deepEqual(inputStream.next(), '7')
      assert.deepEqual(inputStream.next(), '7')
      assert.throws(() => inputStream.next())
    })
  })
  describe('croak', () => {
    it('throws', () => {
      const inputStream = new InputStream('')
      assert.throws(() => inputStream.croak('message'), /message \(1:0\)/)
    })
  })
})

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
})

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
  describe.skip('with numerical input', () => {
    it('returns AST with single number token', () => {
      const {ast} = new Parser('1337')
      assert.deepEqual(ast, {type: 'prog', prog: []})
    })
  })
})
