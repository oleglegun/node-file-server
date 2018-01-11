const fs = require('fs')

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

function saveFile(path, req, res, fileSizeLimit) {
    // Create new file and write to it
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
                res.statusCode = 500
                res.end('Server error.')
                console.log(err)
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
                // if we .end res => req will end too, i.e. the same connection
                res.end('Uploaded file size exceeds the limit')

                // Destroy stream
                file.destroy()

                // Delete file
                fs.unlink(path, err => {
                    if (err) {
                        console.error(err)
                    } else {
                        console.log('<FILE_DELETE_SUCCESS>', path)
                    }
                })
            }
        })
        .pipe(file)
}

exports.sendFile = sendFile
exports.deleteFile = deleteFile
exports.saveFile = saveFile
