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
        .pipe(res)
        .on('close', () => console.log('<FILE_CLOSE_SUCCESS>\t', path))
}

function deleteFile(path) {
    fs.unlink(path, err => {
        if (err) {
            return false
        } else {
            return true
        }
    })
}

function saveFile(readableStream) {}

exports.sendFile = sendFile
exports.deleteFile = deleteFile
exports.saveFile = saveFile
