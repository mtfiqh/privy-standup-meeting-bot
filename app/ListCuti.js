const { App } = require('../core/App')
const { getDayOff } = require('./DataTransaction')

class ListCuti extends App{
    constructor(prefix, userID, name){
        super()
        this.addCache('prefix', prefix)
        this.addCache('userID', userID)
        this.addCache('name', name)
        this.prefix=`${prefix}@${userID}`
        const date = new Date()
        this.date = {
            day:date.getDate(),
            month:date.getMonth()+1,
            year:date.getFullYear()
        }
        this.register([
            'byDay',
            'onClose',
            'byMonth',
            'byYear'
        ])
    }

    async getListDayOff(by){
        console.log('date', this.date)
        this.lists={}
        const setListDayOff = (dayOff)=>{
            // console.log('ini day off list\n',dayOff)
            this.lists=dayOff
        }
        await getDayOff(this.date, by).then(setListDayOff.bind(this))
    }

    onClose(){
        return{
            type:'Delete',
            id:this.cache.userID,
            destroy:true
        }
    }

    async byDay(){
        await this.getListDayOff('day')
        let text="", i=1
        for(let list of this.lists){
            text+=`${i}. ${list.user} - ${list.alasan}\n`
            i++
        }
        return{
            type:'Send',
            message:`Berikut daftar cuti pada ${this.date.day}/${this.date.month}/${this.date.year}\n${text}`,
            options:{
                reply_markup:{
                    inline_keyboard:[
                        [{text:'Close', callback_data:`${this.prefix}-onClose`}]
                    ]
                }
            }
        }
    }

    async byMonth(){
        await this.getListDayOff('month')
        let text="", i=1
        for(let list of this.lists){
            text+=`${i}. ${list.user} - ${list.alasan}\n${list.tanggal}\n\n`
            i++
        }
        return{
            type:'Send',
            message:`Berikut daftar cuti pada bulan ${this.date.month}\n${text}`,
            options:{
                reply_markup:{
                    inline_keyboard:[
                        [{text:'Close', callback_data:`${this.prefix}-onClose`}]
                    ]
                }
            }
        }
    }

    async byYear(){
        await this.getListDayOff('year')
        let text="", i=1
        for(let list of this.lists){
            text+=`${i}. ${list.user} - ${list.alasan}\n${list.tanggal}\n\n`
            i++
        }
        return{
            type:'Send',
            message:`Berikut daftar cuti pada tahun ${this.date.year}\n${text}`,
            options:{
                reply_markup:{
                    inline_keyboard:[
                        [{text:'Close', callback_data:`${this.prefix}-onClose`}]
                    ]
                }
            }
        }
    }
}

module.exports={ListCuti}