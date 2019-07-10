const onTypeListenMessage=(project, userID, prefix)=>{
    return {
        userID,
        prefix,
        record:true,
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
const onCancelMessage=(type, id,prefix)=>{
    if(type===undefined){
        type="Send"
    }
    return {
        type:type,
        id,
        prefix,
        userID:id,
        record:true,
        message:`permintaan dibatalkan`,
        destroy:true,
        options:{
            reply_markup:{remove_keyboard:true,}
        },
    }
}
const onUpdate=(userID, prefix, project)=>{
    return {
        type: 'Edit',
        listenType:true,
        userID,
        prefix,
        record:true,
        message:`Silahkan inputkan ${project} akan dirubah menjadi apa?`,
        options:{

        }
    }
}

const onSureMessage=(text, prefix, userID, action, token, edit)=>{
    return {
        type: edit ? 'Edit':'Send',
        record:true,
        prefix,
        userID,
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

const updated =()=>{
    return {
        type:'Send',
        destroy:true,
        record:true,
        message:`Project berhasil di ubah!`,
        options:{
            
        }
    }
}

const onCreated=()=>{
    return {
        message:`Projects mu berhasil disimpan!`,
        destroy:true,
        record:true,
        options:{
            parse_mode:'HTML',
            reply_markup:{remove_keyboard:true}
        }
    }
}

const onDeleted=(id)=>{
    return {
        type:"Delete",
        message:`Projects mu berhasil dihapus!`,
        destroy:true,
        record:true,
        id,
        options:{
            parse_mode:'HTML',
            reply_markup:{remove_keyboard:true}
        }
    }
}

const onSelectMessage=(keyboard, userID, first, msg, prefix)=>{
    return{
        type:first ? 'Send':'Edit',
        id:userID,
        record:true,
        prefix,
        userID,
        message:`Berikut list projects nya, pilih ya`,
        options:{
            parse_mode:'HTML',
            reply_markup:{
                inline_keyboard:keyboard
            }
        }
    }
}

const onShowProjects=(message, prefix, token)=>{
    const [p, id] = prefix.split('@')
    return{
        message,
        prefix:p,
        id,
        userID:id,
        record:true,
        options:{
            reply_markup:{
                inline_keyboard:[
                    [
                        {text:"CLOSE", callback_data:`${prefix}-onClose-${token}`}
                    ]
                ]
            }
        }
    }
}
module.exports={
    onTypeListenMessage,
    onCancelMessage,
    onSureMessage,
    onCreated,
    onSelectMessage,
    onDeleted,
    onUpdate,
    updated,
    onShowProjects
}