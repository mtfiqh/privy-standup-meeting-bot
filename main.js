const TelegramBot                 = require("node-telegram-bot-api")
const cron                        = require('node-cron')
const {getUsersData,getUserTasks,getUserTasks} = require('./app/DataTransaction.js')

const bot =  new TelegramBot(process.env.BOT_TOKEN, {polling:true})

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

cron.schedule('* * 10 * * *',()=>{
    /**
     * Cron function for reminder every 9 A.M
     * The function get data from database and check if user is active or not
     */
    getUsersData('all').then(results=>{
        results.forEach(user=>{
            let currentDate = new Date()
            if(user.status==='active'){
                bot.sendMessage(user.userID, 
                `Halo <a href='tg://user?id=${user.userID}'>${user.name}</a>, 
                Laporkan progress mu saat ini`,{
                    parse_mode:'HTML',
                    reply_markup: {
                        inline_keyboard:[
                            [ 
                                {
                                    text: '+ Add Task(s)', 
                                    callback_data: 'addTask-OnInsertTask-'+user.userID
                                } 
                            ],
                            [ 
                                {
                                    text: 'Show Tasks', 
                                    callback_data: 'addTask-OnShowTask-'+user.userID
                                }
                            ]
                        ]
                    }
                }).then(()=>{
                    console.log('Send message to '+user.name+' at '+currentDate)
                }).catch(e=>{
                    console.log('Failed send message to '+user.name+' in '+currentDate)
                    console.log('Caused by : '+e.message)
                })        
            }else{
                console.log(user.name+' is inactive, not sending message')
            }
        })
        console.log('\n')
    })  
})

cron.schedule('* * 13 * * *',()=>{
    /**
     * Function to send message every 1 P.M
     * To remind users and check their progress
     * Messages send to all users
     */
    //Implements function to send messages here
})