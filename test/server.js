const assert = require('assert')
const fs = require('fs')
const config = require('config')
const request = require('request')
const fetch = require('node-fetch')
const log = require('../src/logger')
const server = require('../src/server')

const PORT = config.get('port')
const PUBLIC_DIR = config.get('publicDir')
const FILES_DIR = config.get('filesDir')

const HOST = 'http://localhost:' + PORT

describe('server tests', () => {
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

    describe('download file requests', () => {
        beforeEach('Clean /files folder', () => {})

        it('should return index.html', done => {
            request(HOST + '/', (err, res, body) => {
                if (err) {
                    done(err)
                }

                const indexFile = fs.readFileSync(PUBLIC_DIR + '/index.html', { encoding: 'utf-8' })

                assert.equal(body, indexFile)

                done()
            })
        })

        it('should return file from /files', done => {
            const file = fs.createWriteStream(FILES_DIR + '/file.txt')
            const fileContent = 'content'

            file
                .on('error', error => {
                    done(error)
                })
                .write(fileContent, () => {
                    file.close()

                    request(HOST + '/file.txt', (err, res, body) => {
                        if (err) {
                            done(err)
                        }

                        if (res.statusCode === 200) {
                            assert.equal(fileContent, body)
                            done()
                        }
                    })
                })
        })

        it('should return an error 400 (Bad Request) on try to access folders outside /files', done => {
            request(HOST + '/../file.txt', (err, res, body) => {
                if (err) {
                    done(err)
                }

                assert.equal(res.statusCode, 400)
                done()
            })
        })

        it('should return an error 400 (Bad Request) on try to access folders inside /files', done => {
            request(HOST + '/folder/file.txt', (err, res, body) => {
                if (err) {
                    done(err)
                }

                assert.equal(res.statusCode, 400)
                done()
            })
        })

        it('should return an error 404 (Not Found) on request for nonexistent file in /files', done => {
            request(HOST + '/notExistentFile.txt', (err, res, body) => {
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

    describe('upload file requests ', () => {
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

    describe('delete file request', () => {
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
