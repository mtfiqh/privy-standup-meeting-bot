
const {App} = require('../core/App')

class Advice  extends App {

    constructor(prefix, id, name){
        super()
        this.prefix = prefix;
        this.id = id
        this.name = name

        this.register([
            'onRequest'
        ])
    }

    onRequest(){
        return {
            type:"Listen",
            id: this.id,
            message: 'Masukkan Masukan Anda!',
            options: {
                parse_mode: "Markdown"
            }
        }
    }
}

module.exports = {
    Advice
}