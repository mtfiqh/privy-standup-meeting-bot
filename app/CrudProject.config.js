const onTypeListenMessage=(project, userID, prefix)=>{
    return {
        userID,
        prefix,
        listenType:true,
        message:`<b>${project}</b> ditambahkan ke data sementara`,
        options:{
            parse_mode:'HTML',
            reply_markup:{
                resize_keyboard:true,
                keyboard:[
                    ['SAVE'],
                    ['CANCEL']
                ]
            }
        }
    }
}
const onCancelMessage=()=>{
    return {
        message:`permintaan dibatalkan`,
        destroy:true,
        options:{
            reply_markup:{remove_keyboard:true}
        },
    }
}

const onSureMessage=(text, prefix, userID, action, token)=>{
    return {
        message:`${text}`,
        options:{
            parse_mode:'HTML',
            reply_markup:{
                inline_keyboard:[
                    [
                        {text:'Ya', callback_data:`${prefix}@${userID}-${action}-Y@${token}`},
                        {text:'Tidak', callback_data:`${prefix}@${userID}-${action}-N@${token}`}
                    ]
                ]
            }
        }
    }
}

const onCreated=()=>{
    return {
        message:`Projects mu berhasil disimpan!`,
        destroy:true,
        options:{
            parse_mode:'HTML',
            reply_markup:{remove_keyboard:true}
        }
    }
}
module.exports={
    onTypeListenMessage,
    onCancelMessage,
    onSureMessage,
    onCreated
}