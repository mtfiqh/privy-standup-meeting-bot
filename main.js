const TelegramBot                             = require("node-telegram-bot-api")
const cron                                    = require('node-cron')
const {getUsersData,updateUser,checkDayOff} = require('./app/DataTransaction.js')
const {AddTasks}                              = require('./app/addTasks.js')
const em                                      = require('./app/resources/emoticons.config')

const bot =  new TelegramBot(process.env.BOT_TOKEN, {polling:true})
const addTasks = new AddTasks(bot)
const lookUp = {
    "addTasks"  : addTasks,

}

const {Menu} = require('./app/menu')

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

bot.on('polling_error',msg=>{
    console.log(msg)
})

bot.onText(/\/menu/, (context, match)=>{
    const {from,chat} = context
    
    const menu = new Menu(bot,from.id)

    lookUp[`Menu@${from.id}`] = menu
    menu.onMain(context)
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
            .then(result=>{
                if(result.text==='/req'){
                    //Jose's Function
                }
            })
        }
    }else{
        console.log("Response :",response)
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

/**
 * Cron function for reminder every 9 A.M
 * The function get data from database and check if user is active or not
 */
cron.schedule('* * * * *',()=>{
    getUsersData('all').then(results=>{
        results.forEach(user=>{
            let currentDate = new Date()
            if(user.status==='active'){
                bot.sendMessage(user.userID, 
                `Selamat Pagi <a href='tg://user?id=${user.userID}'>${user.name}</a>, 
                Laporkan progress mu saat ini`,{
                    parse_mode:'HTML',
                    reply_markup: {
                        inline_keyboard:[
                            [ 
                                {
                                    text: `${em.add} Add Task(s)`, 
                                    callback_data: 'addTask-OnInsertTask-'+user.userID
                                } 
                            ],
                            [ 
                                {
                                    text: `${em.laptop} Show Tasks`, 
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

/**
 * Function to send message every 1 P.M
 * To remind users and check their progress
 * Messages send to all users
 */
cron.schedule('* * 13 * * *',()=>{
    //Implements function to send messages here
})


/**
 * Set a user active or not based on day-off databases
 * 
 */
cron.schedule('* * 1 * *',()=>{
    checkDayOff().then(results=>{
        getUsersData('all').then(result=>{
            result.forEach(user=>{
                if(results.includes(user.userID)){
                    updateUser(user.userID,{status:'inactive'})
                }
            })
        })
    })
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