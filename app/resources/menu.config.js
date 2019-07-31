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
    "assignproject":{
        text:"Assign To Projects",
        icon:`${em.right}${em.man}`,
        action:"onAssignUserToProjects"
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
    },
    "problem":{
        text:"Add Problem",
        icon:`${em.add}`,
        action:"onAddProblem"
    },
    "assignRole":{
        text:"Assign/Change Role",
        icon:`${em.man}${em.edit}`,
        action:"onAssignRole"
    },
    "monitoringUsers":{
        text:"Monitoring Users",
        icon:em.list,
        action:'onMonitoringUsers'
    },
    "addFeedback":{
        text:"Add Feedback",
        icon:em.exc,
        action:'onAddFeedback'
    },
    "readFeedback":{
        text:"Read Feedback",
        icon:em.list,
        action:'onReadFeedback'
    },
    'editDeadline':{
        text:"Edit project deadline",
        icon:em.offer,
        action:"onEditDeadline"
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

//---------------------------------------- Menu Admin ---------------------
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
                ],
                [
                    {...getButton(prefix,'assignRole', from)}
                ],
                [
                    {...getButton(prefix, 'addFeedback', from)},
                    {...getButton(prefix, 'readFeedback', from)}
                ],
                [
                    {...getButton(prefix, 'toexcel', from)}            
                ], [
                    {...getButton(prefix, 'close', from)}
                ]
            ]
        }
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
                    ], [
                        {...getButton(prefix, "editproject", from)},
                        {...getButton(prefix,'deleteproject', from)}
                    ],[
                        {...getButton(prefix,'assignproject', from)},
                        {...getButton(prefix, 'editDeadline', from)}
                    ],[
                        {...getButton(prefix, "back", from)},
                        {...getButton(prefix, "close", from)}
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
                        {...getButton(prefix, "problem", from)}
                    ], [
                        { ...getButton(prefix, "done", from)}, 
                        { ...getButton(prefix, "offer", from)}
                    ], [
                        {...getButton(prefix, "assignment", from)},
                    ], [
                        { ...getButton(prefix, "back", from)}, 
                        { ...getButton(prefix, "close", from)}
                    ]
                ]
            }
        }
    }

}

const menuMonitoringAdmin = (prefix, from) => {
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
                        {...getButton(prefix,'listproject', from)},
                        { ...getButton(prefix,"listtask", from) }
                    ],
                    [
                        {...getButton(prefix, 'monitoringUsers', from)}
                    ],
                    [
                        { ...getButton(prefix, "back", from)}, 
                        { ...getButton(prefix, "close", from)}
                    ]
                ]
            }
        }
    }
}


// -------------------------- USER MENU ---------------------------

const menuUser = (prefix, from) => {
    return {
        type: 'Edit',
        id:from.id,
        from: prefix,
        parse_mode: 'Markdown',
        message: 'Pilih Menu Dibawah ini',
        reply_markup: {
            inline_keyboard: [
                [ 
                    {...getButton(prefix, 'task', from) }
                ], [
                    {...getButton(prefix, 'monitoring', from)},
                    {...getButton(prefix, 'dayoff', from)}
                ],
                [
                    {...getButton(prefix, 'addFeedback', from)},
                ],
                [
                    {...getButton(prefix, 'close', from)}
                ]
            ]
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
            parse_mode: 'HTML',
            reply_markup: {
                inline_keyboard: [
                    [
                        { ...getButton(prefix, 'addtask', from)},
                        {...getButton(prefix, "problem", from)}
                    ], [
                        { ...getButton(prefix, "done", from)}, 
                        { ...getButton(prefix, "offer", from)}
                    ],
                    [
                        { ...getButton(prefix, "back", from)}, 
                        { ...getButton(prefix, "close", from)}
                    ]
                ]
            }
        }
    }

}

const menuMonitoringUser = (prefix, from) => {
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
                        {...getButton(prefix,'listproject', from)},
                        { ...getButton(prefix,"listtask", from) }
                    ],
                    [
                        { ...getButton(prefix, "back", from)}, 
                        { ...getButton(prefix, "close", from)}
                    ]
                ]
            }
        }
    }
}

//-------------------------PM SECTION---------------------------
const menuPM = (prefix, from) => {
    return {
        type: 'Edit',
        id:from.id,
        from: prefix,
        parse_mode: 'Markdown',
        message: 'Pilih Menu Dibawah ini',
        reply_markup: {
            inline_keyboard: [
                [ 
                    {...getButton(prefix, 'task', from) }
                ], [
                    {...getButton(prefix, 'monitoring', from)},
                    {...getButton(prefix, 'dayoff', from)}
                ],
                [
                    {...getButton(prefix, 'addFeedback', from)},
                ],
                [
                ], [
                    {...getButton(prefix, 'close', from)}
                ]
            ]
        }
    }
}



const menuTasksPM = (prefix, from) => {
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
                        {...getButton(prefix, "problem", from)}
                    ], [
                        { ...getButton(prefix, "done", from)}, 
                        { ...getButton(prefix, "offer", from)}
                    ],[
                        { ...getButton(prefix, "back", from)}, 
                        { ...getButton(prefix, "close", from)}
                    ]
                ]
            }
        }
    }

}

const menuMonitoringPM = (prefix, from) => {
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
                        {...getButton(prefix,'listproject', from)},
                        { ...getButton(prefix,"listtask", from) }
                    ],
                    [
                        { ...getButton(prefix, "back", from)}, 
                        { ...getButton(prefix, "close", from)}
                    ]
                ]
            }
        }
    }
}

//------------------------------QA SECTION---------------------------
const menuQA = (prefix, from) => {
    return {
        type: 'Edit',
        id:from.id,
        from: prefix,
        parse_mode: 'Markdown',
        message: 'Pilih Menu Dibawah ini',
        reply_markup: {
            inline_keyboard: [
                [ 
                    {...getButton(prefix, 'task', from) }
                ], [
                    {...getButton(prefix, 'monitoring', from)},
                    {...getButton(prefix, 'dayoff', from)}
                ],
                [
                    {...getButton(prefix, 'addFeedback', from)},
                ],
                [
                ], [
                    {...getButton(prefix, 'close', from)}
                ]
            ]
        }
    }
}



const menuTasksQA = (prefix, from) => {
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
                        {...getButton(prefix, "problem", from)}
                    ], [
                        { ...getButton(prefix, "done", from)}, 
                        { ...getButton(prefix, "offer", from)}
                    ],[
                        { ...getButton(prefix, "back", from)}, 
                        { ...getButton(prefix, "close", from)}
                    ]
                ]
            }
        }
    }

}

const menuMonitoringQA = (prefix, from) => {
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
                        {...getButton(prefix,'listproject', from)},
                        { ...getButton(prefix,"listtask", from) }
                    ],
                    [
                        { ...getButton(prefix, "back", from)}, 
                        { ...getButton(prefix, "close", from)}
                    ]
                ]
            }
        }
    }
}

//--------------------------LEAD SECTION-------------------
const menuLead = (prefix, from) => {
    return {
        type: 'Edit',
        id:from.id,
        from: prefix,
        parse_mode: 'Markdown',
        message: 'Pilih Menu Dibawah ini',
        reply_markup: {
            inline_keyboard: [
                [ 
                    {...getButton(prefix, 'task', from) }
                ], [
                    {...getButton(prefix, 'monitoring', from)},
                    {...getButton(prefix, 'dayoff', from)}
                ],
                [
                    {...getButton(prefix, 'addFeedback', from)},
                ],
                [
                ], [
                    {...getButton(prefix, 'close', from)}
                ]
            ]
        }
    }
}



const menuTasksLead = (prefix, from) => {
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
                        {...getButton(prefix, "problem", from)}
                    ], [
                        { ...getButton(prefix, "done", from)}, 
                        { ...getButton(prefix, "offer", from)}
                    ],[
                        { ...getButton(prefix, "back", from)}, 
                        { ...getButton(prefix, "close", from)}
                    ]
                ]
            }
        }
    }

}

const menuMonitoringLead = (prefix, from) => {
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
                        {...getButton(prefix,'listproject', from)},
                        { ...getButton(prefix,"listtask", from) }
                    ],
                    [
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
    menuProjectsAdmin,
    menuTasksAdmin,
    menuMonitoringAdmin,
    menuPM,
    menuTasksPM,
    menuMonitoringPM,
    menuQA,
    menuTasksQA,
    menuMonitoringQA,
    menuLead,
    menuTasksLead,
    menuMonitoringLead,
    menuUser,
    menuTasksUser,
    menuMonitoringUser
}