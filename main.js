const TelegramBot = require("node-telegram-bot-api")
const { getUserTasks } = require('./app/DataTransaction')
const { parseToReportFormat, generateInlineKeyboardFrom } = require('./app/helper/helper')
const { Report } = require('./app/Report')

const bot = new TelegramBot(process.env.BOT_TOKEN, { polling: true })

// global var
const lookUp = {}

bot.onText(/\/menu/, context => {
    const { from } = context
    bot.sendMessage(from.id, `Halo *${from.first_name}*!`, {
        'parse_mode': 'Markdown',
    })
})

bot.on('callback_query', query => {
    const { from, message, data: command } = query
    const [lookUpKey, action, address] = command.split('-')
    const currentApp = lookUp[lookUpKey]
    const response = currentApp.listen(action, address)
    handleRespond(response, from.id, message.message_id)
})

bot.onText(/\/req/, context => {
    const { from, message_id } = context
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

function handleRespond(response, to, message_id) {
    if (response) {
        if (response.deleteLast) {
            bot.deleteMessage(to, message_id)
        }
        if (response.message) {
            bot.sendMessage(to, response.message, response.options)
        }
    }
}