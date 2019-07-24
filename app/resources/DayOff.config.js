const {getYearsFromDayOff,getHoliday}=require('../../app/DataTransaction')
const em = require('./emoticons.config')
const {spaces} = require('../helper/helper')
const {calendar,months} = require('./calendar.config')
const moment = require('moment')

const dateCalc  = require("add-subtract-date")

const dayOffMenu=(prefix,isAdmin)=>{
    let space = spaces(9)
    this.prefix = prefix

    const adminKeyboard = [
        [
            {text:`${space}Holiday${space}`,
            callback_data:`${prefix}-onSelectType-Holiday`},
            {text:`${space}Day-Off${space}\t`,
            callback_data:`${prefix}-onSelectType-Cuti`}
        ],
        [
            {text:`${space}List Holiday${space}`,
            callback_data:`${prefix}-onListHolidayClicked-`},
            {text:`${space}List Day-Off${space}\t`,
            callback_data:`${prefix}-onListDayOffClicked-`}
        ],
        [ 
            {text:`${em.delete} Close`,callback_data:`${prefix}-onClose-`}
        ]
    ]

    const userKeyboard = [
        [
            {text:`${space}Day-Off${space}\t`,
            callback_data:`${prefix}-onSelectType-Cuti`}
        ],
        [
            {text:`${space}List Holiday${space}`,
            callback_data:`${prefix}-onListHolidayClicked-`},
            {text:`${space}List Day-Off${space}\t`,
            callback_data:`${prefix}-onListDayOffClicked-`}
        ],
        [ 
            {text:`${em.delete} Close`,callback_data:`${prefix}-onClose-`}
        ]
    ]
    if(isAdmin){
        return {
            reply_markup: {
                inline_keyboard: adminKeyboard
            }
        }
    }
    
    return {
        reply_markup: {
            inline_keyboard: userKeyboard
        }
    }
}

const completeOptionClose =(prefix)=>{
    return {
        parse_mode:'Markdown',
        reply_markup: {
            inline_keyboard: [
                [ 
                    {text:`${em.delete} Close`,callback_data:`${prefix}-onClose-`}
                ]
            ]
        }
    }
}

const calendarLayout=(prefix)=>{
    return generateCalendar(prefix,'now',0)
}

const generateCalendar = (prefix,option,count,pos=null)=>{
    reset(prefix)
    let w = 2
    let today = new Date()
    if(option==='next'){
        count++
    }else if(option==='prev'){
        count--
    }
    
    let nextMonth = `next#${count}`
    let prevMonth = `prev#${count}`
    calendar[8][0].text          = `${em.left} Prev`
    calendar[8][0].callback_data = `${prefix}-onChange-${prevMonth}`
    calendar[8][1].callback_data = `${prefix}-onBackPressed-`
    calendar[8][2].callback_data = `${prefix}-onChange-${nextMonth}`
    date = new Date()
    date = new Date(date.getFullYear(),date.getMonth())

    if(calendar.length==10){
        calendar.pop()
    }
    if(count>0){
        date = dateCalc.add(date,parseInt(count),'months')
    }else{
        calendar[8][0].text = `${em.delete}`
        calendar[8][0].callback_data = `${prefix}-onBackPressed-`
    }
    
  
    let month = date.getMonth()

    calendar[0][0] = {text:months[month]+' '+date.getFullYear(),callback_data:`${prefix}-onMonth-`}
    while(date.getMonth() === month){
        calendar[w][date.getDay()].text = date.getDate().toString() 
        calendar[w][date.getDay()].callback_data = prefix+'-onDateClicked-' +date.getFullYear()+'/'+(month+1)+'/'+date.getDate()+'#'+w+'#'+date.getDay()
        
        if(pos!=null){
            if((w==pos.y)&&(date.getDay()==pos.x)){
                calendar[w][date.getDay()].text = `${em.done}`
            }
        }
        if(count==0){
            if(date.getDate()<today.getDate()){
                calendar[w][date.getDay()].text = `${em.delete}` 
                calendar[w][date.getDay()].callback_data = `${prefix}-onEmpty`
            }
        }

        date = new Date(dateCalc.add(date,1,'day'))
        if(date.getDay()==0){
            w++
        }
    }
    return {
        reply_markup: {
            inline_keyboard: calendar
        }
    }
}

const generateSaveButton =(date,prefix,dest='calendar')=>{
    let saveButton
    let space = spaces(6)
    if(dest=='calendar'){
        saveButton = [
            {text:"Save",callback_data:`${prefix}-onAddName-${date}`}
        ]
        if(calendar.length==10) calendar.pop()
        calendar.push(saveButton)
    }else if(dest=='confirm'){
        return {
            parse_mode:'Markdown',
            reply_markup: {
                inline_keyboard: [
                    [
                        {text:`${space}Save${space}`,
                        callback_data:`${prefix}-onSave-`},
                        {text:`${space}Cancel${space}\t`,
                        callback_data:`${prefix}-onCancel-`}
                    ]
                ]
            }
        }
    }

}

const getHolidays = async (prefix,year)=>{
    const list    = await getHoliday(parseInt(year))
    let message = `List holiday : \n`
    let counter   = 1
    let opts = completeOptionClose(prefix)
    console.log(list)
    for(item of list){
        let date = moment(item.date,'YYYYMMDD').format('LLLL')
        date = date.slice(0,date.length-11)
        message = message.concat(`${counter}. *${item.name}*\n\t\t\t${date}\n\n`)
        counter++
    }
    return {
        type:'Edit',
        message:message,
        options:opts
    }
}

const getYear = async (prefix)=>{
    const keyboard = []
    await getYearsFromDayOff().then(results=>{
        results.forEach(res=>{
            let tmp = []
            tmp.push({text:res,callback_data:`${prefix}-onYearClicked-${res}`})
            keyboard.push(tmp)
        })
        
    })
    console.log(keyboard)
    return {
        parse_mode:'Markdown',
        reply_markup: {
            inline_keyboard: keyboard
        }
    }
}

const reset=(prefix)=>{
    for(let i = 2;i<8;i++){
        for(let j = 0;j<7;j++){
            calendar[i][j] = {text:'-',callback_data:`${prefix}-onEmpty-`}
        }
    }
}

module.exports={
    calendarLayout,
    generateCalendar,
    dayOffMenu,
    getYear,
    generateSaveButton,
    completeOptionClose,
    getHolidays
}