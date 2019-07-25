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
const { Spammer } = require('./app/Spammer')
const { dictionary: dict } = require('./main.config')
const { DayOff } = require('./app/DayOff')
const { InsertProblems } = require('./app/insertProblems')
const {assignUsersProject} = require('./app/assignUsersProject')
const { ChangeRole } = require('./app/ChangeRole')
const {CalendarKeyboard} = require('./app/Calendar')
const { ListCuti } = require('./app/ListCuti')
const { Advice } = require('./app/advice')
require('dotenv').config()
const SCHEDULE_10  = process.env.SCHEDULE_10
const SCHEDULE_13  = process.env.SCHEDULE_13
const SCHEDULE_SPAMMER = process.env.SCHEDULE_SPAMMER
const SCHEDULE_RESET   = process.env.SCHEDULE_RESET
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

bot.onText(/\/role/, async context =>{
    console.log('keyboard')
    initChangeRole(context.chat.id, context.chat.first_name)
})

bot.onText(/\/calls/, context => {
    const { from, message_id } = context
    const { id, first_name: name } = from
    const prefix = `CalendarKeyboard@${id}`
    const calendar = new CalendarKeyboard(prefix, id)
    lookUp[prefix] = calendar
    const date = new Date()
    bot.sendMessage(id, "Test",{
        parse_mode:'Markdown',
        reply_markup:{
            inline_keyboard:calendar.makeCalendar(date.getFullYear(),date.getMonth(),'onChoose')
        }
    })
})

bot.onText(/\/listCuti/, context =>{
    const { chat } = context
    initListDayOff(chat.id, chat.first_name)
})

bot.onText(/\/restart/, context =>{
    const { chat } = context
    bot.sendMessage(chat.id, "*Restarted!*", {parse_mode: "Markdown"})

    
    delete lookUp[`Menu@${chat.id}`]
    delete lookUp[`Menu@${chat.id}@cron`]
})

bot.onText(/\/advice/, context => {
    const {chat} = context
    const prefix = `Advice@${chat.id}`
    const advice = new Advice(prefix, chat.id, chat.first_name)
    lookUp[prefix] = advice
    const response = advice.onRequest()
    bot.sendMessage(chat.id, response.message, response.options)
        .then( ctx => {
            bot.on("message", async c => {
                const res = advice.onRespond(c.text)
                bot.deleteMessage(chat.id, c.message_id)
                handleRespond(res,ctx.chat.id, ctx.message_id)
            })
        })
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
        handleRespond(response, from.id, message.message_id, query.id)
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
        
            console.log('History ',history[response.prefix+'@'+response.userID])
        }
        
    } catch (error) {
        console.error("Error on bo.on('callback_query') (main.js)", error)
    }

})


// ----------------------------------------- (Response Handler) ----------------------------------------------//
function handleRespond(response, to, message_id,query_id) {
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
    }else if(type=='Listen'){
        bot.editMessageText(response.message, {
            message_id: message_id,
            chat_id: to,
            ...response.options
        }).then(c =>{
            bot.on("message", async context => {
                const prefix = `CalendarKeyboard@${to}`
                const currApp = lookUp[prefix]
                currApp.setReason(context.text)
                const r = await currApp.saveToDB()
                handleRespond(r, to, message_id, query_id)
                await bot.deleteMessage(context.chat.id, context.message_id )
            })
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
    }else if(type == 'NoAction'){
        bot.answerCallbackQuery(query_id, {text: response.message})
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
        case '/assignProject':
            bot.deleteMessage(chat.id, message_id)
            initAssignProject(chat.id,chat.first_name,'assignProject')
            break
        case '/role':
            bot.deleteMessage(chat.id, message_id)
            initChangeRole(chat.id, chat.first_name)
            break
        case '/problems':
                bot.deleteMessage(chat.id, message_id)
                initProblems('problems',chat.id,chat.first_name)
            break
        case '/listCuti':
                initListDayOff(chat.id, chat.first_name)
            break        
        case '/cuti':
            bot.deleteMessage(chat.id, message_id)
            initCuti(chat);
            break
        default:
            console.log("waiting...")
            break

    }
}

// ----------------------------------------- (init function) ----------------------------------------------- //

async function initChangeRole(userID, name){
    console.log('init change role')
    lookUp[`changerole@${userID}`] = new ChangeRole('changerole', userID, name)
    const currentApp=lookUp[`changerole@${userID}`]
    const res = await currentApp.listen('onStart')
    handleRespond(res, userID)
}

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
    const { from, type } = context
    bot.sendMessage(from.id, message, dict.initMenuCron.getOptions(from.id,from.first_name,type))
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

bot.onText(/\/problems/, (context, match)=>{
    const {from, chat} = context
    initProblems('problems', chat.id, chat.first_name)
})
bot.onText(/\/assignProject/, (context, match)=>{
    const {from, chat, message_id} = context
    bot.deleteMessage(chat.id, message_id)
    initAssignProject(chat.id, chat.first_name, 'assignProject')
})

async function initAssignProject(userID, name, prefix){
    try{
        lookUp[`${prefix}@${userID}`] = new assignUsersProject(userID, name, prefix)
        console.log(userID, `created ${prefix}@${userID} lookup`)
        const currentApp = lookUp[`${prefix}@${userID}`]
        const response = await currentApp.listen('onStart')
        return handleRespond(response, userID)
    }catch(err){
        console.log(err)
    }
}
async function initListDayOff(userID, name){
    lookUp[`${'listDayOff'}@${userID}`] = new ListCuti('listDayOff', userID, name)
    console.log(userID, `created '${'listDayOff'}@${userID}' lookup`)
    const currentApp = lookUp[`${'listDayOff'}@${userID}`]
    let response = await currentApp.listen('onStart')
    handleRespond(response, userID)
}

const initSpam = (userID)=>{
    const prefix = `Spammer@${userID}`
    currentState[`autostart@${userID}`] = userID
    const spam = new Spammer(userID,bot)
    lookUp[prefix] = spam
    spam.setSchedule(' * * * * *')
    spam.init()
}
async function initProblems(prefix, userID, name){
    lookUp[`${prefix}@${userID}`] = new InsertProblems(userID, name, prefix)
    console.log(userID, `created '${prefix}@${userID}' lookup`)
    const currentApp = lookUp[`${prefix}@${userID}`]
    let response = await currentApp.listen('onStart')
    return handleRespond(response, userID)
}

function initCuti(chat) {
    const prefix = `CalendarKeyboard@${chat.id}`;
    const calendar = new CalendarKeyboard(prefix, chat.id);
    lookUp[prefix] = calendar;
    const date = new Date();
    bot.sendMessage(chat.id, "Pilih Tanggal Awal dan Akhir", {
        parse_mode: 'Markdown',
        reply_markup: {
            inline_keyboard: calendar.makeCalendar(date.getFullYear(), date.getMonth(), 'onChoose')
        }
    });
}

// ----------------------------------------- (remainder function) ----------------------------------------------- //

async function remindMessage(type,user){
    const context = {
        from: {
            id: user.userID,
            first_name: user.name
        },
        chat: null,
        type:type
    }
    if(type===10){
        await dict.reminder.first.getMessage(user.name,user.userID).then(message=>{
            const menu = new Menu(user.userID).addCache(`from@${user.userID}`, { from: context.from })
            lookUp[`Menu@${user.userID}@cron`] = menu
            initMenuCron(context, message)
        })
    }else{
        await dict.reminder.second.getMessage(user.name,user.userID).then(message=>{
            if(message!=false){
                const menu = new Menu(user.userID).addCache(`from@${user.userID}`, { from: context.from })
                lookUp[`Menu@${user.userID}@cron`] = menu
                initMenuCron(context, message)    
            }
        })
            
    }
    
}

function reminder(type) {
    db.getUsersData('all').then(async results => {
        let arr = []
        results.forEach(user => {
            if (user.status === 'active') {
                arr.push(remindMessage(type,user))
            } else {
                console.log(user.name + ' is inactive, not sending message')
            }
        })
        await Promise.all(arr).then(e=>{
            e.forEach(a=>{
                console.log(a)
            })
        })
    })
}

function deleteHistory(prefix){
    console.log(prefix)
    console.log('masuk delete',history)
    const [x, userID]=prefix.split('@')
    history[`${prefix}`].forEach(message_id=>{
        console.log('toDelete', message_id)
        bot.deleteMessage(userID, message_id)
    })

    history[prefix].clear()
    delete history[`${prefix}`]
}

async function allowReminder(){
    const isHoliday = await db.isHoliday()
    const todayDate = new Date()

    if((!isHoliday)&&(todayDate.getDate()!=6)&&(todayDate.getDate()!=0)){
        return true
    }
    return false
}


function executeCron(ok){
    if(ok){
        /**
         * Cron function for reminder every 9 A.M
         * The function get data from database and check if user is active or not
         */

        /**
         * Send reminder message at 10 A.M
         * SCHEDULE_10
         */
        cron.schedule(SCHEDULE_10,()=>{
            console.log('10 A.M')
            allowReminder().then(allowed=>{
                if(allowed){
                    reminder(10)
                }
            })
        })

        /**
         * Send reminder message at 1 P.M
         * SCHEDULE_13
         */
        cron.schedule(SCHEDULE_13,()=>{
            console.log('1 P.M')
            allowReminder().then(allowed=>{
                if(allowed){
                    reminder(13)
                }
            })
        })

        /**
         * Initialization spam message
         * SCHEDULE_SPAMMER
         */
        cron.schedule(SCHEDULE_SPAMMER,()=>{
            console.log('1.30 P.M')
            allowReminder().then(allowed=>{
                if(allowed){
                    let arr = []
                    db.getUsersData('all').then(async results => {
                        results.forEach(user => {
                            db.getStatistic(user.userID).then(stat=>{
                                if ((user.status === 'active')&&(stat.Done===0&&((stat.Recurring+stat.Added)>0))) {
                                    arr.push(initSpam(user.userID))
                                } else {
                                    console.log(user.name + ' is inactive, or his/her jobs has done')
                                }
                            })
                        })
                        await Promise.all(arr).then(e=>{
                            e.forEach(a=>{
                                console.log(a)
                            })
                        })
                    })
                }
            })
        })



        /**
         * Set a user active or not based on day-off databases
         * SCHEDULE_RESET
         */
        cron.schedule(SCHEDULE_RESET,()=>{
            console.log('reset')    
            db.resetStat()
            db.checkDayOff().then(results=>{
                db.getUsersData('all').then(result=>{
                    result.forEach(user=>{
                        if(results.includes(user.userID)){
                            db.updateUser(user.userID,{status:'inactive'})
                        }else{
                            db.updateUser(user.userID,{status:'active'})
                        }
                    })
                })
            })
        })
    }
}

executeCron(false)

// ----------------------------------------- (polling error) ----------------------------------------------- //

bot.on('polling_error', msg => {
    console.log(msg)
})
