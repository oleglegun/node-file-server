const fs = require('fs')
const log = require('./logger')

// sendFile opens the file on `path` and pipes it to the response `res`.
function sendFile(path, res, mimeType) {
    const fileStream = fs.createReadStream(path)

    fileStream
        .on('open', () => log.info('File opened: %s', path))
        .on('error', err => {
            if (err.code === 'ENOENT') {
                log.warn('File not found: %s', path)
                res.statusCode = 404
                res.end('File not found.')
            } else {
                log.error('File read error: %s', path)
                res.statusCode = 500
                res.end('Server error.')
            }
        })
        .on('close', () => log.info('File closed: %s', path))
        .pipe(res)
}

// deleteFile unlinks the file on `path` and writes the result to the response `res`.
function deleteFile(path, res) {
    fs.unlink(path, err => {
        if (err) {
            switch (err.code) {
                case 'ENOENT':
                    res.statusCode = 404
                    res.end('File not found.')
                    break
                default:
                    log.info('File delete error: %s', err.message)
                    res.statusCode = 500
                    res.end('Server Error.')
            }
            return
        }

        log.info('File deleted: %s', path)
        res.statusCode = 200
        res.end('File deleted.')
    })
}

// saveFile creates the file on `path`, pipes request body to the file and when
// finished, writes the result to the response `res`.
function saveFile(path, req, res, fileSizeLimit) {
    // flag wx - fails if file already exist
    const file = fs.createWriteStream(path, { flags: 'wx' })

    let uploadedBytes = 0

    file
        .on('error', err => {
            if (err.code === 'EEXIST') {
                res.statusCode = 409
                res.end('File already exists.')
                log.warn('File open error (EEXIST): %s', path)
            } else {
                log.error('File error: %s', err.message)
                if (res.headersSent) {
                    res.writeHead(500, { Connection: 'close' })
                    res.write('Server error.')
                }

                fs.unlink(path, err => {
                    res.end()
                })
            }
        })
        .on('close', () => {
            // File is saved = transmission is over
            res.statusCode = 200
            res.end('File uploaded.')
            log.info('File saved: %s (%s)', path, `(${uploadedBytes / 10e6} MB)`)
        })

    req
        .on('error', err => {
            log.error('Connection error: %s', err.message)
        })
        .on('end', () => {
            // All data consumed
            file.close()
        })
        .on('close', () => {
            // disconnect
            log.warn('Connection closed (disconnect).')
            file.destroy()
            fs.unlink(path, err => {
                if (err) {
                    log.error('File delete error: %s', err.message)
                } else {
                    log.info('File deleted: %s', path)
                }
            })
        })
        // we can use many 'data' handlers like `pipe`
        .on('data', chunk => {
            uploadedBytes += chunk.length

            if (uploadedBytes > fileSizeLimit) {
                res.statusCode = 413

                // Close keep-alive connection, otherwise the browser continues sending data
                // https://stackoverflow.com/questions/18367824/how-to-cancel-http-upload-from-data-events
                res.setHeader('Connection', 'close')

                // if we .end res => req will end too, i.e. the same connection
                res.end('Uploaded file size exceeds the limit.')

                // Destroy stream
                file.destroy()

                // Delete file
                fs.unlink(path, err => {
                    if (err) {
                        log.error('File delete error: %s', err.message)
                    } else {
                        log.info('File deleted: %s', path)
                    }
                })
            }
        })
        .pipe(file)
}

module.exports = { sendFile, deleteFile, saveFile }
