const TelegramBot   = require("node-telegram-bot-api")

const bot =  new TelegramBot(process.env.BOT_TOKEN, {polling:true})

// global var
const lookUp = {}

bot.onText(/\/menu/, (context, match)=>{
    const {from} = context
    bot.sendMessage(from.id, `Halo *${from.first_name}*!`, {
        'parse_mode': 'Markdown',
    })
})

bot.on('callback_query', query => {
    const {from, message, data:command} = query
    const [lookUpKey, action, address] = command.split('-')
    const currentApp = lookUp[lookUpKey]
    currentApp.listen(action,currentApp.cache[address])
})