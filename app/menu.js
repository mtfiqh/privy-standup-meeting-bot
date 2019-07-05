const {isAdmin} = require("./DataTransaction")

const {App} = require('../core/App')

class Menu extends App{
    constructor(bot){
        super()
        this.register=[
            this.onTasks
        ]
        this.bot=bot
    }

    onTasks(from){
        console.log(from.id, "show button tasks, checking is admin")
        this.bot.sendMessage(from.id,"Mohon Tunggu sebentar ya....", { parse_mode: "HTML", reply_markup:{ remove_keyboard:true}} ).then(()=>{
            isAdmin(from.id).then(admin=>{
                let keyboard=[
                    [
                        {text:'+ Add Tasks', callback_data:"addTasks-onCallbackInsertTask-"+from.id+"@"+from.first_name}, 
                        {text:'Show Tasks', callback_data:"addTasks-onShowTasks-"+from.id}
                    ],
                    
                ]
                console.log(from.id, "is Admin",admin)
                if(admin){
                    keyboard.push([ {text:'Assign Tasks', callback_data:"assignTasks-onCallback-"+from.id+'@'+from.first_name}])
                }
                let opts= {
                    // reply_to_message_id: msg.message_id,
                    parse_mode: "HTML",
                    reply_markup: JSON.stringify({
                        inline_keyboard: keyboard
                        // remove_keyboard:true,
                    })
                }

                this.bot.sendMessage(from.id,"Menu: Task", opts)
            })

        })
    }
}

module.exports={Menu}