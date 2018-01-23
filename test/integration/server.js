//@ts-check
const assert = require('assert')
const fs = require('fs-extra')
const config = require('config')
const request = require('request')
const Readable = require('stream').Readable
const rp = require('request-promise').defaults({
    encoding: null, // get buffer
    simple: false, // reject promise if response.statusCode != 2..
    resolveWithFullResponse: true,
})
const fetch = require('node-fetch')
const log = require('../../src/logger')
const server = require('../../src/server')

const PORT = config.get('port')
const PUBLIC_DIR = config.get('publicDir')
const FILES_DIR = config.get('filesDir')
const FIXTURES_DIR = __dirname + '/fixtures'

const HOST = 'http://localhost:' + PORT

assert.equal(process.env.NODE_ENV, 'test')

describe('INTEGRATION TESTS', () => {
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

    /*
     *  GET
     */

    context('GET /', () => {
        it('should return index.html from /public', done => {
            request(HOST + '/', (err, res, body) => {
                if (err) {
                    done(err)
                }

                const indexFile = fs.readFileSync(PUBLIC_DIR + '/index.html', { encoding: 'utf-8' })

                assert.equal(body, indexFile)

                done()
            })
        })
    })

    describe('GET file', () => {
        context('file exists', () => {
            beforeEach('Put small.txt file to /files', () => {
                fs.emptyDirSync(FILES_DIR)
                fs.copySync(`${FIXTURES_DIR}/small.txt`, `${FILES_DIR}/small.txt`)
                log.info('copy file small.txt')
            })

            it('should return file from /files', done => {
                let fixtureContent = fs.readFileSync(`${FIXTURES_DIR}/small.txt`)

                request.get(HOST + '/small.txt', (error, response, body) => {
                    if (error) {
                        done(error)
                    }

                    try {
                        assert.equal(response.statusCode, 200)
                        assert.equal(fixtureContent, body)
                    } catch (err) {
                        done(err)
                        return
                    }
                    done()
                })
            })
        })

        context('file not exist', () => {
            it('should return an error 404 (Not Found) on request for nonexistent file in /files', done => {
                request.get(HOST + '/notExistentFile.txt', (err, res, body) => {
                    if (err) {
                        done(err)
                    }

                    try {
                        assert.equal(res.statusCode, 404)
                        done()
                    } catch (err) {
                        done(err)
                    }
                })
            })
        })

        context('bad request', () => {
            it('should return an error 400 (Bad Request) on try to access folders outside /files', done => {
                request.get(HOST + '/../file.txt', (err, res, body) => {
                    if (err) {
                        done(err)
                    }

                    assert.equal(res.statusCode, 400)
                    done()
                })
            })

            it('should return an error 400 (Bad Request) on try to access folders inside /files', done => {
                request.get(HOST + '/folder/file.txt', (err, res, body) => {
                    if (err) {
                        done(err)
                    }

                    assert.equal(res.statusCode, 400)
                    done()
                })
            })
        })
    })

    /*
     *  POST
     */

    describe('POST file ', () => {
        beforeEach(function() {
            fs.emptyDirSync(FILES_DIR)
        })

        context('if file exists', () => {
            beforeEach(function() {
                fs.copySync(`${FIXTURES_DIR}/small.txt`, `${FILES_DIR}/small.txt`)
            })

            it('should return error 409 (File already exists)', () => {
                return rp({
                    method: 'POST',
                    uri: `${HOST}/small.txt`,
                    body: fs.createReadStream(`${FIXTURES_DIR}/small.txt`),
                    resolveWithFullResponse: true,
                })
                    .then(response => {
                        assert.equal(response.statusCode, 409, 'Expected error 409')
                    })
                    .catch(err => {
                        assert.equal(err.statusCode, 409)
                    })
            })

            it('should not rewrite the existing file', () => {
                const mtime = fs.statSync(`${FILES_DIR}/small.txt`).mtime

                return rp({
                    method: 'POST',
                    uri: `${HOST}/small.txt`,
                    body: fs.createReadStream(`${FIXTURES_DIR}/small.txt`),
                    resolveWithFullResponse: true,
                }).then(
                    response => {
                        assert.equal(response.statusCode, 409, 'Expected error 409')
                    },
                    error => {
                        const newMtime = fs.statSync(`${FIXTURES_DIR}/small.txt`).mtime
                        assert.deepEqual(mtime, newMtime)
                    }
                )
            })
        })

        context('if file not exist', () => {
            it('should successfully upload small file', done => {
                const req = request.post(HOST + `/small.txt`, error => {
                    if (error) return done(error)

                    assert.deepEqual(
                        fs.readFileSync(FILES_DIR + `/small.txt`),
                        fs.readFileSync(FIXTURES_DIR + '/small.txt')
                    )

                    done()
                })

                fs.createReadStream(FIXTURES_DIR + '/small.txt').pipe(req)
            })

            it('should return error 413 (Payload Too Large) on try to upload big file', async () => {
                assert.equal(fs.existsSync(FILES_DIR + '/big.txt'), false)
                const stream = fs.createReadStream(FIXTURES_DIR + '/big.txt')

                const req = rp.post(HOST + '/big.txt')

                stream.pipe(req)

                let response

                try {
                    response = await req
                } catch (error) {
                    if (error.code === 'ECONNRESET' || error.code === 'EPIPE') {
                        throw error
                    }
                }

                assert.equal(response.statusCode, 413)
                assert.equal(fs.existsSync(FILES_DIR + '/big.txt'), false)
            })

            it('should successfully upload zero size file', async () => {
                const req = rp.post(HOST + '/small.txt')

                const stream = new Readable()
                stream.pipe(req)
                stream.push(null)

                const response = await req

                assert.equal(response.statusCode, 200)
                assert.equal(fs.statSync(FILES_DIR + '/small.txt').size, 0)
            })
        })
    })

    /*
     *  DELETE
     */

    describe('DELETE file', () => {
        it('should successfully delete existent file in /files', () => {})

        it('should return an error 404 (Not Found) if file not found in /files', done => {
            fetch(HOST + '/notExistentFile.txt', { method: 'DELETE' })
                .then(res => {
                    assert.equal(res.status, 404)
                    done()
                })
                .catch(err => {
                    done(err)
                })
        })
    })
})

// process.on('uncaughtException', error => {
//     console.log('---', error)
// })
