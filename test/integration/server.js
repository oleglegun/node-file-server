const assert = require('assert')
const fs = require('fs-extra')
const config = require('config')
const request = require('request')
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
        log.info('Empty dir')
        fs.emptyDirSync(FILES_DIR)
    })

    after(done => {
        app.close(done)
    })

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

    describe('POST file ', () => {
        it('should successfully upload small file', done => {
            // request.post(HOST,)
            done()
        })

        it('should return error 413 (Payload Too Large) on try to upload big file', done => {
            done()
        })

        it('should', () => {
            // return new Promise(resolve => {
            //     setTimeout(() => resolve(), 1000)
            // })
        })
    })

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
