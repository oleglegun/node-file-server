const assert = require('assert')
const fs = require('fs')
const config = require('config')
const request = require('request')
const server = require('../src/server')

const PORT = config.get('port')
const PUBLIC_DIR = config.get('publicDir')
console.log('---', PORT)

describe('server tests', () => {
    let app

    before(done => {
        app = server.listen(PORT, done)
    })

    after(done => {
        app.close(done)
    })

    it('should return index.html', done => {
        request('http://localhost:' + PORT, (err, res, body) => {
            if (err) {
                done(err)
            }

            const indexFile = fs.readFileSync(PUBLIC_DIR + '/index.html', { encoding: 'utf-8' })
            assert.equal(body, indexFile)

            done()
        })
    })
})
