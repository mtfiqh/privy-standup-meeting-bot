const TelegramBot   = require("node-telegram-bot-api")
const {AddTasks} = require('./app/addTasks.js')
const {Menu} = require('./app/menu')

const bot =  new TelegramBot(process.env.BOT_TOKEN, {polling:true})
const addTasks = new AddTasks(bot)
const menu = new Menu(bot)
// global var
const lookUp = {
    "addTasks"  : addTasks,
    "menu"      : menu
}

/**
 * accept any message
 * 
 */
bot.on("message", context=>{
    const {from,chat,text}=context
    try{
        //untuk function 'addTasks'
        if(addTasks.cache[from.id]){
            addTasks.listen(addTasks.cache[from.id].session, context)
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

bot.onText(/\/Tasks/, (context, match)=>{
    try{
        const {from} = context
        menu.onTasks(from)
    }catch(e){
        console.log(e)
    }
})



function handleRespond(response, to, message_id) {
    if (response) {
        if (response.deleteLast) {
            bot.deleteMessage(to, message_id)
        }
        if (response.message) {
            bot.sendMessage(to, response.message, response.options)
        }
    }else{
        console.log(response)
    }
}
bot.on('callback_query', async query => {
    try {
        const { from, message, data: command } = query
        const [lookUpKey, action, address] = command.split('-')
        const currentApp = lookUp[lookUpKey]
        const response = await currentApp.listen(action, address)
        handleRespond(response, from.id, message.message_id)    
    } catch (error) {
        console.log(error.message)
    }
    
})
