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

const onSelectionMessage = (inline_keyboard, id, msg)=>{
    return{
        type:'Edit',
        id,
        message:msg?msg:`Silahkan pilih project yang akan di tambahkan user(s) nya:\n`,
        options:{
            reply_markup:{
                inline_keyboard
            }
        }

    }
}


const onCancelMessage=(id, prefix, token)=>{
    return{
        type:'Edit',
        id,
        message:'Permintaan Dibatalkan',
        options:{
            reply_markup:{
                inline_keyboard:[
                    [{text:'Close', callback_data:`${prefix}-onClose-${token}`}]
                ]
            }
        }
    }
}

const onSureMessage=(id, prefix, token, project,users)=>{
    return{
        type:'Edit',
        id,
        message:`Apakah kamu yakin untuk melakukan assign ke project ${project} untuk:\n${users}`,
        options:{
            reply_markup:{
                inline_keyboard:[
                    [
                        {text:'Ya', callback_data:`${prefix}-onSure-Y@${token}`},
                        {text:'Tidak', callback_data:`${prefix}-onSure-N@${token}`},
                    ]
                ]
            }
        }
    }
}

const onSuccess=(id, prefix,token)=>{
    return{
        type:'Edit',
        id,
        message:'Selamat, users berhasil disimpan!',
        options:{
            reply_markup:{
                inline_keyboard:[
                    [{text:'Close', callback_data:`${prefix}-onClose-${token}`}]
                ]
            }
        }
    }
}
module.exports={onStartMessage, onSelectionMessage, onCancelMessage, onSureMessage, onSuccess}