const onTypeListenMessage=(task, prefix, userID, token)=>{

    return {
        message:`${task} berhasil ditambahkan, silahkan tambahkan lagi, atau klik <b>SAVE</b>, silahkan pilih priority nya`,
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

const onPrioritySelected= (priority,userID,prefix)=>{
    return {
        // type:"Delete",
        listenType:true,
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

const onSelectProjects = (projects) =>{
    console.log(projects)
    return {
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
const onCancelMessage=()=>{
    return {
        message:`permintaan dibatalkan`,
        destroy:true,
        options:{
            reply_markup:{remove_keyboard:true}
        },
    }
}

const onSureMessage=(text, prefix, userID, token)=>{
    return {
        message:`${text}`,
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
        message:`${textMe}`,
        messageTo:`${textTo}`,
        options:{parse_mode:'HTML', reply_markup:{remove_keyboard:true}}
    }
}

const onSelectUser=(users)=>{
    return {
        message:`Silahkan pilih user, yang akan di assign task nya`,
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