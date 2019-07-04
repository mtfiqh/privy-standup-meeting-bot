
class App {
    constructor() {
        if (this.constructor === App) {
            throw new TypeError("Abstract class 'App' cannot be instantiated directly.")
        }
        this.lookUp = {} // {functionName : function}
        this.cache = {}
    }

    addCache(key, payloads){
        if(this.cache[key]){
            throw new Error("key is exist!")
        }
        this.cache[key] = payloads
    }
    /**
     * Register the function in the instance class to the lookUp variable
     * @param {Array} func - Array of Function
     */
    register(func) {
        for (let fn of func) {
            const name = fn.name
            this.lookUp[name] = fn
        }
    }
    /**
     * Call functions that are in the appropriate lookUp variable
     * @param {string} action  - method name
     * @param {Object} args    - optional data
     * @return {any}           - return from action function
     */
    listen(action, args) {
        return this.lookUp[action].call(this, args)
    }
}


module.exports = {
    App
}