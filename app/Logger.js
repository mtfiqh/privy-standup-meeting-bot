const log       = require('simple-node-logger').createSimpleLogger()
class Logger{
    static err(name, reason){
        const message = `@${name} : ${reason} at ${new Date().toISOString()}`
        log.setLevel('error')
        log.error(message)
        return new Error(message)
    }

    static info(name,info){
        const message = `@${name} : ${info} at ${new Date().toISOString()}`
        log.setLevel('info')
        log.info(message)
    }
}

module.exports={
    Logger
}