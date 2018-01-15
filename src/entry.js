const config = require('config')
const server = require('./server')
const log = require('./logger')

const PORT = config.get('port')

server.listen(PORT, () => log.info('Server started. Listening on port %d.', PORT))
