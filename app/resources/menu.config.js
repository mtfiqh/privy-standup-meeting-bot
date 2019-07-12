const em = require('./emoticons.config')

function callbackData(prefix, action, id, name) {
    return `${prefix}-${action}-${id}@${name}`
}

const Mapper = {
    "project":{
        text:"Projects",
        icon:em.project,
        action: "onProjectsClicked"
    },
    "task":{
        text:"Tasks",
        icon:em.tasks,
        action: "onTasksClicked"
    },
    "monitoring":{
        text:"Monitoring",
        icon:em.chart,
        action:"onMonitoringClicked"
    },
    "dayoff":{
        text:"Day-Off",
        icon:em.calendar,
        action:"onDayOff"
    },
    "toexcel":{
        text:"Save to Excel",
        icon:em.save,
        action:"onSave"
    },
    "close":{
        text:"Close",
        icon:em.close,
        action:"onClose"
    },
    "addproject":{
        text:"Add Projects",
        icon:em.add,
        action:"onAddProjects",
    },
    "editproject":{
        text:"Edit Projects",
        icon:em.edit,
        action:"onEditProjects"
    },
    "listproject":{
        text:"List Project",
        icon:em.list,
        action:"onListProjects"
    },
    "deleteproject":{
        text:"Delete Project",
        icon:em.delete,
        action:"onDeleteProjects"
    },
    "back":{
        text:"Back",
        icon:em.back,
        action:"onBackPressed"
    },
    "addtask":{
        text:"Add Tasks",
        icon:em.add,
        action:"onAddTasks"
    },
    "listtask":{
        text:"List Tasks",
        icon:em.list,
        action:"onListTasks"
    },
    "done":{
        text:"Mark Task As Done",
        icon:em.done,
        action:"onReportTasks"
    },
    "offer":{
        text:"Offer Tasks",
        icon:em.offer,
        action:"onOfferTasks"
    },
    "assignment":{
        text:"Assign Tasks",
        icon:`${em.tasks}${em.man}`,
        action:"onAssignTasks"
    }

    
}

function getButton(prefix, key, args){
    const {id, first_name:name} = args
    const {icon, text, action} = Mapper[key]
    return {
        text: `${icon} ${text}`,
        callback_data: callbackData(prefix,action, id, name)
    }
}


const menuAdmin = (prefix, from) => {
    return {
        type: 'Edit',
        id:from.id,
        from: prefix,
        parse_mode: 'Markdown',
        message: 'Pilih Menu Dibawah ini',
        reply_markup: {
            inline_keyboard: [
                [ 
                    {...getButton(prefix, 'project', from)}, 
                    {...getButton(prefix, 'task', from) }
                ], [
                    {...getButton(prefix, 'monitoring', from)},
                    {...getButton(prefix, 'dayoff', from)}
                ], [
                    {...getButton(prefix, 'toexcel', from)}            
                ], [
                    {...getButton(prefix, 'close', from)}
                ]
            ]
        }
    }
}

const menuUser = (prefix, from) => {
    return {
        type: 'Edit',
        id: from.id,
        from: prefix,
        parse_mode: 'HTML',
        message: 'Pilih Menu Dibawah ini',
        reply_markup: {
            inline_keyboard: [
                [
                    {...getButton(prefix, 'project', from)}, 
                    {...getButton(prefix, 'task', from)}, 
                ], [
                    {...getButton(prefix, 'close', from)}
                ]
            ]
        },

    }
}

const menuProjectsAdmin = (from, prefix) => {
    return {
        type: 'Edit',
        id: from.id,
        from: prefix,
        message: 'Silahkan pilih menu dibawah ini',
        options: {
            parse_mode: 'HTML',
            reply_markup: {
                inline_keyboard: [
                    [
                        {...getButton(prefix, 'addproject',from)}, 
                        {...getButton(prefix, "editproject", from)}
                    ], [
                        {...getButton(prefix,'listproject', from)},
                        {...getButton(prefix,'deleteproject', from)}
                    ], [
                        {...getButton(prefix, "back", from)},
                        {...getButton(prefix, "close", from)}
                    ]
                ]
            }
        }
    }
}

const menuProjectsUser = (from, prefix) => {
    return {
        type: 'Edit',
        id: from.id,
        from: prefix,
        message: 'Silahkan pilih menu dibawah ini',
        options: {
            parse_mode: 'HTML',
            reply_markup: {
                inline_keyboard: [
                    [
                        {...getButton(prefix,"listproject", from)}
                    ], [
                        {...getButton(prefix, "back", from)},
                        {...getButton(prefix, "close",from)}
                    ]
                ]
            }
        }
    }
}

const menuTasksUser = (prefix, from) => {
    return {
        type: 'Edit',
        id: from.id,
        from: prefix,
        message: 'Silahkan pilih menu dibawah ini',
        options: {
            parse_mode: 'Markdown',
            reply_markup: {
                inline_keyboard: [
                    [
                        {...getButton(prefix, "addtask", from)}, 
                        {...getButton(prefix, "listtask", from)}
                    ], [
                        {...getButton(prefix, "done", from)}, 
                        {...getButton(prefix, "offer", from)}
                    ], [
                        {...getButton(prefix, "back", from)}, 
                        {...getButton(prefix, 'close', from)}
                    ]
                ]
            }
        }
    }
}

const menuTasksAdmin = (prefix, from) => {
    return {
        type: 'Edit',
        id: from.id,
        from: prefix,
        message: 'Silahkan pilih menu dibawah ini',
        options: {
            parse_mode: 'HTML',
            reply_markup: {
                inline_keyboard: [
                    [
                        { ...getButton(prefix, 'addtask', from)},
                        { ...getButton(prefix,"listtask", from) }
                    ], [
                        { ...getButton(prefix, "done", from)}, 
                        { ...getButton(prefix, "offer", from)}
                    ], [
                        {...getButton(prefix, "assignment", from)}
                    ], [
                        { ...getButton(prefix, "back", from)}, 
                        { ...getButton(prefix, "close", from)}
                    ]
                ]
            }
        }
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