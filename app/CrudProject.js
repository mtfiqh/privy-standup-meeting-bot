const {} = require("./DataTransaction")
const {App} = require('../core/App')

class CrudProject extends App{
    constructor(userID, name){
        super()
        this.addCache('userID', userID)
        this.addCache('name', name)
    }
    
    create(){
        
    }

    
}