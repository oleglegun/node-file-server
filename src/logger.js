const winston = require('winston')
const { combine, timestamp, splat, printf } = winston.format

const errorsFile = new winston.transports.File({
    filename: 'logs/errors.log',
    level: 'error',
})

const exceptionsFile = new winston.transports.File({
    filename: 'logs/exceptions.log',
})

const combinedFile = new winston.transports.File({
    filename: 'logs/combined.log',
    level: 'info',
})

const testFile = new winston.transports.File({
    filename: 'logs/test.log',
    level: 'info',
})

const console = new winston.transports.Console({
    level: 'warn',
})

const logger = winston.createLogger({
    level: 'info',
    format: combine(
        timestamp(),
        splat(),
        printf(info => `${info.timestamp} [${info.level}] ${info.message}`)
    ),
    transports: [errorsFile, combinedFile],
    exceptionHandlers: [exceptionsFile],
})

if (process.env.NODE_ENV !== 'production') {
    logger.add(console)
}

if (process.env.NODE_ENV === 'test') {
    logger.clear().add(testFile)
}

module.exports = logger
