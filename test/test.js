const assert = require('assert')
const fs = require('fs')
const config = require('config')
const request = require('request')
const log = require('../src/logger')
const server = require('../src/server')

const PORT = config.get('port')
const PUBLIC_DIR = config.get('publicDir')

describe('server integration tests', () => {
    let app

    before(done => {
        app = server.listen(PORT, done)
    })

    beforeEach(function() {
        log.info('--- %s', this.currentTest.title)
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
