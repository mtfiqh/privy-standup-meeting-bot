const TelegramBot = require("node-telegram-bot-api")
const { getUserTasks } = require('./app/DataTransaction')
const { parseToReportFormat, generateInlineKeyboardFrom } = require('./app/helper/helper')
const { Report } = require('./app/Report')
const { TakeOfferTask } = require('./app/TakeOfferTask')

const bot = new TelegramBot(process.env.BOT_TOKEN, { polling: true })

// global var
const lookUp = {}

bot.onText(/\/menu/, context => {
    const { from } = context
    bot.sendMessage(from.id, `Halo *${from.first_name}*!`, {
        'parse_mode': 'Markdown',
    })
})

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

bot.on('message', context => {
    console.log(context.message_id)
})


bot.onText(/\/req/, context => {
    const { from, message_id } = context
    las = message_id
    getUserTasks(from.id).then(results => {
        if (results.length !== 0) {
            const reportFormated = parseToReportFormat(results)
            const prefix = `Report@${from.id}`
            const { inlineKeyboard, addrs } = generateInlineKeyboardFrom(reportFormated[from.id], prefix)
            const report = new Report(reportFormated[from.id], from.id, from.first_name, inlineKeyboard)
            report.addCache(prefix, addrs)
            lookUp[prefix] = report
            bot.sendMessage(from.id,
                `Halo *${from.first_name}* berikut task anda yang masih *In Progress*, silahkan di klik untuk task yang sudah *Done*. `, {
                    'parse_mode': 'Markdown',
                    reply_markup: {
                        inline_keyboard: inlineKeyboard
                    }
                }).then(()=>{
                    bot.deleteMessage(from.id, message_id)
                })
        }
        else {
            bot.sendMessage(from.id, `Halo *${from.first_name}* semua progess anda sudah *Done*.`, {
                'parse_mode': 'Markdown',
            })
        }
    })

})

bot.onText(/\/offer/, context => {
    const { from, message_id } = context
    las = message_id
    getUserTasks(from.id).then(results => {
        if (results.length !== 0) {
            const reportFormated = parseToReportFormat(results)
            const prefix = `TakeOfferTask@${from.id}`
            const { inlineKeyboard, addrs } = generateInlineKeyboardFrom(
                    reportFormated[from.id], 
                    prefix,
                    "Process"
                )
            const takeOffer = new TakeOfferTask(
                    reportFormated[from.id], 
                    from.id, 
                    from.first_name, 
                    inlineKeyboard
                )

            takeOffer.addCache(prefix, addrs)
            lookUp[prefix] = takeOffer

            bot.sendMessage(from.id,
                `Halo *${from.first_name}* berikut task anda yang masih *In Progress*, silahkan di klik untuk task yang sudah *Done*. `, {
                    'parse_mode': 'Markdown',
                    reply_markup: {
                        inline_keyboard: inlineKeyboard
                    }
                }).then(()=>{
                    bot.deleteMessage(from.id, message_id)
                })
        }
        else {
            bot.sendMessage(from.id, `Halo *${from.first_name}* semua progess anda sudah *Done*.`, {
                'parse_mode': 'Markdown',
            })
        }
    })
})

function handleRespond(response, to, message_id) {
    if (response) {
        if(response.sender && response.receiver){
            const {sender, receiver} = response
            bot.sendMessage(receiver.id, receiver.message, receiver.options).then(()=>{
                bot.sendMessage(sender.id, sender.message, sender.options)
                    .then(bot.deleteMessage(sender.id, message_id))
            })
            bot.deleteMessage(receiver.id, message_id)

        }else{
            if (response.deleteLast) {
                // bot.deleteMessage(to, message_id)
                console.log("chat_id",message_id)
                bot.editMessageText(response.message,{
                    message_id:message_id,
                    chat_id:to,
                    ...response.options
                })
            }
            // if (response.message) {
            //     bot.sendMessage(to, response.message, response.options)
            // }
        }
        
    }else{
        console.log(response)
    }
}