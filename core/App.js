const TIME_OUT = require('../app/helper/config').getSettings().sessionTimeout
class App {
    constructor() {
        if (this.constructor === App) {
            throw new TypeError("Abstract class 'App' cannot be instantiated directly.")
        }
        this.lookUp = new Set([]) // action-methods name
        this.cache = {}
        this.startTime = new Date().getTime()        
    }

    addCache(key, payloads){
        if(this.cache[key]){
            throw new Error("key is exist!")
        }
        this.cache[key] = payloads
        return this
    }
    /**
     * Register the function in the instance class to the lookUp variable
     * @param {Array} functionNames - Array of Functions Name
     */
    register(functionNames) {
        for (let name of functionNames) {
            this.lookUp.add(name)
        }
    }
    /**
     * Call functions that are in the appropriate lookUp variable
     * @param {string} action  - method name
     * @param {any} args    - optional data
     * @return {any}           - return from action method
     */
    listen(action, args) {
        if(!this.lookUp.has(action)){
            throw new Error(
                `Action '${action}' on '${this.constructor.name}' has not been registered!`,
            )
        }  
        this.startTime = new Date().getTime()
        //call action-method using method name
        return this[action].call(this, args)
    }

    startNewSession(){
        return {
            type:"Restart",
            id:this.id,
            activity:this.prefix,
        }
    }

    get durration(){
        const endTime = new Date().getTime()
        return (endTime-this.startTime)/1000
    }

    isNewSession(){
        return this.durration>= TIME_OUT
    }
}


module.exports = {
    App
}