const TelegramBot   = require("node-telegram-bot-api")
const {AddTask} = require('./app/addTask.js')


const bot =  new TelegramBot(process.env.BOT_TOKEN, {polling:true})
const addTask = new AddTask(bot)
// global var
const lookUp = {
    "addTask" : addTask
}

/**
 * accept any message
 * 
 */
bot.on("message", context=>{
    const {from,chat,text}=context
    try{
        //untuk function 'addTask'
        if(addTask.cache[from.id]){
            if(addTask.cache[from.id].session==="onInsertTask"){
                addTask.onInsertTask(context)
            }else if(addTask.cache[from.id].session==="onInsertPriority"){
                addTask.onInsertPriority(context)
            }else if(addTask.cache[from.id].session==="onInsertProject"){
                addTask.onInsertProject(context)
            }else if(addTask.cache[from.id].session==="onMakeSure"){
                addTask.onMakeSure(context)
            }
        }

    }catch(e){
        console.log(e)
    }

})

bot.onText(/\/menu/, (context, match)=>{
    console.log("menu")
    const {from} = context
    bot.sendMessage(from.id, `Halo *${from.first_name}*!`, {
        'parse_mode': 'Markdown',
    })
})

bot.onText(/\/addTask/, (context, match)=>{
    try{
        const {from} = context
        addTask.onInsertTask(context)
    }catch(e){
        console.log(e)
    }
})


bot.on('callback_query', query => {
    const {from, message, data:command} = query
    const [lookUpKey, action, address] = command.split('-')
    const currentApp = lookUp[lookUpKey]
    currentApp.listen(action,currentApp.cache[address])
})
