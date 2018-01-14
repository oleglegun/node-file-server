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
const config = require('config')
const { saveFile, sendFile, deleteFile } = require('./handlers')
const { isValidFilePath } = require('./helpers')

const PORT = config.get('port')
const FILES_DIR = config.get('filesDir')
const PUBLIC_DIR = config.get('publicDir')
const MAX_UPLOAD_FILE_SIZE = config.get('maxUploadFileSize')

const server = new Server((req, res) => {
    const reqPathname = decodeURI(url.parse(req.url).pathname)

    if (!isValidFilePath(reqPathname)) {
        // invalid path
        res.statusCode = 400
        res.end('Bad request.')
        return
    }

    const filePath = FILES_DIR + reqPathname

    console.log('<CLIENT_REQUEST>\t', req.method, reqPathname)

    switch (req.method) {
        case 'GET':
            if (reqPathname === '/') {
                // index page
                sendFile(PUBLIC_DIR + '/index.html', res, 'text/html:charset=utf-8')
                return
            }

            // send file requested file
            sendFile(filePath, res, mime.getType(filePath))
            break

        case 'POST':
            saveFile(filePath, req, res, MAX_UPLOAD_FILE_SIZE)
            break

        case 'DELETE':
            deleteFile(filePath, res)
            break

        default:
            res.writeHead(400, 'Bad Request', { 'Content-Type': 'text/plain' })
            res.end('Bad Request.')
    }
})

module.exports = server
