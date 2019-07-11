const onStartMessage = (inline_keyboard)=>{
    return{
        
        message:`Silahkan pilih project yang akan di tambahkan user(s) nya:\n`,
        options:{
            reply_markup:{
                inline_keyboard
            }
        }
    }
}

module.exports={onStartMessage}