const config = require('config')
const server = require('./server')

const PORT = config.get('port')

server.listen(PORT, () => console.log('Listening on', PORT))
