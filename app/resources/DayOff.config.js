const {getUsersData}=require('../../app/DataTransaction')
const em = require('./emoticons.config')
const {spaces} = require('../helper/helper')

const dateCalc  = require("add-subtract-date")

let months = [
    'January','February','March','April','May','June','July','August','September','October',
    'November','December'
]

let calendar = [
    [],
    [
        {text:'S',callback_data:'null'},{text:'M',callback_data:'null'},
        {text:'T',callback_data:'null'},{text:'W',callback_data:'null'},
        {text:'T',callback_data:'null'},{text:'F',callback_data:'null'},
         {text:'S',callback_data:'null'}],
    [
        {text:'-',callback_data:'-'},{text:'-',callback_data:'-'},
        {text:'-',callback_data:'-'},{text:'-',callback_data:'-'},
        {text:'-',callback_data:'-'},{text:'-',callback_data:'-'},
        {text:'-',callback_data:'-'}],//2
    [
        {text:'-',callback_data:'-'},{text:'-',callback_data:'-'},
        {text:'-',callback_data:'-'},{text:'-',callback_data:'-'},
        {text:'-',callback_data:'-'},{text:'-',callback_data:'-'},
        {text:'-',callback_data:'-'}],
    [
        {text:'-',callback_data:'-'},{text:'-',callback_data:'-'},
        {text:'-',callback_data:'-'},{text:'-',callback_data:'-'},
        {text:'-',callback_data:'-'},{text:'-',callback_data:'-'},
        {text:'-',callback_data:'-'}],
    [
        {text:'-',callback_data:'-'},{text:'-',callback_data:'-'},
        {text:'-',callback_data:'-'},{text:'-',callback_data:'-'},
        {text:'-',callback_data:'-'},{text:'-',callback_data:'-'},
        {text:'-',callback_data:'-'}],
    [
        {text:'-',callback_data:'-'},{text:'-',callback_data:'-'},
        {text:'-',callback_data:'-'},{text:'-',callback_data:'-'},
        {text:'-',callback_data:'-'},{text:'-',callback_data:'-'},
        {text:'-',callback_data:'-'}],
    [
        {text:'-',callback_data:'-'},{text:'-',callback_data:'-'},
        {text:'-',callback_data:'-'},{text:'-',callback_data:'-'},
        {text:'-',callback_data:'-'},{text:'-',callback_data:'-'},
        {text:'-',callback_data:'-'}],
    [
        {text:`${em.left} Prev`,callback_data:'-'},
        {text:`${em.home} Menu`,callback_data:'-'},
        {text:`${em.right} Next`,callback_data:'-'}
    ]
]

const dayOffMenu=(prefix)=>{
    let space = spaces(9)
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

const generateSaveButton =(date,prefix)=>{
    let saveButton = [
        {text:"Save",callback_data:`${prefix}-onAddName-${date}`}
    ]
    if(calendar.length==10) calendar.pop()
    calendar.push(saveButton)
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
    generateSaveButton
}