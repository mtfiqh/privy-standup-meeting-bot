const TelegramBot   = require("node-telegram-bot-api")
const db            = require('./app/DataTransaction')
const helper        = require('./app/helper/helper')
const { Report }    = require('./app/Report')
const lookUp        = {} 
const bot           =  new TelegramBot(process.env.BOT_TOKEN, {polling:true})

bot.on('callback_query', query => {
    try {
        const {from, message, data:command} = query
        const [lookUpKey, action, address] = command.split('-')
        const currentApp = lookUp[lookUpKey]
        const response = currentApp.listen(action,address)
        handleRespond(response, from.id, message.message_id)    
    } catch (error) {
        console.error("Error on bo.on('callback_query') (main.js)", error.message)
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
    console.log(`message_id :${message_id}`)
    if(type=="Edit"){
        bot.editMessageText(response.message,{
            message_id:message_id,
            chat_id:to,
            ...response.options
        })
    }else if(type=="Delete"){
        bot.deleteMessage(response.id, message_id)
    }else{
        bot.sendMessage(to, response.message, response.options)
    }
}

//  UserReport trigger
bot.onText(/\/req/, async context => {
    const {from, message_id} = context
    const {id, first_name:name}  = from
    const response = await initUserReport(id, name, message_id)
    await bot.sendMessage(id, response.message,response.options).then(()=>{
        bot.deleteMessage(id, message_id)
    })
})

// Register Current User to lookUp as Report@userId
async function initUserReport(id, name){
    const prefix = `Report@${id}`
    const  response = {
        message:`Halo *${name}* Berikut adalah task Anda yang masih *In Progress*. Pilih task yang sudah *Done*.`,
        options:{
            parse_mode: 'Markdown',
            reply_markup:{}
        }
    }
    await db.getUserTasks(id).then( results => {
        const projects = helper.parseToReportFormat(results)
        const {inlineKeyboard, addrs} = helper.generateTasksKeyboard( projects[id], prefix)
        // regiter current user to lookUp as Report@userId
        lookUp[prefix] = new Report(projects[id], id, name, inlineKeyboard).addCache(prefix, addrs)
        response.options.reply_markup = { inline_keyboard:inlineKeyboard }
    })
    return response
}