const assert = require('assert')
const { isValidFilePath } = require('../../src/helpers')

describe('UNIT TESTS', () => {
    describe('[helpers.js]: isValidFilePath()', () => {
        context('valid path', () => {
            it('returns true for: /file', () => {
                assert.ok(isValidFilePath('/file'))
            })

            it('returns true for: /file.txt', () => {
                assert.ok(isValidFilePath('/file.txt'))
            })

            it('returns true for: /file.file.file.txt', () => {
                assert.ok(isValidFilePath('/file.file.file.txt'))
            })
        })
        context('invalid path', () => {
            it('returns false for nested path: /file/file.txt', () => {
                assert.equal(isValidFilePath('/file/file.txt'), false)
            })

            it('returns false for relative path: /../file.txt', () => {
                assert.equal(isValidFilePath('/../file.txt'), false)
            })

            it('returns false for relative path: /./file.txt', () => {
                assert.equal(isValidFilePath('/./file.txt'), false)
            })

            it('returns false for invalid path: //', () => {
                assert.equal(isValidFilePath('//'), false)
            })

            it('returns false for invalid path: //file.txt', () => {
                assert.equal(isValidFilePath('//file.txt'), false)
            })
        })
    })
})
