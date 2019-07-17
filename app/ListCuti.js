const { App } = require('../core/App')

class ListCuti extends App{
    constructor(prefix, userID, name){
        super()
        this.addCache('prefix', prefix)
        this.addCache('userID', userID)
        this.addCache('name', name)
        this.prefix=`${prefix}@${userID}`
        this.date = new Date()
    }

    
}