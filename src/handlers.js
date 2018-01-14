const fs = require('fs')

// sendFile opens the file on `path` and pipes it to the response `res`.
function sendFile(path, res, mimeType) {
    const fileStream = fs.createReadStream(path)

    fileStream
        .on('open', () => console.log('<FILE_OPEN_SUCCESS>\t', path))
        .on('error', err => {
            if (err.code === 'ENOENT') {
                console.log('<FILE_NOT_FOUND>\t', path)
                res.statusCode = 404
                res.end('File not found.')
            } else {
                console.log('<FILE_READ_ERROR>\t', path)
                res.statusCode = 500
                res.end('Server error.')
            }
        })
        .on('close', () => console.log('<FILE_CLOSE_SUCCESS>\t', path))
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
                    console.log('<FILE_DELETE_ERROR>', path)
                    console.error(err)
                    res.statusCode = 500
                    res.end('Server Error.')
            }
            return
        }

        console.log('<FILE_DELETE_SUCCESS>\t', path)
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
                console.log('<FILE_OPEN_ERROR>\t', path, 'already exists')
            } else {
                console.log(err)
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
            console.log('<FILE_SAVE_SUCCESS>\t', path, `(${uploadedBytes / 10e6} MB)`)
        })

    req
        .on('error', err => {
            console.log(err)
        })
        .on('end', () => {
            // All data consumed
            file.close()
        })
        .on('close', () => {
            // disconnect
            console.log('<DISCONNECT>')
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
                        console.error(err)
                    } else {
                        console.log('<FILE_DELETE_SUCCESS>\t', path)
                    }
                })
            }
        })
        .pipe(file)
}

exports.sendFile = sendFile
exports.deleteFile = deleteFile
exports.saveFile = saveFile
