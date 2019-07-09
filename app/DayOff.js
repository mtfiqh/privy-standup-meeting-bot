const {App} = require('../core/App')
const msg = require('./resources/DayOff.config')


class DayOff extends App{
    constructor(bot,userID){
        super()
        this.register([
            this.onStart.name,
            this.onChange.name,
            this.onSelectHoliday.name,
            this.onSelectDayOff.name,
            this.onClose.name
        ])

        // Define Class variable here
        this.prefix = `${DayOff.name}@${userID}`
        this.userID = userID
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

     
    onStart({from,chat},first = false){
        this.from = from
        this.chat = chat
        const opts = msg.dayOffMenu(this.prefix)
        return {
            type: "Edit",
            id:this.userID,
            message: `Choose Categories`,
            options: opts 
        }
    }

    onChange(params){        
        let [type,count] = params.split('#')
        const opts = msg.generateCalendar(this.prefix,type,count)
        return {
            type:'Edit',
            id:this.userID,
            message: "Silahkan pilih tanggal libur ",
            options:opts

        }
    }

    onSelectHoliday(){

    }

    onSelectDayOff(){

    }

    onClose(){
        return {
            destroy:true,
            id:this.userID,
            type:"Delete"
        }
    }
}

module.exports={DayOff}