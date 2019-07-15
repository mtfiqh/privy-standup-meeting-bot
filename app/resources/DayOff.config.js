const {getUsersData}=require('../../app/DataTransaction')
const em = require('./emoticons.config')
const {spaces} = require('../helper/helper')
const {calendar,months} = require('./calendar.config')

const dateCalc  = require("add-subtract-date")

const dayOffMenu=(prefix)=>{
    let space = spaces(9)
    this.prefix = prefix
    return {
        reply_markup: {
            inline_keyboard: [
                [
                    {text:`${space}Holiday${space}`,
                    callback_data:`${prefix}-onSelectType-Holiday`},
                    {text:`${space}Day-Off${space}\t`,
                    callback_data:`${prefix}-onSelectType-Vacation`}
                ],
                [ 
                    {text:`${em.delete} Close`,callback_data:`${this.prefix}-onClose-`}
                ]
            ]
        }
    }
}

const completeOptionClose =(prefix)=>{
    return {
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
    date = new Date()
    date = new Date(date.getFullYear(),date.getMonth())

    if(option==='next'){
        count++
    }else if(option==='prev'){
        count--
    }

    if(calendar.length==10){
        calendar.pop()
    }

    if(count!=0){
        date = dateCalc.add(date,parseInt(count),'months')
    }
    
    let nextMonth = `next#${count}`
    let prevMonth = `prev#${count}`
  
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
        date = new Date(dateCalc.add(date,1,'day'))
        if(date.getDay()==0){
            w++
        }
    }
    calendar[8][0].callback_data = `${prefix}-onChange-${prevMonth}`
    calendar[8][1].callback_data = `${prefix}-onBackPressed-`
    calendar[8][2].callback_data = `${prefix}-onChange-${nextMonth}`
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
    generateSaveButton,
    completeOptionClose
}