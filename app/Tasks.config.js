const onTypeListenMessage=(task, prefix, userID, token)=>{

    return {
        type:'Confirm',
        prefix,
        userID,
        record:true,
        sender:{
            type:'Delete',
            id:userID
        },
        receiver:{
            id:userID,
            userID,
            message:`${task} berhasil ditambahkan, silahkan tambahkan lagi, atau klik <b>SAVE</b>, silahkan pilih priority nya`,
            prefix,
            options:{
                parse_mode: "HTML",
                reply_markup: JSON.stringify({
                    resize_keyboard:true,
                    remove_keyboard:true,
                    inline_keyboard: [
                        [ 
                            {text:'HIGH', callback_data:`${prefix}@${userID}-setPriority-HIGH@${token}`},
                            {text:'MEDIUM', callback_data:`${prefix}@${userID}-setPriority-MEDIUM@${token}`},
                            {text:'LOW', callback_data:`${prefix}@${userID}-setPriority-LOW@${token}`} 
                        ],
                        [ {text:'CANCEL', callback_data:`${prefix}@${userID}-setPriority-CANCEL@${token}`} ],
                    ],
                })
            }
        }
    }
}

const onPrioritySelected= (priority,userID,prefix)=>{
    return {
        // type:"Delete",
        listenType:true,
        record:true,
        userID,
        prefix,
        message:`Priority ditetapkan <b>${priority}</b>, silahkan tambah task(s) lagi atau click save jika sudah`,
        options:{
            parse_mode:'HTML',
            reply_markup:{
                resize_keyboard:true,
                keyboard:[
                    ['SAVE'],
                    ['CANCEL']
                ]

            }
        },
    }
}

const onSelectProjects = (projects,prefix, userID) =>{
    console.log(projects)
    return {
        record:true,
        prefix,
        userID,
        message:`Tasks ini untuk project yang mana?`,
        options:{
            parse_mode:'HTML',
            reply_markup:{
                remove_keyboard:true,
                inline_keyboard:projects
            }
        }
    }
}
const onCancelMessage=(id,prefix)=>{
    // return {
    //     type:'Edit',
    //     id,
    //     message:`permintaan dibatalkan`,
    //     destroy:true,
    // }
    return {
        type:'Delete',
        userID:id,
        prefix,
        record:true,
        destroy:true,
        id,
    }
}

const onSureMessage=(text, prefix, userID, token)=>{
    return {
        record:true,
        message:`${text}`,
        prefix,
        userID,
        options:{
            parse_mode:'HTML',
            reply_markup:{
                remove_keyboard:true,
                inline_keyboard:[
                    [
                        {text:"Yakin", callback_data:`${prefix}@${userID}-onSure-Y@${token}`},
                        {text:"Tidak", callback_data:`${prefix}@${userID}-onSure-N@${token}`}
                    ]
                ]
            }
        }
    }
}

const onSaved=()=>{
    return{
        record:true,
        destroy:true,
        message:`Selamat, data anda berhasil disimpan!`,
        options:{
            parse_mode:'HTML',
            reply_markup:{
                remove_keyboard:true
            }
        }
    }
}

const onAssign=(to, textMe, textTo)=>{
    return{
        multiple:true,
        to,
        record:true,
        destroy:true,
        message:`${textMe}`,
        messageTo:`${textTo}`,
        options:{parse_mode:'HTML', reply_markup:{remove_keyboard:true}}
    }
}

const onSelectUser=(users)=>{
    return {
        message:`Silahkan pilih user, yang akan di assign task nya`,
        record:true,
        options:{
            parse_mode:'HTML',
            reply_markup:{
                remove_keyboard:true,
                inline_keyboard:users
            }
        }
    }
}

const onShowTasks=(text)=>{
    console.log(text)
    return {
        record:true,
        message:`${text}`,
        options:{
            parse_mode:'HTML',
            reply_markup:{
                remove_keyboard:true
            }
        }
    }
}
module.exports={
    onTypeListenMessage,
    onCancelMessage,
    onPrioritySelected,
    onSelectProjects,
    onSureMessage,
    onSaved,
    onSelectUser,
    onAssign,
    onShowTasks
}