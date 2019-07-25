
const {App} = require('../core/App')
const {makeKeyboard} = require('./Calendar')
class Advice  extends App {

    constructor(prefix, id, name){
        super()
        this.prefix = prefix;
        this.id = id
        this.name = name

        this.register([
            'onRequest',
            'onCancel',
            'onRespond',
            "onSubmit"
        ])

        this.data = null
    }

    onRequest(){
        return {
            type:"Send",
            id: this.id,
            message: 'Ketik Masukan Anda!',
            options: {
                parse_mode: "Markdown"
            }
        }
    }

    onRespond(data){
        this.data = data
        const message = `Masukan anda :\n*${this.data}*\n\nSubmit?`
        return {
            type:"Edit",
            id:this.id,
            message: message,
            options: {
                parse_mode: "Markdown",
                reply_markup:{
                    inline_keyboard:[
                        [makeKeyboard(this.prefix, "Submit", "onSubmit"),
                        makeKeyboard(this.prefix, "Cancel", "onCancel"),]
                    ]
                }
            }
            
        }
    }

    onSubmit(){
        return {
            type:"Edit",
            id: this.id,
            message:"Success",
            options:{
                parse_mode:"Markdown"
            }
        }
    }

    onCancel(){
        this.data = null
        return {
            type:"Delete",
            id: this.id,
            destroy:true
        }
    }
}

module.exports = {
    Advice
}
