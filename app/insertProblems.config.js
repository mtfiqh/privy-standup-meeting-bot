const onStartMessage = (id, inline_keyboard, type)=>{
    return{
        type:type?type:'Send',
        id,
        message:'Pilih task yang ada masalah',
        options:{
            reply_markup:{
                inline_keyboard
            }
        }
    }
}

const onCancelMessage = (id, prefix, token)=>{
    return{
        id,
        type:'Edit',
        message:'Permintaan dibatalkan!',
        options:{
            reply_markup:{
                inline_keyboard:[
                    [{text:'Close', callback_data:`${prefix}-onClose-${token}`}]
                ]
            }
        }
    }
}
const onCancelMessage2 = (id, prefix, token)=>{
    const [userID, prefixx] = prefix
    return{
        type:'Confirm',
        record:true,
        prefix:prefixx,
        userID,
        sender:{
            type:'Delete',
            id
        },
        receiver:{
            id,
            record:true,
            prefix:prefixx,
            userID,
            type:'Send',
            message:'Permintaan dibatalkan!',
            options:{
                reply_markup:{
                    inline_keyboard:[
                        [{text:'Close', callback_data:`${prefix}-onClose-${token}`}]
                    ]
                }
            }

        }
    }
}

const onSelectedTaskMessage = (id, prefix, task)=>{
    return{
        type:'Confirm',
        sender:{
            id,
            type:'Delete',
        },
        receiver:{
            id,
            type:'Send',
            userID:id,
            listenType:true,
            prefix,
            record:true,
            message:`Silahkan masukkan masalah-masalah yang ada di task ${task}`,
            options:{
                reply_markup:{
                    resize_keyboard:true,
                    keyboard:[
                        ['CANCEL']
                    ]
                }
            }
        }
    }
}

const typeListenMessage = (id, prefix, problem)=>{
    return{
        id,
        userID:id,
        prefix,
        record:true,
        listenType:true,
        message:`masalah ${problem} sudah ditambahkan, silahkan tambahkan lagi bila ada!`,
        options:{
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

const onSaveMessage = (id, prefix, task, problems, token)=>{
    return{
        prefix,
        id,
        userID:id,
        type:'Send',
        message:`Apakah kamu yakin akan memasukkan kendala di task ${task} untuk list problems berikut:\n${problems}`,
        options:{
            reply_markup:{
                inline_keyboard:[
                    [
                        {text:'Ya', callback_data:`${prefix}@${id}-onSure-Y@${token}`},
                        {text:'Tidak', callback_data:`${prefix}@${id}-onSure-N@${token}`}
                    ]
                ]
            }
        }
    }

}

const onAdded = (id, prefix, token)=>{
    return{
        id,
        type:'Edit',
        message:'Kendala Berhasil ditambahkan!',
        options:{
            reply_markup:{
                inline_keyboard:[
                    [{text:'Tambahkan Kendala Lain', callback_data:`${prefix}-onClose-${token}@Y`}],
                    [{text:'Close', callback_data:`${prefix}-onClose-${token}`}]
                ]
            }
        }
    }
}
module.exports={onAdded, onSaveMessage, onStartMessage, onCancelMessage, onCancelMessage2, onSelectedTaskMessage, typeListenMessage}