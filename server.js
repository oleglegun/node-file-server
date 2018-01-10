/* Basic file server.
 * All files are in '/files' folder.
 * 
 * Supported operations:
 * GET /
 * GET /file.ext
 * POST /file.ext
 * DELETE /file.ext
*/

const { Server } = require('http')
const url = require('url')
const fs = require('fs')
const mime = require('mime')
const { saveFile, sendFile, deleteFile } = require('./handlers')
const { isValidFilePath } = require('./helpers')

const FILES_DIR = __dirname + '/files'
const PUBLIC_DIR = __dirname + '/public'

new Server((req, res) => {
    const reqURL = url.parse(req.url)
    const reqPath = decodeURI(reqURL.pathname)

    if (!isValidFilePath(reqPath)) {
        res.writeHead = 400
        res.end('Bad request')
        return
    }

    switch (req.method) {
        case 'GET':
            if (reqPath == '/') {
                res.setHeader('Content-Type', 'text/html;charset=utf-8')
                sendFile(`${PUBLIC_DIR}/index.html`, res)
            } else if (isValidFilePath(reqPath)) {
                sendFile(FILES_DIR + reqPath, res)
            } else {
                // Invalid path
                res.statusCode = 400
                // res.writeHead(400, "Bad Request");
                res.end('Bad request')
            }

            break

        case 'POST':

        case 'DELETE':
            if (isValidFilePath(reqPath)) {
                if (deleteFile(FILES_DIR + reqPath)) {
                    res.statusCode = 200
                } else {
                    res.writeHead(404, 'Not Found')
                }

                res.end()
            }
            break

        default:
            res.writeHead(400, 'Bad Request', { 'Content-Type': 'text/plain' })
            res.end('Bad Request.')
    }
}).listen(3000)
