const em = require('./emoticons.config')

const menuAdmin =(prefix,from)=>{
    return {
        type:'Edit',
        from:prefix,
        id:from.id,
        parse_mode:'HTML',
        message:'Pilih Menu Dibawah ini',
        reply_markup: {
            inline_keyboard:[
                [ 
                    {text: `${em.project} Projects`, callback_data: prefix+'-onProjectsClicked-'+from.id+'@'+from.first_name},
                    {text: `${em.tasks} Tasks`,callback_data:prefix+'-onTasksClicked-'+from.id+'@'+from.first_name}
                ],
                [ 
                    {text: `${em.chart} Monitoring`, callback_data: prefix+'-onMonitoringClicked-'+from.id+'@'+from.first_name}
                ],
                [
                    {text: `${em.save} Save to Excel`, callback_data: prefix+'-onSave-'+from.id+'@'+from.first_name}
                ],
                [
                    {text: `${em.close} Close`, callback_data: prefix+'-onClose-'+from.id+'@'+from.first_name}
                ]

            ]
        },
        deleteLast:true
    }
}

const menuUser = (prefix,from)=>{
    return {
        type:'Edit',
        from:prefix,
        parse_mode:'HTML',
        message:'Pilih Menu Dibawah ini',
        reply_markup: {
            inline_keyboard:[
                [ 
                    {text: `${em.project} Projects`, callback_data: prefix+'-onProjectsClicked-'+from.id+'@'+from.first_name},
                    {text: `${em.tasks} Tasks`,callback_data:prefix+'-onTasksClicked-'+from.id+'@'+from.first_name}
                ],
                [
                    {text: `${em.close} Close`, callback_data: prefix+'-onClose-'+from.id+'@'+from.first_name}
                ]
            ]
        },
        
    }
}

const menuProjectsAdmin = (from,prefix)=>{
    return {
        type:'Edit',
        id:from.id,
        from:prefix,
        message:'Silahkan pilih menu dibawah ini',
        options:{
            parse_mode:'HTML',
            reply_markup: {
                inline_keyboard:[
                    [ 
                        {text: `${em.add} Add Projects`, callback_data: prefix+'-onAddProjects-'+
                        from.id+'@'+from.first_name},

                        {text: `${em.edit} Edit Projects`,callback_data:prefix+'-onEditProjects-'+
                        from.id+'@'+from.first_name}
                    ],
                    [ 
                        {text: `${em.list} List Project`,callback_data:prefix+
                        '-onListProjects-'+from.id+'@'+from.first_name},
                        
                        {text: `${em.delete} Delete Project`, callback_data: prefix+
                        '-onDeleteProjects-'+from.id+'@'+from.first_name}
                    ],
                    [
                        {text: `${em.back} Back`,callback_data:prefix+
                        '-onBackPressed-'+from.id+'@'+from.first_name},
                        {text: `${em.close} Close`, callback_data: prefix+'-onClose-'+from.id+'@'+from.first_name}
                    ]
                ]
            }
        },
        // deleteLast:true
    }
}

const menuProjectsUser = (from,prefix)=>{
    return {
        type:'Edit',
        from:prefix,
        message:'Silahkan pilih menu dibawah ini',
        options:{
            parse_mode:'HTML',
            reply_markup: {
                inline_keyboard:[
                    [ 
                        {text: `${em.list} List Project`,callback_data:prefix+
                        '-onListProjects-'+from.id+'@'+from.first_name},
                    ],
                    [
                        {text: `${em.back} Back`,callback_data:prefix+
                        '-onBackPressed-'+from.id+'@'+from.first_name},
                        {text: `${em.close} Close`, callback_data: prefix+'-onClose-'+from.id+'@'+from.first_name}
                    ]
                ]
            }
        },
        // deleteLast:true
    }
}

const menuTasksUser = (prefix,from)=>{
    return {
        type:'Edit',
        from:prefix,
        message:'Silahkan pilih menu dibawah ini',
        options:{
            parse_mode:'HTML',
            reply_markup: {
                inline_keyboard:[
                    [ 
                        {
                            text: `${em.add} Add Tasks`,
                            callback_data:prefix+"-onAddTasks-"+
                            from.id+"@"+from.first_name
                        },
                        {
                            text: `${em.list} List Tasks`,
                            callback_data:prefix+"-onListTasks-"+from.id
                        }
                    ],
                    [
                        {
                            text: `${em.done} Mark Task As Done`,
                            callback_data:prefix+
                            '-onReportTasks-'+from.id+'@'+from.first_name
                        },
                        {
                            text: `${em.offer} Offer Tasks`,
                            callback_data:prefix+
                            '-onOfferTasks-'+from.id+'@'+from.first_name
                        }
                    ],
                    [
                        {text: `${em.back} Back`,callback_data:prefix+
                        '-onBackPressed-'+from.id+'@'+from.first_name},
                        {text: `${em.close} Close`, callback_data: prefix+'-onClose-'+from.id+'@'+from.first_name}
                    ]                    
                ]
            }
        },
        // deleteLast:true
    }
}

const menuTasksAdmin = (prefix,from)=>{
    return {
        type:'Edit',
        from:prefix,
        message:'Silahkan pilih menu dibawah ini',
        options:{
            parse_mode:'HTML',
            reply_markup: {
                inline_keyboard:[
                    [ 
                        {
                            text: `${em.add} Add Tasks`,
                            callback_data:prefix+"-onAddTasks-"+
                            from.id+"@"+from.first_name
                        },
                        {
                            text: `${em.list} List Tasks`,
                            callback_data:prefix+"-onListTasks-"+from.id
                        }
                    ],
                    [
                        {
                            text: `${em.done} Mark Tasks As Done`,
                            callback_data:prefix+
                            '-onReportTasks-'+from.id+'@'+from.first_name
                        },
                        {
                            text: `${em.offer} Offer Tasks`,
                            callback_data:prefix+
                            '-onOfferTasks-'+from.id+'@'+from.first_name
                        }
                    ],
                    [
                        {
                            text: `${em.tasks}${em.man} Assign Tasks`,
                            callback_data:prefix+
                            '-onAssignTasks-'+from.id+'@'+from.first_name
                        }
                    ],
                    [
                        {text: `${em.back} Back`,callback_data:prefix+
                        '-onBackPressed-'+from.id+'@'+from.first_name},
                        {text: `${em.close} Close`, callback_data: prefix+'-onClose-'+from.id+'@'+from.first_name}
                    ],                 
                ]
            }
        },
        // deleteLast:true
    }
}

module.exports = {
    menuAdmin,
    menuUser,
    menuProjectsAdmin,
    menuProjectsUser,
    menuTasksUser,
    menuTasksAdmin
}