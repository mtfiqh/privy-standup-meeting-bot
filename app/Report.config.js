module.exports = {
    dictionary : {
        send:{
            success:{
                getMessage:  taskList =>` *Terimakasih!* Berikut Task anda yang sudah *Done*. ${taskList}`,
                getOptions: prefix => {
                    return { 
                        "parse_mode": "Markdown",
                        "reply_markup":{
                            "inline_keyboard":[
                                [
                                    {text:"Close", callback_data:`${prefix}-close`}
                                ]
                            ]
                        }
                    }
                }
            },
            failed:{
                getMessage: ()=>"*Mohon Maaf!*, Anda Harus memilih task.",
                getOptions:()=>{
                    return { "parse_mode": "Markdown"}
                }
            }
        },
        select:{
            success:{
                getMessage: name => `Halo *${name}* berikut task anda yang masih *In Progress*, silahkan di klik untuk task yang sudah *Done*`,
                getOptions: keyboard => {
                    return  {
                        "parse_mode": "Markdown",
                        "reply_markup":{
                            "inline_keyboard": keyboard
                        }
                    }
                }
            }
        }
    }
}