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
            'byDay'
        ])
    }

    async getListDayOff(by){
        console.log('date', this.date)
        const setListDayOff = (dayOff)=>{
            console.log('ini day off list\n',dayOff)
        }
        await getDayOff(this.date, by).then(setListDayOff.bind(this))
    }

    async byDay(){
        await this.getListDayOff('day')
    }
}

module.exports={ListCuti}