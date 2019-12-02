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
const { Problems } = require('./app/Problems')
const { MonitoringUsers } = require('./app/MonitoringUsers')
const {Logger}= require('./app/Logger')
const { EditDeadline } = require('./app/EditDeadline')
const moment = require('moment')
const fs      = require('fs')
require('dotenv').config()
const SCHEDULE_10  = process.env.SCHEDULE_10
const SCHEDULE_13  = process.env.SCHEDULE_13
const SCHEDULE_RESET   = process.env.SCHEDULE_RESET
const SCHEDULE_MENTION = process.env.SCHEDULE_MENTION
const SCHEDULE_REMINDPROJECT = process.env.SCHEDULE_REMINDPROJECT
// -------------------------------------- (global vars) ----------------------------------------------- //
const conf  = require("./app/helper/config")
const fname   = './settings.json'
// -------------------------------------- (global vars) ----------------------------------------------- //
const bot = new TelegramBot(process.env.BOT_TOKEN, { polling: true })
const currentState = {}
const history = {}
const lookUp = {}
const commands = new Set([
    "/start",
    "/menu",
    "/addTasks",
    "/assignTasks",
    "/showTasks",
    "/dayOff",
    "/req",
    "/offer",
    "/createProjects",
    "/deleteProjects",
    "/updateProjects",
    "/listProjects",
    "/role",
    "/calls",
    "/restart",
    "/advice",
    "/listCuti"
])

// -------------------------------------- (Auto Start) ----------------------------------------------- //

function autoAdmin(){
    const currentAdmin  = new Set(conf.getAdmins()) // order is important
    const admins = conf.getSettings().admin
    for(let admin of admins){
        if(!currentAdmin.has(admin)){
            bot.sendMessage(parseInt(admin),"Selamat anda adalah *Thanos* :)", {
                parse_mode:"Markdown"
            }).then(ctx=>{
                const { chat } = ctx
                const payload = {
                    name: `${chat.first_name += chat.last_name ? ' ' + chat.last_name : ''}`,
                    status: 'active',
                    type: 'admin',
                    userID: chat.id,
                    role:'admin',
                    username: chat.username==undefined?"null":chat.username
                }
                db.updateUser(chat.id, payload)
            })
        }
    }
}
// auto admin
autoAdmin()
fs.watchFile(fname,()=>autoAdmin())

// -------------------------------------- (onText Listener) ----------------------------------------------- //

function addLookUp(id, prefix, value){
    if(lookUp[id]==undefined){
        lookUp[id]={}
    }
    lookUp[id][prefix]=value
}

bot.onText(/\/start/, async context => {
    const { from, chat, message_id } = context
    currentState[`autostart@${from.id}`] = context
    if(chat.type=='group'){
        await setupGroup(context)
        await setupAdmin(context)
    }else{
        db.saveUser(from.id, {
            name: `${from.first_name += from.last_name ? ' ' + from.last_name : ''}`,
            status: 'active',
            type: 'user',
            userID: from.id,
            role:'user',
            username: from.username==undefined?"null":from.username
        })
    }
    bot.sendMessage(chat.id,
        dict.start.getMessage(from.first_name,from.id),
        dict.start.getOptions()
    ).then((context) => {
        currentState[`autostartBot@${context.chat.id}`] = context.message_id
        bot.deleteMessage(chat.id, message_id)
    })
})

async function setupGroup(context){
    try {
        const id = context.chat.id
        const admin = await bot.getChatAdministrators(id)
        const members = await bot.getChatMembersCount(id)
        const payload = {
            id : id,
            title: context.chat.title,
            admin:admin,
            members:members
        }
        db.setGroupID({id:id,payload:payload})
        
    } catch (error) {
        Logger.err(setupGroup.name,error.message)
    }
}

async function setupAdmin(context){
    try{
        const id = context.chat.id
        const admin = await bot.getChatAdministrators(id)
        for(let user of admin){
            db.saveUser(user.user.id, {
                name: `${user.user.first_name += user.user.last_name ? ' ' + user.user.last_name : ''}`,
                status: 'active',
                type: 'admin',
                userID: user.user.id,
                role:'admin',
                username: user.user.username==undefined?"null":user.user.username
            })
        }
        
    }catch(error){
        Logger.err(setupAdmin.name,error.message)
    }
}

bot.onText(/\/menu/, async (context, match) => {
    const prefix = `Menu@${context.from.id}`
    if ((lookUp[context.from.id]!=undefined)&& (prefix in lookUp[context.from.id])) {
        bot.deleteMessage(context.from.id, context.message_id)
        return
    }
    currentState[`autostart@${context.from.id}`] = context
    await initMenu(context.from.id)
})

bot.onText(/\/addTasks/, context => {
    const { from } = context
    try {
        const prefix = `addTasks@${from.id}`
        const task   = new Tasks(from.id, 'addTasks', from.first_name)
        addLookUp(from.id, prefix, task)
        currentState[from.id] = 'addTasks'
        const response = {
            message: dict.addTasks.getMessage(),
            options: dict.addTasks.getOptions()
        }
        handleRespond(response, from.id)
    } catch (e) {
        Logger.err('BOT-addTasks',e.message)    
    }
})

bot.onText(/\/assignTasks/, (context, match) => {
    const { from } = context
    try {
        const prefix = `assignTasks@${from.id}`
        const task  = new Tasks(from.id, 'assignTasks')
        addLookUp(from.id, prefix, task)
        currentState[from.id] = 'assignTasks'
        const response = {
            message: dict.assignTasks.getMessage(),
            options: dict.assignTasks.getOptions()
        }
        handleRespond(response, from.id)
    } catch (e) {
        Logger.err('BOT-assignTasks',e.message)    
    }
})

bot.onText(/\/showTasks/, async (context, match) => {
    const { from } = context
    try {
        const response = await currentApp.showTasks(from)
        handleRespond(response, from.id)
    } catch (e) {
        Logger.err('BOT-showTasks',e.message)    
    }
})

bot.onText(/\/dayOff/, async (context, match) => {
    try {
        const { from, message_id } = context
        const dayOff = new DayOff(bot, from.id)
        const res = await dayOff.onStart(context, true)
        const prefix = `DayOff@${from.id}`
        addLookUp(from.id, prefix, dayOff)
        handleRespond(res, from.id, message_id)
    } catch (error) {
        Logger.err('BOT-dayOff',error.message)    
    }
})

bot.onText(/\/req/, async context => {
    try {
        const { from, message_id } = context
        const { id, first_name: name } = from
        const response = await initUserReport(id, name, message_id)
        if (!response.active) await bot.sendMessage(id, response.message, response.options)
        bot.deleteMessage(id, message_id)
    } catch (error) {
        Logger.err('BOT-req',error.message)    
    }

})

bot.onText(/\/offer/, async context => {
    try {
        const { from, message_id } = context
        const { id, first_name: name } = from
        const response = await initOfferTask(id, name, message_id)
        if (!response.active) await bot.sendMessage(id, response.message, response.options)
        bot.deleteMessage(id, message_id)
    } catch (error) {
        Logger.err('BOT-offer',error.message)    
    }
})

bot.onText(/\/createProjects/, async context => {
    try {
        const { chat } = context
        initProjects('createProjects', chat.id, chat.first_name)
    } catch (error) {
        Logger.err('BOT-createProjects',error.message)    
    }
})

bot.onText(/\/deleteProjects/, async context => {
    try {        
        const { chat } = context
        initProjects('deleteProjects', chat.id, chat.first_name)
    } catch (error) {
        Logger.err('BOT-deleteProjects',error.message)    
    }
})

bot.onText(/\/updateProjects/, async context => {
    try {
        const { chat } = context
        initProjects('updateProjects', chat.id, chat.first_name)
    } catch (error) {
        Logger.err('BOT-updateProjects',error.message)    
    }
})

bot.onText(/\/listProjects/, async context => {
    try {
        const { chat } = context
        initProjects('readProjects', chat.id, chat.first_name)
    } catch (error) {
        Logger.err('BOT-listProjects',error.message)    
    }
})

bot.onText(/\/role/, async context =>{
    try {
        initChangeRole(context.chat.id, context.chat.first_name)
    } catch (error) {
        Logger.err('BOT-role',error.message)    
    }
})

bot.onText(/\/calls/, context => {
    try {
        const { from, message_id } = context
        const { id, first_name: name } = from
        const prefix = `CalendarKeyboard@${id}`
        const calendar = new CalendarKeyboard(prefix, id)
        addLookUp(id, prefix, calendar)
        const date = new Date()
        bot.sendMessage(id, "Test",{
            parse_mode:'Markdown',
            reply_markup:{
                inline_keyboard:calendar.makeCalendar(date.getFullYear(),date.getMonth(),'onChoose')
            }
        })
    } catch (error) {
        Logger.err('BOT-calls',error.message)    
    }
})

bot.onText(/\/listCuti/, context =>{
    try {
        const { chat } = context
        initListDayOff(chat.id, chat.first_name)
    } catch (error) {
        Logger.err('BOT-listCuti',error.message)    
    }
})

bot.onText(/\/restart/, context =>{
    try {
        const { chat } = context
        bot.deleteMessage(chat.id, context.message_id)
        bot.sendMessage(chat.id, "*Restarted!*", {parse_mode: "Markdown"})
        delete lookUp[chat.id]
    } catch (error) {
        Logger.err('BOT-restart',error.message)    
    }
})

bot.onText(/\/advice/, context => {
    try {
        const {chat} = context
        const prefix = `Advice@${chat.id}`
        const advice = new Advice(prefix, chat.id, chat.first_name)
        addLookUp(chat.id, prefix, advice)
        const response = advice.onRequest()
        bot.sendMessage(chat.id, response.message, response.options)
            .then( ctx => {
                bot.once("message", async c => {
                    if(!commands.has(c.text)){
                        const res = advice.onRespond(c.text)
                        bot.deleteMessage(chat.id, c.message_id)
                        handleRespond(res,ctx.chat.id, ctx.message_id)
                    }else{
                        bot.deleteMessage(ctx.chat.id, ctx.message_id)
                    }
                })
            })
    } catch (error) {
        Logger.err('BOT-advice',error.message)    
    }
})

bot.onText(/\/listprob/,async context=>{
    try {
        const {chat}= context
        const prefix = `Problems@${chat.id}`
        const problems = new Problems(chat.id,prefix)
        addLookUp(chat.id,prefix,problems)
        const response = await problems.onGetTask()
        handleRespond(response,chat.id,context.message_id)
    } catch (error) {
        Logger.err('BOT-listprob',error.message)    
    }
})

bot.onText(/\/monit/, context=>{
    try {
        const { chat } = context
        initMonit(chat.id, chat.first_name)
    } catch (error) {
        Logger.err('BOT-monit',error.message)    
    }
})
// ----------------------------------------- (on Messages) ----------------------------------------------- //

bot.on("message", async context => {
    const { from, chat, text } = context
    if (currentState[from.id]) {
        if(commands.has(text)) return
        const currentApp = lookUp[from.id][`${currentState[from.id]}@${from.id}`]
        const response = await currentApp.listen('onTypeListen', context)
        if (response && response.destroy == true) {
            if(history[currentApp.prefix]!==undefined){
                history[currentApp.prefix].add(context.message_id)
                deleteHistory(currentApp.prefix)
            } 
            delete lookUp[from.id][currentApp.prefix]
        }
        if(response && response.record===true){
            if(history[response.prefix+'@'+response.userID]===undefined) history[response.prefix+'@'+response.userID]=new Set([])
            history[response.prefix+'@'+response.userID].add(context.message_id)
        }
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
        let  currentApp;
        if (command == '/menu') return await initMenu(from.id)
        if(lookUpKey.includes("TakeOfferTask@")){
            const senderId   = parseInt(lookUpKey.split('@').pop())
            currentApp = lookUp[senderId][lookUpKey]
        }else{
            currentApp = lookUp[from.id][lookUpKey]
        }
        const response = currentApp.isNewSession() ? currentApp.startNewSession() : await currentApp.listen(action, address)
        try{
            handleRespond(response, from.id, message.message_id, query.id)
        }catch(err){
            Logger.err('BOT-callback_query-handleRespond',err.message)    
        }
        if (response && response.destroy == true) {
            if(history[currentApp.prefix]!==undefined) deleteHistory(currentApp.prefix)
            delete lookUp[currentApp.id][currentApp.prefix]
        }
        if (response && response.record === true) {
            if(history[response.prefix+'@'+response.userID]===undefined) history[response.prefix+'@'+response.userID]=new Set([])
            history[response.prefix+'@'+response.userID].add(message.message_id)
            console.log('History ',history[response.prefix+'@'+response.userID])
        }
        
    } catch (error) {        
        Logger.err('BOT-callback_query',error.message)    
        bot.answerCallbackQuery(query.id, {text: "Session Over!"})
    }

})


// ----------------------------------------- (Response Handler) ----------------------------------------------//
const lookUpTime = {}
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

    if(response.hasTimeout != undefined && response.hasTimeout==true){
        if(lookUpTime[response.prefix]==undefined){
            const TAKE_OFFER_TASK_TIMEOUT = (1000 * conf.getSettings().takeOfferTask.timeout)
            const t = setTimeout(()=>{
                handleRespond(response.onTimeout, to , message_id)
                delete lookUpTime[response.prefix]
                delete lookUp[response.id][response.prefix]
            }, TAKE_OFFER_TASK_TIMEOUT)
            if(lookUpTime[response.id]==undefined){
                lookUpTime[response.id]={}
            }
            lookUpTime[response.id][response.prefix] = t
        }
    }

    if(response.stop==true){
        const t = lookUpTime[response.id][response.prefix]
        t.unref()
        clearTimeout(t)
        delete lookUpTime[response.id][response.prefix]
    }

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
        handleRespond(sender, sender.id, message_id)
        handleRespond(receiver, receiver.id, message_id)
    } else if (type == "Auto") {
        handleAuto(response.message)
        bot.sendMessage(to, response.message).then(async context => await handleAuto(context))
    }else if(type == 'NoAction'){
        bot.answerCallbackQuery(query_id, {text: response.message})

    }else if(type=="Restart"){
        delete lookUp[response.id][response.activity]
        bot.answerCallbackQuery(query_id, {text: "Time Out!"})
        bot.deleteMessage(to, message_id)
    }else if(type == 'Batch'){
        console.log(response)
        for(let r of response.responses){
            handleRespond(r, r.id, message_id, query_id)
        }
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
//            console.log('History ',history[response.prefix+'@'+response.userID])    
        })
    }
    if (response.listenType === true) {
        currentState[response.userID] = response.prefix
//        console.log(response.userID, `lock user in state '${response.prefix}'`)
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
            if ((lookUp[chat.id]!=undefined) && (`addTasks@${chat.id}` in lookUp[chat.id])){
                return 
            }
            await initTasks('addTasks', chat.id, chat.first_name)
            break
        case '/assignTasks':
            bot.deleteMessage(chat.id, message_id)
            if ((lookUp[chat.id]!=undefined) && (`assignTasks@${chat.id}` in lookUp[chat.id])){
                return 
            }
            await initTasks('assignTasks', chat.id, chat.first_name)
            break
        case '/showTasks':
            bot.deleteMessage(chat.id, message_id)
            const prefix = `showTasks@${chat.id}`
            const task =  new Tasks(chat.id, 'showTasks', chat.name)
            addLookUp(chat.id, prefix, task)
            const resp = await task.showTasks(chat)
            handleRespond(resp, chat.id)
            break
        case '/dayOff':
            if ((lookUp[chat.id]!=undefined) && (`DayOff@${chat.id}` in lookUp[chat.id])){
                bot.deleteMessage(chat.id,message_id)
                return 
            }
            const dayOff = new DayOff(bot, chat.id)
            const res = await dayOff.onStart(context, true)
            addLookUp(chat.id, `DayOff@${chat.id}`, dayOff)
            handleRespond(res, chat.id, message_id)
            break
        case '/createProjects':
            bot.deleteMessage(chat.id, message_id)
            if ((lookUp[chat.id]!=undefined) && (`createProjects@${chat.id}` in lookUp[chat.id])){
                return 
            }
            initProjects('createProjects', chat.id, chat.first_name)
            break
        case '/deleteProjects':
            bot.deleteMessage(chat.id, message_id)
            if ((lookUp[chat.id]!=undefined) && (`deleteProjects@${chat.id}` in lookUp[chat.id])){
                return 
            }
            initProjects('deleteProjects', chat.id, chat.first_name)
            break
        case '/updateProjects':
            bot.deleteMessage(chat.id, message_id)
            if ((lookUp[chat.id]!=undefined) && (`updateProjects@${chat.id}` in lookUp[chat.id])){
                return 
            }
            initProjects('updateProjects', chat.id, chat.first_name)
            break
        case '/listProjects':
            bot.deleteMessage(chat.id, message_id)
            if ((lookUp[chat.id]!=undefined) && (`readProjects@${chat.id}` in lookUp[chat.id])){
                return 
            }
            initProjects('readProjects', chat.id, chat.first_name)
            break
        case '/assignProject':
            bot.deleteMessage(chat.id, message_id)
            if ((lookUp[chat.id]!=undefined) && (`assignProject@${chat.id}` in lookUp[chat.id])){
                return 
            }
            initAssignProject(chat.id,chat.first_name,'assignProject')
            break
        case '/role':
            bot.deleteMessage(chat.id, message_id)
            if ((lookUp[chat.id]!=undefined) && (`changerole@${chat.id}` in lookUp[chat.id])){
                return 
            }
            initChangeRole(chat.id, chat.first_name)
            break
        case '/problems':
                bot.deleteMessage(chat.id, message_id)
                if ((lookUp[chat.id]!=undefined) && (`problems@${chat.id}` in lookUp[chat.id])){
                    return 
                }
                initProblems('problems',chat.id,chat.first_name)
            break
        case '/listCuti':
                initListDayOff(chat.id, chat.first_name)
            break        
        case '/cuti':
            bot.deleteMessage(chat.id, message_id)
            initCuti(chat);
            break
        case'/monit':
            bot.deleteMessage(chat.id, message_id)
            if ((lookUp[chat.id]!=undefined) && (`monitUsers@${chat.id}` in lookUp[chat.id])){
                return 
            }
            initMonit(chat.id, chat.first_name)
            break;
        case '/advice':
            bot.deleteMessage(chat.id, message_id)
            if ((lookUp[chat.id]!=undefined) && (`Advice@${chat.id}` in lookUp[chat.id])){
                return 
            }
            const advice = new Advice(`Advice@${chat.id}`, chat.id, chat.first_name)
            addLookUp(chat.id, `Advice@${chat.id}`, advice)
            response = advice.onRequest()
            bot.sendMessage(chat.id, response.message, response.options)
                .then( ctx => {
                    bot.once("message", async c => {
                        if(!commands.has(c.text)){
                            const res = advice.onRespond(c.text)
                            bot.deleteMessage(chat.id, c.message_id)
                            handleRespond(res,ctx.chat.id, ctx.message_id)
                        }else{
                            bot.deleteMessage(ctx.chat.id, ctx.message_id)
                        }
                    })
                })
            break
        case '/readAdvice':
            bot.deleteMessage(chat.id, message_id)
            const readAdvice = new Advice(`readAdvice@${chat.id}`, chat.id, chat.first_name)
            addLookUp(chat.id, `readAdvice@${chat.id}`, readAdvice)
            response =  await readAdvice.onRead()
            handleRespond(response, chat.id)
            break
        case '/editDeadline':
            bot.deleteMessage(chat.id, message_id)
            if ((lookUp[chat.id]!=undefined) && (`editDeadline@${chat.id}` in lookUp[chat.id])){
                return 
            }
            const editDeadline = new EditDeadline(chat.id, chat.first_name)
            addLookUp(chat.id, `editDeadline@${chat.id}`, editDeadline)
            response = await editDeadline.onStart()
            handleRespond(response, chat.id)
            break
            
        default:
            Logger.info('handleAuto','Waiting user input')
    }
}

// ----------------------------------------- (init function) ----------------------------------------------- //

async function initChangeRole(userID, name){
    console.log('init change role')
    const prefix = `changerole@${userID}`
    const changeRole = new ChangeRole('changerole', userID, name)
    const res = await changeRole.listen('onStart')
    addLookUp(userID, prefix, changeRole)
    handleRespond(res, userID)
}

async function initMenu(id) {
    const context = currentState[`autostart@${id}`]
    const { from, chat, message_id } = context
    const menu = new Menu(from.id)
    const msg_bot = currentState[`autostartBot@${id}`] == undefined ? message_id : currentState[`autostartBot@${id}`]
    const prefix  =`Menu@${from.id}`
    addLookUp(id, prefix, menu)
    const res = await menu.onMain(context, true)
    handleRespond(res, from.id, message_id)
    bot.deleteMessage(chat.id, msg_bot)
    delete currentState[`autostart@${id}`]
}

async function initMenuCron(context, message) {
    const { from, type } = context
    bot.sendMessage(from.id, message, dict.initMenuCron.getOptions(from.id,from.first_name,type))
}

function initTasks(activityName, userID, name) {
    try {
        const prefix = `${activityName}@${userID}`
        const task = new Tasks(userID, activityName, name)
        addLookUp(userID, prefix,task )
        currentState[userID] = activityName
        const response = {
            record:true,
            prefix: activityName,
            userID,
            message: dict.initTasks.getMessage(),
            options: dict.initTasks.getOptions()
        }
        handleRespond(response, userID)
    } catch (e) {
        Logger.err(initTasks.name,e.message)
    }
}

// Register Current User to lookUp as Report@userId
async function initOfferTask(id, name) {
    const prefix = `TakeOfferTask@${id}`
    const injector = `Menu@${id}`
    // user was regitered
    if (lookUp[id]!=undefined && prefix in lookUp[id]) return { active: true }
    const response = {
        message: dict.initOfferTask.done.getMessage(name),
        options:  dict.initOfferTask.done.getOptions(injector)
    }
    await db.getUserTasks(id).then(results => {
        if (results.length != 0) {
            const projects = helper.parseToReportFormat(results)
            const { inlineKeyboard, addrs } = helper.generateTasksKeyboard(projects[id], prefix, "Process", "Cancel")
            // regiter current user to lookUp as Report@userId
            const takeOfferTask = new TakeOfferTask(projects[id], id, name, inlineKeyboard).addCache(prefix, addrs)
            addLookUp(id, prefix, takeOfferTask)
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
    if ((lookUp[id]!=undefined) && (prefix in lookUp[id])) return { active: true }
    const response = {
        message: dict.initUserReport.done.getMessage(name),
        options: dict.initUserReport.done.getOptions(injector)
    }
    await db.getUserTasks(id).then(results => {
        if (results.length != 0) {
            const projects = helper.parseToReportFormat(results)
            const { inlineKeyboard, addrs } = helper.generateTasksKeyboard(projects[id], prefix)
            // regiter current user to lookUp as Report@userId
            const report = new Report(projects[id], id, name, inlineKeyboard).addCache(prefix, addrs)
            addLookUp(id, prefix, report)
            response.options = dict.initUserReport.inprogress.getOptions(inlineKeyboard)
            response.message = dict.initUserReport.inprogress.getMessage(name)
        }
    })
    return response
}

async function initProjects(activityName, userID, name) {
    try {
        const prefix = `${activityName}@${userID}`
        const crudProject = new CrudProject(userID, name, activityName)
        addLookUp(userID, prefix, crudProject)
        let response
        if (activityName === "createProjects") {
            currentState[userID] = `${activityName}`
            console.log(userID, `lock user in state '${activityName}'`)
            const response = {
                message: dict.initProjects.getMessage(),
                options: dict.initProjects.getOptions()
            }
            return handleRespond(response, userID)
        } else if (activityName === "readProjects") {
            response = await crudProject.listen('read')
            return handleRespond(response, userID)
        }
        response = await crudProject.listen('showKeyboard')
        return handleRespond(response, userID)

    } catch (e) {
        Logger.err(initProjects.name,e.message)
    }
}

bot.onText(/\/problems/, (context, match)=>{
    try {
        const {from, chat} = context
        initProblems('problems', chat.id, chat.first_name)
    } catch (error) {
        Logger.err('BOT-problems',error.message)
    }
})
bot.onText(/\/assignProject/, (context, match)=>{
    try {
        const {from, chat, message_id} = context
        bot.deleteMessage(chat.id, message_id)
        initAssignProject(chat.id, chat.first_name, 'assignProject')
    } catch (error) {
        Logger.err('BOT-assignProject',error.message)
    }
})

async function initAssignProject(userID, name, activityName){
    try{
        const prefix = `${activityName}@${userID}`
        const _assignProject = new assignUsersProject(userID, name, activityName)
        addLookUp(userID, prefix, _assignProject)
        const response = await _assignProject.listen('onStart')
        return handleRespond(response, userID)
    }catch(err){
        Logger.err('BOT-initAssignProject',err.message)
    }
}
async function initListDayOff(userID, name){
    const prefix = `${'listDayOff'}@${userID}`
    const listCuti = new ListCuti('listDayOff', userID, name)
    addLookUp(userID, prefix, listCuti)
    let response = await listCuti.listen('onStart')
    handleRespond(response, userID)
}

const initSpam = (userID)=>{
    const prefix = `Spammer@${userID}`
    currentState[`autostart@${userID}`] = userID
    const spam = new Spammer(userID,bot)
    addLookUp(userID, prefix, spam)
    spam.setSchedule(' * * * * *')
    spam.init()
}
async function initProblems(activityName, userID, name){
    const prefix = `${activityName}@${userID}`
    const insertProblems = new InsertProblems(userID, name, activityName)
    addLookUp(userID, prefix, insertProblems)
    const response = await insertProblems.listen('onStart')
    return handleRespond(response, userID)
}

function initCuti(chat) {
    const prefix = `CalendarKeyboard@${chat.id}`;
    const calendar = new CalendarKeyboard(prefix, chat.id);
    addLookUp(chat.id, prefix, calendar)
    const date = new Date();
    bot.sendMessage(chat.id, "Pilih Tanggal Awal dan Akhir", {
        parse_mode: 'Markdown',
        reply_markup: {
            inline_keyboard: calendar.makeCalendar(date.getFullYear(), date.getMonth(), 'onChoose')
        }
    });
}

async function initMonit(userID, name){
    const prefix = `monitUsers@${userID}`
    const monit = new MonitoringUsers(userID, name)
    addLookUp(userID, prefix, monit)
    let res = await monit.onStart()
    handleRespond(res, userID)
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
            const prefix = `Menu@${user.userID}@cron`
            const menu = new Menu(user.userID).addCache(`from@${user.userID}`, { from: context.from })
            addLookUp(user.userID, prefix, menu)
            initMenuCron(context, message)
        })
    }else{
        await dict.reminder.second.getMessage(user.name,user.userID).then(message=>{
            if(message!=false){
                const menu = new Menu(user.userID).addCache(`from@${user.userID}`, { from: context.from })
                const prefix = `Menu@${user.userID}@cron`
                addLookUp(user.userID, prefix, menu)
                initMenuCron(context, message)    
            }
        })
            
    }
    
}


function remindProjectStart(){
    const start = conf.getSettings().projects.deadlineReminder.toLowerCase()
    let count = 1
    let multiplier = 24*60*60*1000
    if(start.match(/\d+\s*[dwmy]{1}$/) == null){
        Logger.err(remindProjectStart.name,`Format reminder projects error '${start}' ! Using default value '1 w'`) 
        return 7*multiplier
    }else{
        count = start.match(/\d+\s*/).pop()
        dateFormat = start.slice(count.length,count.length+1)
        switch(dateFormat){
            case 'w':
                multiplier*=7
            break
            case 'm':
                multiplier*=30
            break
            case 'y':
                multiplier*=365
            break
            default:
        }
    }

    return parseInt(count)*multiplier
}

async function remindProjects(){
    const projects    = await db.getDetailedProject('In Progress')
    let remindStart   = remindProjectStart()
    const groupID     = await db.getGroupID()
    moment.locale('id')

    for(let project of projects){
        let today     = new Date()
        let deadline  = project.deadline==null? new Date(0) : project.deadline.toDate()
        let diff    = deadline-today
        let diffLocale =  moment(`${deadline.getFullYear()}
        ${deadline.getMonth()<10?`0${deadline.getMonth()+1}`:deadline.getMonth()+1}${deadline.getDate()<10?`0${deadline.getDate()}`:deadline.getDate()}`,'YYYYMMDD').fromNow()

        if(diff>0&&diff<remindStart){
            project.users.forEach(user=>{
                bot.sendMessage(user,`Mengingatkan deadline Project *${project.projectName}* akan berakhir *${diffLocale}* ${emoticon.smile}`,{parse_mode:'Markdown'})
            })
        }
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
    console.log('reminder not allowed')
    return false
}

async function mentionUser(){
    const inactiveUsers = []
    const allUser = await db.getUsersData('all')
    for(let user of allUser){
        if(user.status=='active'){
            const isHaveActivity = await db.isUserActive(user.userID)
            if(!isHaveActivity){
                inactiveUsers.push(user)
            }
        }
    }
    let i = 1
    const groupID = await db.getGroupID()
    let message = `Selamat siang, teruntuk nama dibawah ini dimohon segera melapor via bot.\n`
    inactiveUsers.forEach(user=>{
        message = message.concat(`${i}. [${user.name}](tg://user?id=${user.userID})
        \n`)
        i++
    })
    bot.sendMessage(groupID,message,{parse_mode:'Markdown'})
}

/**
 * Cron function for reminder every 9 A.M
 * The function get data from database and check if user is active or not
 */

/**
 * Send reminder message at 10 A.M
 * SCHEDULE_10
 */
const cron10 = cron.schedule(SCHEDULE_10,()=>{
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
const cron13 = cron.schedule(SCHEDULE_13,()=>{
    allowReminder().then(allowed=>{
        if(allowed){
            reminder(13)
        }
    })
})

/**
 * Remind projects deadline
 */
const cronProject = cron.schedule(SCHEDULE_REMINDPROJECT,()=>{
    // console.log('10 A.M')
    allowReminder().then(allowed=>{
        if(allowed){
            remindProjects()
        }
    })
})

const cronMention = cron.schedule(SCHEDULE_MENTION,function(){
    allowReminder().then(async allowed=>{
        if(allowed){
            mentionUser()
        }
    })
})
/**
 * Set a user active or not based on day-off databases
 * SCHEDULE_RESET
 */
const cronreset = cron.schedule(SCHEDULE_RESET,()=>{
    // console.log('reset')    
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

function cronstart(){
    cron10.start()
    cron13.start()
    cronMention.start()
    cronProject.start()
    cronreset.start()
}

cronstart()

// ----------------------------------------- (polling error) ----------------------------------------------- //

bot.on('polling_error', msg => {
    Logger.err('Telegram Bot',msg.message)
})





