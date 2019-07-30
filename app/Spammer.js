const {App} = require('../core/App')
const cron  = require('node-cron')
const {message,options}      = require('./resources/Spammer.config') 

class Spammer extends App{
    constructor(userID,bot){
        super()
        this.register([
           'setSchedule',
           'setMessage',
           'sender',
           'stop',
           'onTaskDone',
           'onAddProblem'
        ])
        // Define Class variable here
        this.prefix     = `${Spammer.name}@${userID}`
        this.userID     =  userID        
        this.bot        = bot
        this.last       = {
            chatId:undefined,
            msgId :undefined
        }
        this.id = userID
    }

    init(){
        const sender = ()=>{
            if(this.last.chatId===undefined){
                this.bot.sendMessage(this.userID,message,options(this.prefix))
                .then(result=>{
                    this.last.chatId = result.chat.id
                    this.last.msgId  = result.message_id
                })
            }else{
                this.bot.deleteMessage(this.last.chatId,this.last.msgId)
                this.bot.sendMessage(this.userID,message,options(this.prefix))
                .then(result=>{
                    this.last.chatId = result.chat.id
                    this.last.msgId  = result.message_id
                })
            }

        }
        this.job = cron.schedule(this.schedule,sender.bind(this))
        this.job.start()
    }

    setSchedule(schedule){
        this.schedule = schedule
    }

    onTaskDone(){
        this.job.destroy()
        return {
            type:'Auto',
            message:'/report'
        }
    }

    onAddProblem(){
        this.job.destroy()
        return {
            type:'Auto',
            message:'/problems'
        }
    }

    setMessage(msg){

        this.msg = msg
    }

    stop(){
        console.log('stop')
        this.job.destroy()
        return {
            type:'Delete',
            id  :this.userID
        }
    }
}

module.exports={
    Spammer
}