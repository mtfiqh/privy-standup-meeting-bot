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
           'stop'
        ])
        // Define Class variable here
        this.prefix     = `${Spammer.name}@${userID}`
        this.userID     =  userID        
        this.bot        = bot
    }

    init(){
        const sender = ()=>{
            console.log('send')
            this.bot.sendMessage(this.userID,message,options(this.prefix))
        }
        this.job = cron.schedule(this.schedule,sender.bind(this))
        this.job.start()
    }

    setSchedule(schedule){
        this.schedule = schedule
    }

    setMessage(msg){

        this.msg = msg
    }

    sender(){
        this.bot.sendMessage(this.userID,message,options)
    }

    stop(){
        console.log('stop')
        this.job.destroy()
    }
}

module.exports={
    Spammer
}