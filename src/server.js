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
    const reqPathname = decodeURI(url.parse(req.url).pathname)

    if (!isValidFilePath(reqPathname)) {
        // invalid path
        res.statusCode = 400
        res.end('Bad request.')
        return
    }

    const filePath = FILES_DIR + reqPathname

    switch (req.method) {
        case 'GET':
            if (reqPathname === '/') {
                // index page
                sendFile(
                    PUBLIC_DIR + '/index.html',
                    res,
                    'text/html:charset=utf-8'
                )
                return
            }

            // send file requested file
            sendFile(filePath, res, mime.getType(filePath))
            break

        case 'POST':

        case 'DELETE':
            if (isValidFilePath(reqPathname)) {
                if (deleteFile(filePath)) {
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
