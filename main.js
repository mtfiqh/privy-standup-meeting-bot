const TelegramBot = require("node-telegram-bot-api")
const db = require('./app/DataTransaction')
const helper = require('./app/helper/helper')
const emoticon = require('./app/resources/emoticons.config')
const cron = require('node-cron')
const { Report } = require('./app/Report')
const { TakeOfferTask } = require('./app/TakeOfferTask')
const { CrudProject } = require('./app/CrudProject')
const { Tasks } = require('./app/Tasks.js')
const { Menu } = require('./app/menu')
const { dictionary: dict } = require('./main.config')
const { DayOff } = require('./app/DayOff')

// -------------------------------------- (global vars) ----------------------------------------------- //

const bot = new TelegramBot(process.env.BOT_TOKEN, { polling: true })
const currentState = {}
const history = {}
const lookUp = {}

// -------------------------------------- (onText Listener) ----------------------------------------------- //

bot.onText(/\/start/, context => {
    const { from, chat, message_id } = context
    currentState[`autostart@${from.id}`] = context
    db.saveUser(from.id, {
        name: `${from.first_name += from.last_name ? ' ' + from.last_name : ''}`,
        status: 'active',
        type: 'user',
        userID: from.id,
        username: from.username
    })
    bot.sendMessage(chat.id,
        dict.start.getMessage(from.first_name),
        dict.start.getOptions()
    ).then((context) => {
        currentState[`autostartBot@${context.chat.id}`] = context.message_id
        bot.deleteMessage(chat.id, message_id)
    })
})

bot.onText(/\/menu/, async (context, match) => {
    const prefix = `Menu@${context.from.id}`
    if (prefix in lookUp) {
        bot.deleteMessage(context.from.id, context.message_id)
        return
    }
    currentState[`autostart@${context.from.id}`] = context
    await initMenu(context.from.id)
})

bot.onText(/\/addTasks/, context => {
    const { from } = context
    try {
        lookUp[`addTasks@${from.id}`] = new Tasks(from.id, 'addTasks', from.first_name)
        currentState[from.id] = 'addTasks'
        const response = {
            message: dict.addTasks.getMessage(),
            options: dict.addTasks.getOptions()
        }
        handleRespond(response, from.id)
    } catch (e) {
        console.log(e)
    }
})

bot.onText(/\/assignTasks/, (context, match) => {
    const { from } = context
    try {
        lookUp[`assignTasks@${from.id}`] = new Tasks(from.id, 'assignTasks')
        currentState[from.id] = 'assignTasks'
        const response = {
            message: dict.assignTasks.getMessage(),
            options: dict.assignTasks.getOptions()
        }
        handleRespond(response, from.id)
    } catch (e) {
        console.log(e)
    }
})

bot.onText(/\/showTasks/, async (context, match) => {
    const { from } = context
    try {
        const response = await currentApp.showTasks(from)
        handleRespond(response, from.id)
    } catch (e) {
        console.log(e)
    }
})

bot.onText(/\/dayOff/, async (context, match) => {
    const { from, message_id } = context
    const dayOff = new DayOff(bot, from.id)
    const res = await dayOff.onStart(context, true)
    lookUp[`DayOff@${from.id}`] = dayOff
    handleRespond(res, from.id, message_id)
})

bot.onText(/\/req/, async context => {
    const { from, message_id } = context
    const { id, first_name: name } = from
    const response = await initUserReport(id, name, message_id)
    if (!response.active) await bot.sendMessage(id, response.message, response.options)
    bot.deleteMessage(id, message_id)

})

bot.onText(/\/offer/, async context => {
    const { from, message_id } = context
    const { id, first_name: name } = from
    const response = await initOfferTask(id, name, message_id)
    if (!response.active) await bot.sendMessage(id, response.message, response.options)
    bot.deleteMessage(id, message_id)
})

bot.onText(/\/createProjects/, async context => {
    const { chat } = context
    initProjects('createProjects', chat.id, chat.first_name)
})

bot.onText(/\/deleteProjects/, async context => {
    const { chat } = context
    initProjects('deleteProjects', chat.id, chat.first_name)
})

bot.onText(/\/updateProjects/, async context => {
    const { chat } = context
    initProjects('updateProjects', chat.id, chat.first_name)
})

bot.onText(/\/listProjects/, async context => {
    const { chat } = context
    initProjects('readProjects', chat.id, chat.first_name)
})


// ----------------------------------------- (on Messages) ----------------------------------------------- //

bot.on("message", async context => {
    const { from, chat, text } = context
    if (currentState[from.id]) {
        console.log(from.id, 'Type Listen')
        const currentApp = lookUp[`${currentState[from.id]}@${from.id}`]
        const response = await currentApp.listen('onTypeListen', context)
        if (response && response.destroy == true) {
            if(history[currentApp.prefix]!==undefined){
                history[currentApp.prefix].add(context.message_id)
                deleteHistory(currentApp.prefix)
            }
            delete lookUp[currentApp.prefix]
        }
        if(response && response.record===true){
            if(history[response.prefix+'@'+response.userID]===undefined) history[response.prefix+'@'+response.userID]=new Set([])
            history[response.prefix+'@'+response.userID].add(context.message_id)
        }
        console.log(from.id, `currentState ${currentState[from.id]} deleted`)
        delete currentState[from.id]
        bot.sendMessage(chat.id, 'Processing....',{reply_markup:{remove_keyboard:true}}).then(contextBot=>{
            if(response && response.record===true){
                if(history[response.prefix+'@'+response.userID]===undefined) history[response.prefix+'@'+response.userID]=new Set([])
                history[response.prefix+'@'+response.userID].add(context.message_id)
                if(response.type!=='Confirm'){
                    bot.deleteMessage(from.id, contextBot.message_id)
                }
            }
            handleRespond(response, from.id, contextBot.message_id)
        })
    }

})



// ----------------------------------------- (Calback Query) ----------------------------------------------- //

bot.on('callback_query', async query => {
    try {
        const { from, message, data: command } = query
        const [lookUpKey, action, address] = command.split('-')

        if (command == '/menu') return await initMenu(from.id)

        const currentApp = lookUp[lookUpKey]
        const response = await currentApp.listen(action, address)
        handleRespond(response, from.id, message.message_id)
        if (response && response.destroy == true) {
            if(history[currentApp.prefix]!==undefined) deleteHistory(currentApp.prefix)
            delete lookUp[currentApp.prefix]
        }
        if(response && response.destroyBatch<=1){
            delete lookUp[currentApp.prefix]
        }
        if (response && response.record === true) {
            if(history[response.prefix+'@'+response.userID]===undefined) history[response.prefix+'@'+response.userID]=new Set([])
            history[response.prefix+'@'+response.userID].add(message.message_id)
        }
        
        console.log('History ',history[response.prefix+'@'+response.userID])
    } catch (error) {
        console.error("Error on bo.on('callback_query') (main.js)", error.message)
    }

})


// ----------------------------------------- (Response Handler) ----------------------------------------------//
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
    if (!response) return
    const { type } = response
    console.log(`${to} - ${type} :: message_id :${message_id}`)
    if (type == "Edit") {
        bot.editMessageText(response.message, {
            message_id: message_id,
            chat_id: to,
            ...response.options
        })
    } else if (type == "Delete") {
        bot.deleteMessage(response.id, message_id)
    } else if (type == "Confirm") {
        const { sender, receiver } = response
        handleRespond(sender, sender.id, sender.special? message_id-1:message_id)
        handleRespond(receiver, receiver.id, message_id)
    } else if (type == "Auto") {
        handleAuto(response.message)
        bot.sendMessage(to, response.message).then(async context => await handleAuto(context))
    }
    else {
        if (response.multiple === true) {
            bot.sendMessage(response.to.userID, response.messageTo, response.options)
        }
        // bot action
        bot.sendMessage(to, response.message, response.options).then(ctx=>{
            if(response && response.record===true){
                if(history[response.prefix+'@'+response.userID]===undefined) history[response.prefix+'@'+response.userID]=new Set([])
                history[response.prefix+'@'+response.userID].add(ctx.message_id)
            }
            console.log('History ',history[response.prefix+'@'+response.userID])    
        })
    }
    if (response.listenType === true) {
        currentState[response.userID] = response.prefix
        console.log(response.userID, `lock user in state '${response.prefix}'`)
    }
    
}

// handling tringer from 'bot'
async function handleAuto(context) {
    const { text, chat, message_id } = context
    let response;
    switch (text) {
        case '/offer':
            response = await initOfferTask(chat.id, chat.first_name, message_id)
            if (!response.active) await bot.sendMessage(chat.id, response.message, response.options)
            bot.deleteMessage(chat.id, message_id)
            break
        case '/report':
            response = await initUserReport(chat.id, chat.first_name, message_id)
            if (!response.active) await bot.sendMessage(chat.id, response.message, response.options)
            bot.deleteMessage(chat.id, message_id)
            break
        case '/addTasks':
            bot.deleteMessage(chat.id, message_id)
            await initTasks('addTasks', chat.id, chat.first_name)
            break
        case '/assignTasks':
            bot.deleteMessage(chat.id, message_id)
            await initTasks('assignTasks', chat.id, chat.first_name)
            break
        case '/showTasks':
            bot.deleteMessage(chat.id, message_id)
            lookUp[`showTasks@${chat.id}`] = new Tasks(chat.id, 'showTasks', chat.name)
            const currentApp = lookUp[`showTasks@${chat.id}`]
            response = await currentApp.showTasks(chat)
            handleRespond(response, chat.id)
            break
        case '/dayOff':
            const dayOff = new DayOff(bot, chat.id)
            lookUp[`DayOff@${chat.id}`] = dayOff
            const res = await dayOff.onStart(context, true)
            handleRespond(res, chat.id, message_id)
            break
        case '/createProjects':
            bot.deleteMessage(chat.id, message_id)
            initProjects('createProjects', chat.id, chat.first_name)
            break
        case '/deleteProjects':
            bot.deleteMessage(chat.id, message_id)
            initProjects('deleteProjects', chat.id, chat.first_name)
            break
        case '/updateProjects':
            bot.deleteMessage(chat.id, message_id)
            initProjects('updateProjects', chat.id, chat.first_name)
            break
        case '/listProjects':
            bot.deleteMessage(chat.id, message_id)
            initProjects('readProjects', chat.id, chat.first_name)
            break
        default:
            console.log("waiting...")
            break

    }
}

// ----------------------------------------- (init function) ----------------------------------------------- //


async function initMenu(id) {
    const context = currentState[`autostart@${id}`]
    const { from, chat, message_id } = context
    const menu = new Menu(from.id)
    const msg_bot = currentState[`autostartBot@${id}`] == undefined ? message_id : currentState[`autostartBot@${id}`]

    lookUp[`Menu@${from.id}`] = menu
    const res = await menu.onMain(context, true)
    handleRespond(res, from.id, message_id)
    bot.deleteMessage(chat.id, msg_bot)
    delete currentState[`autostart@${id}`]
}

async function initMenuCron(context, message) {
    const { from } = context
    bot.sendMessage(from.id, message, dict.initMenuCron.getOptions(from.id))
}

function initTasks(prefix, userID, name) {
    try {
        lookUp[`${prefix}@${userID}`] = new Tasks(userID, prefix, name)
        currentState[userID] = prefix
        console.log(userID, `created '${prefix}@${userID}' lookup`)
        console.log(userID, `lock user in state '${prefix}'`)
        const response = {
            record:true,
            prefix,
            userID,
            message: dict.initTasks.getMessage(),
            options: dict.initTasks.getOptions()
        }
        handleRespond(response, userID)
    } catch (e) {
        console.log(e)
    }
}

// Register Current User to lookUp as Report@userId
async function initOfferTask(id, name) {
    const prefix = `TakeOfferTask@${id}`
    const injector = `Menu@${id}`
    // user was regitered
    if (prefix in lookUp) return { active: true }
    const response = {
        message: dict.initOfferTask.done.getMessage(name),
        options:  dict.initOfferTask.done.getOptions(injector)
    }
    await db.getUserTasks(id).then(results => {
        if (results.length != 0) {
            const projects = helper.parseToReportFormat(results)
            const { inlineKeyboard, addrs } = helper.generateTasksKeyboard(projects[id], prefix, "Process", "Cancel")
            // regiter current user to lookUp as Report@userId
            lookUp[prefix] = new TakeOfferTask(projects[id], id, name, inlineKeyboard).addCache(prefix, addrs)
            response.options = dict.initOfferTask.inprogress.getOptions(inlineKeyboard)
            response.message = dict.initOfferTask.inprogress.getMessage(name)
        }
    })
    return response
}


// Register Current User to lookUp as Report@userId
async function initUserReport(id, name) {
    const prefix = `Report@${id}`
    const injector = `Menu@${id}`
    // user report was regitered
    if (prefix in lookUp) return { active: true }
    const response = {
        message: dict.initUserReport.done.getMessage(name),
        options: dict.initUserReport.done.getOptions(injector)
    }
    await db.getUserTasks(id).then(results => {
        if (results.length != 0) {
            const projects = helper.parseToReportFormat(results)
            const { inlineKeyboard, addrs } = helper.generateTasksKeyboard(projects[id], prefix)
            // regiter current user to lookUp as Report@userId
            lookUp[prefix] = new Report(projects[id], id, name, inlineKeyboard).addCache(prefix, addrs)
            response.options = dict.initUserReport.inprogress.getOptions(inlineKeyboard)
            response.message = dict.initUserReport.inprogress.getMessage(name)
        }
    })
    return response
}

async function initProjects(prefix, userID, name) {
    try {
        lookUp[`${prefix}@${userID}`] = new CrudProject(userID, name, prefix)
        console.log(userID, `created '${prefix}@${userID}' lookup`)
        const currentApp = lookUp[`${prefix}@${userID}`]
        let response
        if (prefix === "createProjects") {
            currentState[userID] = `${prefix}`
            console.log(userID, `lock user in state '${prefix}'`)
            const response = {
                message: dict.initProjects.getMessage(),
                options: dict.initProjects.getOptions()
            }
            return handleRespond(response, userID)
        } else if (prefix === "readProjects") {
            response = await currentApp.listen('read')
            return handleRespond(response, userID)
        }
        response = await currentApp.listen('showKeyboard')
        return handleRespond(response, userID)

    } catch (e) {
        console.log(e)
    }
}


// ----------------------------------------- (remainder function) ----------------------------------------------- //

function reminder(type) {
    let today = new Date()
    if (today.getDay() != 0 && today.getDay() != 6) {
        db.getUsersData('all').then(results => {
            results.forEach(async user => {
                let message = dict.remainder.first.getMessage()
                if (type == 13) message = dict.remainder.second.getMessage()
                if (user.status === 'active') {
                    const context = {
                        from: {
                            id: user.userID,
                            first_name: user.name
                        },
                        chat: null
                    }
                    const menu = new Menu(user.userID).addCache(`from@${user.userID}`, { from: context.from })
                    lookUp[`Menu@${user.userID}`] = menu
                    initMenuCron(context, message)
                } else {
                    console.log(user.name + ' is inactive, not sending message')
                }
            })
        })
    }
}

function deleteHistory(prefix){
    console.log('masuk delete',history)
    const [x, userID]=prefix.split('@')
    history[`${prefix}`].forEach(message_id=>{
        console.log('toDelete', message_id)
        bot.deleteMessage(userID, message_id)
    })
    history[prefix].clear()
    delete history[`${prefix}`]
}


/**
 * Cron function for reminder every 9 A.M
 * The function get data from database and check if user is active or not
 */
// cron.schedule('* * * * *',()=>{
//     reminder(10)
// })

// /**
//  * Function to send message every 1 P.M
//  * To remind users and check their progress
//  * Messages send to all users
//  */
// cron.schedule('*/5 * * * * *',()=>{
//     reminder(13)
//     //Implements function to send messages here
// })



// /**
//  * Set a user active or not based on day-off databases
//  * 
//  */
// cron.schedule('* * * * *',()=>{
//     db.checkDayOff().then(results=>{
//         db.getUsersData('all').then(result=>{
//             result.forEach(user=>{
//                 if(results.includes(user.userID)){
//                     db.updateUser(user.userID,{status:'inactive'})
//                 }else{
//                     db.updateUser(user.userID,{status:'active'})
//                 }
//             })
//         })
//     })
// })


// ----------------------------------------- (polling error) ----------------------------------------------- //

bot.on('polling_error', msg => {
    console.log(msg)
})