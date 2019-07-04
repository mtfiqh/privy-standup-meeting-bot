const firebase  = require("./firebase.js")
const { save }  = require('./spreadsheets.js')

const dateTime  = require('node-datetime');

const admin     = firebase.admin()
const db        = firebase.database();
const users     = new Set([])
const projects  = []
const tasks     = new Set([])

load = () => {
    // listenUsers()
    // listenProjects()
    // listenTasks()
}

listenUsers = async () => {
    db.collection('users')
    .onSnapshot(user => {
        
        user.docChanges().forEach(data => {
    
            if (data.type === 'added') {
                console.log('Users added : ' + data.doc.data().userID)
                users.add(data.doc.data())
            } else if (data.type === 'removed') {
                console.log('Users removed : ' + data.doc.data().userID)
                users.delete(data.doc.data())
            }
    
        })
    
    })
}

listenProjects = async () => {
    db.collection('projects')
    .onSnapshot(project => {
        let tasks = []
        
        project.docChanges().forEach(data => {
            
            if (data.type === 'added') {
                
                if (data.doc.data().Task != undefined) {
                    data.doc.data().Task.forEach(dt => {
                        tasks.push(dt)
                    })
                }

                projects[data.doc.id] = {}
                projects[data.doc.id]['projectName'] = data.doc.data().projectName
                projects[data.doc.id]['Task'] = tasks
                tasks = []
                
                console.log('Projects added ' + data.doc.data().projectName)
            
            } else if (data.type === 'removed') {
                console.log('Projects ' + data.doc.data().projectName + ' removed')
            }
        })
    })
}

listenTasks = async () => {
    db.collection('tasks')
    .onSnapshot(user => {
        let counter = 0
        
        user.docChanges().forEach(data => {
            
            if (data.type === 'added') {
                tasks.add(data.doc.data())
                
                if (counter < 5) {
                    console.log('Task added : ' + data.doc.data().name)
                }
                
                if (counter === 5) {
                    console.log('More tasks loading in background')
                }
                
                counter++
            } else if (data.type === 'removed') {
                
                console.log('Tasks removed : ' + data.doc.data().name)

                db.collection('projects').doc(data.doc.data().projectID)
                .update(
                    { 
                        Task: admin.firestore.FieldValue
                            .arrayRemove(db.collection(tasks).doc(data.doc.data().taskID)) 
                    })

                tasks.delete(data.doc.data())
            
            } else if (data.type === 'modified') {
                console.log('Task modified : ' + data.doc.data().name)
            }
        })
    })
}

const getUsersData = async (id) => {
    let userData = new Set([])

    if (id === 'all') {
        return db.collection('users').get()
        .then(items => {

            items.forEach(item => {
                userData.add(item.data())
            })
            
            return Array.from(userData)
        })

    } else {
        let dbRef = db.collection('users').where('userID', '==', id)
        
        return dbRef.get()
        .then(data => {

            data.forEach(details => {
                userData.add(details.data())
            })
          
            return Array.from(userData)[0]
        })
    }
}

const getUserTasksOrderByPriority = async (uid, order) => {
    let taskList = []
    
    dbRef = db.collection('tasks').orderBy('priority', order)
    
    return dbRef.get()
    .then(results => {
        results.forEach(result => {

            if (result.data().status != 'done' && result.data().userID === uid) {
                taskList.push(result.data())
            }

        })
        
        return taskList
    }).catch(err => {
        console.log('Error : ' + err.details)
    }).finally(() => {
        console.log('Tasks for ' + uid + ' successfully loaded')
    })

}

const getProjects = async (type) => {
    let projectNames = new Set([])

    return db.collection('projects').get()
    .then(projects => {
        projects.forEach(project => {

            if (project.data().status == type) {
                projectNames.add(project.data().projectName)
            }

        })

        return projectNames
    }).catch(err => {
        console.log('Error : ' + err.details)
    }).finally(() => {
        console.log('Projects loaded!')
    })
}

const getUserTasks = async (uid) => {
    let taskList = []
    
    dbRef = db.collection('tasks').where('userID', '==', uid)
    return dbRef.get()
    .then(data => {
    
        data.forEach(dt => {
    
            if (dt.data().status != 'done') {
                taskList.push(dt.data())
            }
    
        })
    
        return taskList
    }).catch(err => {
        console.log('Error : ' + err.details)
    }).finally(() => {
        console.log('Tasks for ' + uid + ' successfully loaded')
    })

}

const getUserProjects = async (uid) => {
    let projectList = []
    dbRef = db.collection('projects').where('users', 'array-contains', uid)
    
    return dbRef.get()
    .then(data => {
        let temp = new Set([])

        data.forEach(dt => {
            temp.add(dt.data().projectName)
        })
    
        for (dt of temp) {
            let tmp = []
    
            tmp.push(dt)
            projectList.push(tmp)
        }
    
        return projectList
    }).catch(err => {
        console.log('Error : ' + err.details)
    }).finally(() => {
        console.log('Projects for ' + uid + ' successfully loaded')
    })
}

const getDate = () => {
    const date = dateTime.create();
    let timestamp = new Date(date.format('Y') + '/' + date.format('m') + '/' + date.format('d'))
    
    return {
        day: date.format('d'),
        month: date.format('m'),
        year: date.format('Y'),
        timestamp: timestamp
    }
}

const setAdmin = (userID) => {
    db.collection('users').doc(userID.toString())
        .update({ type: 'admin' })
        .catch(err => {
            if (err) {
                console.log('Error : ' + err.details)
            }
        })
        .finally(() => {
            console.log(userID + ' are successfully set as admin')
        })
}


const addTaskTransaction = async (data) => {
    let taskIDs = []
    let rep = {}
    console.log(data)
    for (dt of data) {
        rep[dt.userID] = {
            done: [],
            inProgress: [],
            info: [],
            problems: []
        }
    }
    console.log('data :')
    console.log(data)
    for (dt of data) {
        let taskRef = db.collection('tasks').doc()
        let taskID = taskRef.id
        let { timestamp } = getDate()
        taskIDs.push(taskID)

        let projectRef = db.collection("projects").where("projectName", "==", dt.projectName)
        await projectRef.get()
            .then(result => {
                console.log(result.data)
                result.forEach(item => {
                    console.log(item.data())
                    let temp = {}
                    temp[dt.userID] = {}
                    temp[dt.userID]['inProgress'] = admin.firestore.FieldValue.arrayUnion(dt.name)


                    taskRef.set(
                        {
                            taskID: taskRef.id,
                            name: dt.name,
                            projectName: dt.projectName,
                            status: 'In Progress',
                            projectID: item.id,
                            userID: dt.userID,
                            date: timestamp,
                            priority: dt.priority 
                        }
                    )

                    db.collection('projects').doc(item.id)
                        .update({ Task: admin.firestore.FieldValue.arrayUnion(taskRef) })

                    db.collection('projects').doc(item.id)
                        .update({ users: admin.firestore.FieldValue.arrayUnion(dt.userID) })

                    db.collection('reports').doc(timestamp.toString()).get()
                        .then(doc => {
                            db.collection('reports').doc(timestamp.toString())
                                .set(temp, { merge: true })
                        })
                     
                })
                //                db.collection('reports').doc(timestamp.toString()).set(rep,{merge:true})
                
            }).catch(err => {
                console.log(err)
            }).finally(() => {
                console.log('Task successfully added')
                console.log('Task ID : ' + taskID)
            })

    }
    return taskIDs
}

const addProjects = (projects) => {
    const pids = new Set([])
    projects.forEach(async project => {
        let projectRef = db.collection('projects').doc()
        let projectID = projectRef.id
        let { timestamp } = getDate()
        await projectRef
            .set(
                {
                    projectName: project.projectName,
                    date: timestamp,
                    status: 'In Progress',
                    Task: [],
                    users: []
                }
            )
            .catch(err => {
                console.log('Add project failed, error : ' + err.details)
            }).finally(() => {
                console.log('Project successfully added')
                console.log('Project ID : ' + projectID)
            })
        pids.add(projectID)
    })
    return pids
}

const isUserExist = async (userID) => {
    return db.collection('users').doc(userID.toString()).get()
        .then(data => {
            if (!data.exists) {
                return false
            } else {
                return true
            }
        }).catch(err => {
            console.log('Error : ' + err.details)
        })
}

const isAdmin = async (userID) => {
    return db.collection('users').doc(userID.toString())
        .get().then(data => {
            if (data.exists) {
                if (data.data().type === 'admin') {
                    return true
                } else {
                    return false
                }
            } else {
                return 'User not available'
            }
        }).catch(err => {
            console.log('Error : ' + err.details)
        })
}

const saveUser = (userID, data) => {
    db.collection('users').doc(userID).set(data)
        .catch(err => {
            console.log('Error : ' + err.details)
        })
        .finally(result => {
            console.log('result')
        })
}

const assignUserToProjects = (projectName, userID) => {
    console.log(projectName)
    let projectRef = db.collection("projects").where("projectName", "==", projectName)
    projectRef.get()
        .then(data => {
            data.forEach(dt => {
                db.collection('projects').doc(dt.id)
                .update({ users: admin.firestore.FieldValue.arrayUnion(userID) })
            })
        }).catch(err => {
            console.log('Error : ' + err.details)
        }).finally(() => {
            console.log('Assign ' + userID + ' to ' + projectName + ' succeeded')
        })
}

const editProjectName = (oldName, newName) => {
    let projectRef = db.collection('projects').where('projectName', '==', oldName)

    projectRef.get()
        .then(data => {
            data.forEach(dt => {
                db.collection('projects').doc(dt.id).set({ projectName: newName }, { merge: true })
            })
        }).catch(e => {
            console.log(e)
        })
}

const deleteProject = async (projectName) => {
    let projectRef = db.collection('projects').where('projectName', '==', projectName)
    console.log(projectRef)
    return projectRef.get()
        .then(data => {
            // console.log(data)
            let a = 0
            data.forEach(dt => {
                db.collection('projects').doc(dt.id).set(
                    { status: 'finished' }, { merge: true }).then(a => {
                })
                a++
            })
            if (a < 1) {
                return false
            } else {
                return true
            }

            /*        if(data.exists){
            }else{
                return false
            }
    */

        }).catch(e => {
            return 'gagal'
        }).finally(e => {
            return 'berhasil'
            console.log('empat')
            //   return 'finally'
        })
}

// const updateTaskStatus = (tasks) => {

//     for (task of Object.keys(tasks)) {
//         tasks[task].forEach(dt => {
//             let { projectName, name, userID } = dt
//             let taskRef = db.collection('tasks').where('projectName', '==', projectName)
//                 .where('name', '==', name).where('userID', '==', userID)
//             taskRef.get()
//                 .then(data => {
//                     data.forEach(dt => {
//                         db.collection('tasks').doc(dt.id).update({ status:'done' })
//                     })
//                 }).catch(err => {
//                     console.log('Error : ' + err)
//                 })
//                 .finally('Task ' + name + ' updated')
//         })
//     }
// }

const updateTaskStatus = (payload) => {
    Object.keys(payload).forEach(key => {
        items = payload[key]
        items.forEach(item => {
            const { projectName, userId: userID, name } = item
            const taskReference = db.collection('tasks').where('projectName', '==', projectName)
                .where('name', '==', name).where('userID', '==', userID)
            taskReference.get().then(results => {
                results.forEach(result => {
                    db.collection('tasks').doc(result.id).update({ status: 'done' })
                })
            }).catch(err => {
                console.log("Error when updating task", err)
            }).finally(`Task ${name} Updated!`)
        })
    })
}

const deadlineDateGenerator = (days) => {
    let date = new Date()
    date.setDate(date.getDate() + days)
    return date

}

const exportToExcel = async () => {
    const { year, month, day, timestamp } = getDate()
    let userIDs = new Set([])
    let usersReport = {}
    const reportList = []
    const report = [
        ["Nama", "Done", "In Progress", "Info", "Problem", "project"]
    ]
    await getUsersData('all').then(async data => {
        data.forEach(dt => {
            userIDs.add(dt)
        })
    })

    await getTodayReport().then(dt => {
        usersReport = dt
    })

    await userIDs.forEach(dt => {
        reportList.push(generateColumn(dt, usersReport))
    })



    await Promise.all(reportList).then(d => {
        d.forEach(dt => {
            report.push(dt)
        })
    })


    save({ year: year, month: month, day: day }, report)
}

const generateColumn = async (userData, todayReport) => {
    const tmp = []
    const report = {}
    let getTask = []
    let ipTemp = ''
    let doneTemp = ''
    let infoTemp = ''
    let problemTemp = ''
    let project = ''
    const inProgress = todayReport[userData['userID']].inProgress
    const done = todayReport[userData['userID']].done
    const info = todayReport[userData['userID']].info
    const problem = todayReport[userData['userID']].problem
    tmp.push(userData['name'])

    if (done != undefined) {
        if (done.length > 1) {
            let counter = 1
            done.forEach(item => {
                doneTemp = doneTemp.concat(counter + '. ' + item + '\n')
                counter++
            })
        } else {
            doneTemp = todayReport[userData['userID']].done[0]
        }
    } else {
        doneTemp = ' '
    }
    tmp.push(doneTemp)


    if (inProgress != undefined) {
        if (inProgress.length > 1) {
            let counter = 1
            inProgress.forEach((item) => {
                ipTemp = ipTemp.concat(counter + '. ' + item + '\n')
                getTask.push(getProjectByTask(item))
                counter++
            })

        } else {
            ipTemp = todayReport[userData['userID']].inProgress[0]
            getTask.push(getProjectByTask(ipTemp))
        }
    } else {
        ipTemp = ' '
        project = ' '
    }
    tmp.push(ipTemp)

    if (info != undefined) {
        if (info.length > 1) {
            let counter = 1
            info.forEach(item => {
                infoTemp = infoTemp.concat(counter + '. ' + item + '\n')
                counter++
            })
        } else {
            infoTemp = todayReport[userData['userID']].info[0]
        }

    } else {
        infoTemp = ' '
    }
    tmp.push(infoTemp)


    if (problem != undefined) {
        if (problem.length > 1) {
            let counter = 1
            problem.forEach(item => {
                problemTemp = problemTemp.concat(counter + '. ' + item + '\n')
                counter++
            })
        } else {
            problemTemp = todayReport[userData['userID']].problem[0]
        }

    } else {
        problemTemp = ' '
    }
    tmp.push(problemTemp)

    await Promise.all(getTask).then(res => {
        let counter = 1

        res.forEach(r => {
            console.log(r[0].projectName)
            project = project.concat(counter + '. ' + r[0].projectName + '\n')
            counter++
        })
    })

    tmp.push(project)

    return tmp
}

const getTodayReport = async () => {
    const { timestamp } = getDate()
    return db.collection('reports').doc(timestamp.toString()).get()
        .then(data => {
            return data.data()
        })
}

const getProjectByTask = async (taskName) => {
    return db.collection('tasks').where('name', '==', taskName)
        .get().then(results => {
            let tmp = []
            results.forEach(res => {
                tmp.push(res.data())
            })
            return tmp
        })
}
/*
const generateId = () => {
    let timestamp = new Date()
    timestamp = timestamp.getTime()
    timestamp = timestamp.toString()
    return timestamp.substring(timestamp.length - 3, timestamp.length) + Math.random().toString(36).substr(2, 6)
}
*/
const getTaskCount = async () => {
    let temp = {}
    return db.collection('tasks').get()
        .then(async results => {

            await db.collection('projects').get()
                .then(result => {
                    result.forEach(item => {
                        if (item.data().status != 'finished') {
                            temp[item.data().projectName] = {
                                taskDone: 0,
                                allTask: 0
                            }
                        }
                    })
                })
            results.forEach(result => {
                if (temp[result.data().projectName] != undefined) {
                    if (result.data().status == 'done') {
                        temp[result.data().projectName].taskDone++
                    }
                    temp[result.data().projectName].allTask++
                }
            })
            return temp
        })

}

const takeOverTask = (payloads) => {
    payloads.forEach(payload =>{
        const {taskId:tid, receiverId:uidB, senderId:uidL} = payload
        db.collection('tasks').doc(tid).set({ userID: uidB }, { merge: true })
        let ProjectRef = db.collection('projects').where('Task', 'array-contains', db.collection('tasks').doc(tid))
    
        ProjectRef.get().then(results => {
            let counter = 0
            let tmp
            results.forEach(res => {
                tmp = res
                counter++
            })
            if (counter == 0) {
                console.log('!ada')
            } else {
                let userExist = 0
                for (let x of tmp.data().users) {
                    console.log('user : ' + x + ':' + uidL)
                    if (x === uidL) {
                        userExist++
                    }
                }
                if (userExist === 1) {
                    tmp.ref.update({ users: admin.firestore.FieldValue.arrayRemove(uidL) })
                }
                tmp.ref.update({ users: admin.firestore.FieldValue.arrayUnion(uidB) })
                console.log('OK')
            }
        })
    })

}

load()

module.exports = {
    load,
    listenProjects,
    listenUsers,
    addProjects,
    addTaskTransaction,
    deleteProject,
    getTaskCount,
    exportToExcel,
    getUserProjects,
    getUserTasks,
    editProjectName,
    getUsersData,
    getProjects,
    saveUser,
    isUserExist,
    getUserTasksOrderByPriority,
    assignUserToProjects,
    updateTaskStatus,
    isAdmin,
    setAdmin,
    takeOverTask

}
