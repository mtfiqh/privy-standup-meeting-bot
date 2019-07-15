const {App} = require('../core/App')
const msg = require('./resources/DayOff.config')
const moment = require('moment')

class DayOff extends App{
    constructor(bot,userID){
        super()
        this.register([
            'onStart',
            'onChange',
            'onSelectType',
            'onDateClicked',
            'onClose',
            'onEmpty',
            'onAddName',
            'onBackPressed',
            'onTypeListen',
            'onSave',
            'onCancel'
        ])

        // Define Class variable here
        this.prefix = `${DayOff.name}@${userID}`
        this.userID = userID
        this.state=[]
        this.bot=bot
        this.visited = new Set([])
        this.selectedDate = ''
        this.holiday = {
            name:{},
            date:{}
        }
    }

    onStart({from,chat},first = false){
        this.from = from
        this.chat = chat
        this.visited.clear()
        this.onVisit('onStart',{from,chat})
        const opts = msg.dayOffMenu(this.prefix)
        moment.locale('id')
        return {
            type: "Edit",
            id:this.userID,
            message: `Choose Categories`,
            options: opts 
        }
    }

    async onBackPressed(){
        let {func,args} = this.state.pop()
        this.visited.delete(func)
        const response = await this[func].call(this,args)
        console.log(response)
        return response
        
    }

    onVisit(name,args){
        if(!(this.visited.has(name))){
            this.visited.add(name)
            this.state.push({func:name,args:args})        
        }
    }

    onChange(params){        
        let message = "Silahkan pilih tanggal libur "
        let [type,count] = params.split('#')
        const opts = msg.generateCalendar(this.prefix,type,count)
        return {
            type:'Edit',
            id:this.userID,
            message: message,
            options:opts

        }
    }

    onSelectType(params){
        const opts = msg.calendarLayout(this.prefix)
        this.type = params
        return {
            type:'Edit',
            id:this.userID,
            message: "Silahkan pilih tanggal libur ",
            options:opts
        }
    }

    onDateClicked(params){
        let [date,y,x] = params.split('#')
        let [year,month,day] = date.split('/')
        let today = new Date()
        let opts = msg.generateCalendar(this.prefix,date,(parseInt(month)-1)                -today.getMonth(),{x,y})

        this.selectedDate = date
        msg.generateSaveButton(date,this.prefix)
        return {
            type:'Edit',
            id:this.userID,
            message: `Hari yang dipilih ${this.getLocalDate(date)}`,
            options:opts
        }


    }

    onTypeListen(context){
        this.holiday.name = context.text
        let opts = msg.generateSaveButton(this.selectedDate,this.prefix,'confirm')
        return {
            record:true,
            prefix:'DayOff',
            userID:this.userID,
            type:'Send',
            id:this.userID,
            message:`Tanggal : *${this.getLocalDate(this.selectedDate)}*\nKeterangan : ${this.holiday.name}`,
            options:opts   
        }
    }

    onSave(){
        let opts = msg.completeOptionClose(this.prefix)
        return {
            type:'Edit',
            message:'Sukses!',
            options:opts
        }
    }

    onCancel(){
        console.log('Cancel')
        return this.onBackPressed()
    }


    /**
     * Get locale date in id
     * 
     * @param {String} date - format 'YYYY/MM/DD'
     * 
     * @returns {String} - Date in locale format 
     */
    getLocalDate(date){
        let [year,month,day] = date.split('/')
        let localDate = moment(`${year}/${month}/${day}`,'YYYYMMDD').format('LLLL')
        return localDate.slice(0,localDate.length-11)
    }

    /**
     * 
     * @param {String} params - Date in YYYY/MM/DD
     */
    onAddName(params){
        this.holiday.date = params
        
        return {
            record:true,
            prefix:'DayOff',
            userID:this.userID,
            listenType:true,
            type:'Edit',
            id:this.userID,
            message: `Hari yang dipilih *${this.getLocalDate(this.selectedDate)}*,\nMasukkan keterangan libur : `,
            options:{
                parse_mode:'Markdown'
            }
        }
    }

    onEmpty(){

    }

    onClose(){    
        return {
            destroy:true,
            id:this.userID,
            prefix:this.prefix
        }
    }
}

module.exports={DayOff}