const {App} = require('../core/App')
const msg = require('./resources/DayOff.config')


class DayOff extends App{
    constructor(bot,userID){
        super()
        this.register([
            this.onStart.name,
            this.onNext.name,
            this.onPrev.name,
            this.onChange.name
        ])

        // Define Class variable here
        this.prefix = `${DayOff.name}@${userID}`
        this.state=[]
        this.bot=bot
    }


    /**
     * response = {
     *     type : type case (ex."Edit") (required!)
     *     from : prefix,
     *     message: message
     *     options: inlineKeyboardOption
     *     deleteLast : boolean
     *     agrs : any
     * }
     */

     
    onStart({from,chat}){
        this.from = from
        this.chat = chat
        const opts = msg.startLayout(this.prefix,from,this)
        this.bot.sendMessage(chat.id,'Cuti',opts)
    }

    onNext(params){
        let tmp = new Date(params)
        const opts = msg.generateLayout(tmp,this.prefix)
        this.bot.sendMessage(this.chat.id,'Next',opts)
    }

    onPrev(params){        
        let tmp = new Date(params)
        const opts = msg.generateLayout(tmp,this.prefix)
        this.bot.sendMessage(this.chat.id,'Prev',opts)
    }

    onChange(params){        
        let [type,count] = params.split('#')
        const opts = msg.generateLayout(this.prefix,type,count)
        return {
            type:'Edit',
            id:this.userID,
            message: "Silahkan pilih tanggal dibawah ini ",
            options:opts

        }
//        this.bot.sendMessage(this.chat.id,'Prev',opts)
    }

}

module.exports={DayOff}