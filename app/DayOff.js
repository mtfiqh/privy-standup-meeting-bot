const {App} = require('../core/App')
const {addHoliday,isAdmin} = require('./DataTransaction')
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
            'onCancel',
            'onListHolidayClicked',
            'onListDayOffClicked',
            'onYearClicked'
        ])

        // Define Class variable here
        this.prefix = `${DayOff.name}@${userID}`
        this.userID = userID
        this.state=[]
        this.bot=bot
        this.visited = new Set([])
        this.selectedDate = ''
        this.listenTo = 'nothing'
        this.holiday = {
            name:{},
            date:{}
        }
    }

    async onStart({from,chat},first = false){
        this.from = from
        this.chat = chat
        this.visited.clear()

        const load = result => { this.isAdmin = result }
        await isAdmin(chat.id).then(load.bind(this))
        this.onVisit('onStart',{from,chat})
        const opts = msg.dayOffMenu(this.prefix,this.isAdmin)
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
        if(params=='Cuti'){
            return  {
                type:'Auto',
                message:'/cuti'
            }
        }
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
        let dateTo = new Date(year,month)
        let dateDiff = this.countMonthBetween(today,dateTo)
        let opts = msg.generateCalendar(this.prefix,date,dateDiff-1,{x,y})
        console.log(dateDiff)
        this.selectedDate = date
        msg.generateSaveButton(date,this.prefix)
        return {
            type:'Edit',
            id:this.userID,
            message: `Hari yang dipilih ${this.getLocalDate(date)}`,
            options:opts
        }
    }

    countMonthBetween(date1,date2){
        return date2.getMonth()-date1.getMonth()+(12*(date2.getFullYear()-date1.getFullYear()))
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
        addHoliday(this.holiday)
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
     * On click show years
     */
    async onListHolidayClicked(){
        const opts = await msg.getYear(this.prefix)
        return {
            type:'Edit',
            message:'Choose Year : ',
            options:opts
        }
    }

    onListDayOffClicked(){
        return {
            type:'Auto',
            message:'/listCuti'
        }
    }

    onYearClicked(params){
        return msg.getHolidays(this.prefix,params)
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
            type:'Delete',
            destroy:true,
            id:this.userID,
            prefix:this.prefix
        }
    }
}

module.exports={DayOff}