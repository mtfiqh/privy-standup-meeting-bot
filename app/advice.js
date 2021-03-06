
const {App} = require('../core/App')
const {makeKeyboard} = require('./Calendar')
const db = require('./DataTransaction')
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
        db.addAdvice(this.data, this.name)
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

    async onRead(){
        this.lists=[]
        const setAdvice = (lists) =>{
            this.lists = lists
        }
        await db.getAdvice().then(setAdvice.bind(this))
        let message = `Berikut list feedback yang ada:\n`
        let i=1
        for(let list of this.lists){
            message+=`\n${i}. ${list.advice}\nBy: ${list.name}\n`
            i++
        }
        return{
            type:'Send',
            id:this.id,
            message:message,
            destroy:true,
            options:{
                parse_mode:"Markdown"
            }
        }
    }

}

module.exports = {
    Advice
}

const ad = new Advice('advice@123', 123, 'abc')
ad.onRead()