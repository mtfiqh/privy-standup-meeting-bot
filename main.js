const TelegramBot   = require("node-telegram-bot-api")
const {Tasks} = require('./app/Tasks.js')


const bot =  new TelegramBot(process.env.BOT_TOKEN, {polling:true})
const tasks = new Tasks(bot)
// global var
const lookUp = {
    "tasks" : tasks
}

/**
 * accept any message
 * 
 */
bot.on("message", context=>{
    const {from,chat,text}=context
    try{
        //untuk function 'tasks'
        if(tasks.cache[from.id]){
            tasks.listen(tasks.cache[from.id].session, context)
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

bot.onText(/\/tasks/, (context, match)=>{
    try{
        const {from} = context
        tasks.showButton(from)
    }catch(e){
        console.log(e)
    }
})



bot.on('callback_query', async query => {
    try {
        const {from, message, data:command} = query
        const [lookUpKey, action, address] = command.split('-')
        const currentApp = lookUp[lookUpKey]
        const response = await currentApp.listen(action,address)
        handleRespond(response, from.id, message.message_id)    
    } catch (error) {
        console.error("Error on callback_query", error.message)
    }
    
})


function handleRespond(response, to, message_id) {
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

    if(!response) return

    const {type} = response
    if(type=="Edit"){
        bot.editMessageText(response.message,{
            message_id:message_id,
            chat_id:to,
            ...response.options
        })
    }else{
        bot.sendMessage(to, response.message, response.options)
    }
}