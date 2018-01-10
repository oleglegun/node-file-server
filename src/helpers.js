const isInvalid = require('is-invalid-path')

function isValidFilePath(path) {
    // check for invalid characters
    // check if path is not nested
    return !isInvalid(path) && !(path.match(/\//g).length - 1)
}

exports.isValidFilePath = isValidFilePath
