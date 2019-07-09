const firebase  = require("./Firebase.js")
const { save }  = require('./Spreadsheets.js')

const dateTime  = require('node-datetime');
const dateCalc  = require("add-subtract-date");

const admin     = firebase.admin()
const db        = firebase.database();
const users     = new Set([])
const projects  = []
const tasks     = new Set([])

load = () => {
    //Using to testing
    //exportToExcel()
}

listenUsers = async () => {
    /**
     * Listen to users change in firebase document
     */
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
    /**
     * Listen to projects change in firebase document
     */
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

                projects[data.doc.id]                = {}
                projects[data.doc.id]['projectName'] = data.doc.data().projectName
                projects[data.doc.id]['Task']        = tasks
                tasks = []
                
                console.log('Projects added ' + data.doc.data().projectName)
            } else if (data.type === 'removed') {
                console.log('Projects ' + data.doc.data().projectName + ' removed')
            }
        })
    })
}

listenTasks = async () => {
    /**
     * Listen to tasks change in firebase document
     */
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
    /**
     * Get users data from firebase document
     * @param {id} - userID of a user or keyword 'all' to get all users data
     * 
     * @return {Array} - Array of user data or single object of user data 
     */

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
    /**
     * Get user tasks in order by priority HIGH, MEDIUM or LOW
     * 
     * @param {uid}     - userID of a user
     * @param {order}   - order of tasks can be ASC or DESC
     *
     * @returns {Array} - An array containing user data in requested order 
     */
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
    })
    .catch(err => {
        console.log('Error : ' + err.details)
    })
    .finally(() => {
        console.log('Tasks for ' + uid + ' successfully loaded')
    })

}

const getProjects = async (type) => {
    /**
     * Get all projects
     * @param {type} - type of projects like 'finished' or 'In Progress'
     * 
     * @returns {Set} - returns a set of project names
     */

    let projectNames = new Set([])

    return db.collection('projects').get()
    .then(projects => {
        projects.forEach(project => {

            if (project.data().status == type) {
                projectNames.add(project.data().projectName)
            }

        })

        return projectNames
    })
    .catch(err => {
        console.log('Error : ' + err.details)
    })
    .finally(() => {
        console.log('Projects loaded!')
    })
}

const getUserTasks = async (uid) => {

    let taskList = new Set([])
    let projects = new Set([])

    dbRef = db.collection('tasks').where('userID', '==', uid)
    return dbRef.get()
    .then(async data => {
        
        data.forEach( dt => {
            if (dt.data().status != 'done') {
                taskList.add(dt.data())
            } 
        })
        await db.collection('projects').get()
        .then(result=>{
            result.forEach(res=>{
                if(res.data().status==='finished'){
                    projects.add(res.data().projectName)
                }
            })
        })
        taskList.forEach(task=>{
            if(projects.has(task.projectName.toString())){
                taskList.delete(task)
            }
        })
        return sortingTask(Array.from(taskList))
    }).catch(err => {
        console.log('Error : ' + err.details)
    })
    .finally(() => {
        console.log('Tasks for ' + uid + ' successfully loaded')
    })
}

const sortingTask=(taskList)=>{
    /**
     * Sorting an array from tasklist to its project based on priority
     */
    const all = {}
    const high      = []
    const medium    = []
    const low       = []
    let temp
    
    taskList.forEach(task=>{
        if(task.priority==='HIGH'){
            high.push(task)
        }else if(task.priority==='MEDIUM'){
            medium.push(task)
        }else{
            low.push(task)
        }
        
        all[task.projectName] = []
    })

    temp = high.concat(medium,low)
    temp.forEach(item=>{
        all[item.projectName].push(item)
    })

    let res = []
    for(let key of Object.keys(all)){
        all[key].forEach(item=>{
            res.push(item)
        })
    }

    return res
}

const sortingProjects = (taskList)=>{

}

const getUserProjects = async (uid) => {
    /**
     * Get project(s) of a user
     * 
     * @param {uid} - userID of a user
     * 
     * @returns {Project List} - returns project list of a user in an Array
     */
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
    })
    .catch(err => {
        console.log('Error : ' + err.details)
    })
    .finally(() => {
        console.log('Projects for ' + uid + ' successfully loaded')
    })
}

const getDate = () => {
    /**
     * Get current date
     * 
     * @returns {Object} - returns an object containing information below
     * {
     *      day   :01,
     *      month :01,
     *      year  :2001
     *      timestamp:January, 01 2001 12:00 A.M
     * }
    */


    const date    = dateTime.create();
    let timestamp = new Date(date.format('Y') +'/'+date.format('m')+'/'+date.format('d'))
    
    return {
        day      : date.format('d'),
        month    : date.format('m'),
        year     : date.format('Y'),
        timestamp: timestamp
    }
}

const setAdmin = (userID) => {
    /**
     * Set a user as admin
     * 
     * @param {userID} - userID of a user who will be set as admin
     */

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
    /**
     * Add task(s) to tasks document in firebase 
     * @param {data} - an object that contains information of task
     * 
     */
    
    let taskIDs = []
    let rep     = {}
    
    for (dt of data) {
        rep[dt.userID] = {
            done      : [],
            inProgress: [],
            info      : [],
            problems  : []
        }
    }

    for (dt of data) {
        let taskRef       = db.collection('tasks').doc()
        let taskID        = taskRef.id
        let { timestamp } = getDate()
        let projectRef    = db.collection("projects").where("projectName", "==", dt.projectName)
        taskIDs.push(taskID)
        
        await projectRef.get()
        .then(result => {
            result.forEach(item => {
                let temp = {}
                temp[dt.userID] = {}
                temp[dt.userID]['inProgress'] = admin.firestore.FieldValue.arrayUnion(dt.name)


                taskRef.set(
                    {
                        taskID     : taskRef.id,
                        name       : dt.name,
                        projectName: dt.projectName,
                        status     : 'In Progress',
                        projectID  : item.id,
                        userID     : dt.userID,
                        date       : timestamp,
                        priority   : dt.priority 
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
            
        })
        .catch(err => {
            console.log(err)
        })
        .finally(() => {
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
                date       : timestamp,
                status     : 'In Progress',
                Task       : [],
                users      : []
            }
        )
        .catch(err => {
            console.log('Add project failed, error : ' + err.details)
        })
        .finally(() => {
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
        })
        .catch(err => {
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
        })
        .catch(err => {
            console.log('Error : ' + err.details)
        })
}

const saveUser = (userID, data) => {
    isUserExist(userID).then(res=>{
        if(!res){
            db.collection('users').doc(userID.toString()).set(data)
            .catch(err => {
                console.log('Error : ' + err.details)
            })
            .finally(result => {
                console.log('result')
            })
        }else{
            console.log(userID+' already registered!')
        }
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
        })
        .catch(err => {
            console.log('Error : ' + err.details)
        })
        .finally(() => {
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
    })
    .catch(e => {
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

        })
        .catch(e => {
            return 'Delete Project Failed'
        })
        .finally(e => {
            return 'Delete Project Succeeded'
        }
    )
}

const updateTaskStatus = (payload) => {
    let {timestamp} = getDate()
    Object.keys(payload).forEach(key => {
        items = payload[key]
        items.forEach(item => {
            const { projectName, userId: userID, name } = item
            const taskReference = db.collection('tasks')
            .where('projectName', '==', projectName)
            .where('name', '==', name).where('userID', '==', userID)
            
            taskReference.get().then(results => {
                results.forEach(result => {
                    db.collection('tasks').doc(result.id).update({ status: 'done' })
                    let temp = {}
                    temp[userID] = {}
                    temp[userID]['done'] = admin.firestore.FieldValue.arrayUnion(name)
                    temp[userID]['inProgress'] = admin.firestore.FieldValue.arrayRemove(name)

                    db.collection('reports').doc(timestamp.toString()).get()
                    .then(doc => {
                        db.collection('reports').doc(timestamp.toString())
                        .set(temp, { merge: true })
                    })
                })

            }).catch(err => {
                console.log("Error when updating task", err)
            }).finally(`Task ${name} Updated!`)
        })
    })
}

const exportToExcel = async () => {
    const { year, month, day, timestamp } = getDate()
    let userIDs = new Set([])
    let usersReport
    const reportList = []
    const report = [
        ["Nama", "Done", "In Progress", "Info", "Problem", "Project"]
    ]

    await getUsersData('all').then(async results => {
        results.forEach(item => {
            userIDs.add(item)
        })
    })

    await getTodayReport().then(result => {
        usersReport = result
    })

    await userIDs.forEach(result => {
        reportList.push(generateColumn(result, usersReport))
    })



    await Promise.all(reportList).then(results => {
        results.forEach(result => {
            report.push(result)
        })
    })


    save({ year: year, month: month, day: day }, report)
}

const generateColumn = async (userData, todayReport) => {
    const tmp       = []
    const indexing    = {}
    let getTask     = []
    let ipTemp      = ''
    let doneTemp    = ''
    let infoTemp    = ''
    let problemTemp = ''
    let project     = ''
    let inProgress
    let done
    let info
    let problem
    if(todayReport==undefined){
        throw new Error('No Reports Today')
    }
    if(todayReport[userData['userID']]!=undefined){
        if(todayReport[userData['userID']].inProgress!=undefined){
            inProgress    = todayReport[userData['userID']].inProgress
        }
        if(todayReport[userData['userID']].done!=undefined){
            done          = todayReport[userData['userID']].done
        }
        if(todayReport[userData['userID']].info!=undefined){
            info          = todayReport[userData['userID']].info
        }
        if(todayReport[userData['userID']].problem!=undefined){
            problem          = todayReport[userData['userID']].problem
        }
        
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
                if(doneTemp==undefined){
                    infoTemp = ' '
                }
            }
        } else {
            doneTemp = ' '
        }
        tmp.push(doneTemp)
    
    
        console.log(inProgress.length)
        if (inProgress != undefined) {
            if (inProgress.length > 1) {
                let counter = 1
                
                inProgress.forEach((item) => {
                    if(item!=undefined){
                        ipTemp = ipTemp.concat(counter + '. ' + item + '\n')
                        getTask.push(getProjectByTask(item))
                        counter++
                    }
                        
                })
            } else {
                ipTemp = todayReport[userData['userID']].inProgress[0]
                if(ipTemp!=undefined){
                    getTask.push(getProjectByTask(ipTemp))
                }else{
                    ipTemp=' '
                }
            }
        } else {
            console.log('bawah')
            ipTemp  = ' '
            project = ' '
        }
        tmp.push(ipTemp)
    
        if (info != undefined) {
            if (info.length > 1) {
                let counter = 1
                
                info.forEach(item => {
                    if(item!=undefined){
                        infoTemp = infoTemp.concat(counter + '. ' + item + '\n')
                        counter++
                    }
                })
            } else {
                infoTemp = todayReport[userData['userID']].info[0]
                if(infoTemp==undefined){
                    infoTemp = ' '
                }
            }
    
        } else {
            infoTemp = ' '
        }
        tmp.push(infoTemp)
    
    
        if (problem != undefined) {
            if (problem.length > 1) {
                let counter = 1
                
                problem.forEach(item => {
                    if(item!=undefined){
                        problemTemp = problemTemp.concat(counter + '. ' + item + '\n')
                        counter++
                    }
                })
            } else {
                problemTemp = todayReport[userData['userID']].problem[0]
                if(problemTemp==undefined){
                    problemTemp = ' '
                }
            }
    
        } else {
            problemTemp = ' '
        }
        tmp.push(problemTemp)
    
        await Promise.all(getTask).then(res => {
            let counter = 1
            res.forEach(r => {

                if(r.length!=0){
                    if(!(r[0].projectName in indexing)){
                        indexing[r[0].projectName] = counter
                        counter++
                    }
                    project = project.concat(indexing[r[0].projectName] + 
                    '. ' + r[0].projectName + '\n')
                }
            })
        })
    
        tmp.push(project)
    
        return tmp
    }

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
    let {timestamp} = getDate()
    payloads.forEach(payload =>{

        const {taskId:tid, receiverId:uidB, senderId:uidL} = payload
        db.collection('tasks').doc(tid).set({ userID: uidB }, { merge: true })

        db.collection('tasks').doc(tid).get()
        .then(res=>{
            console.log(res.data())
            let temp = {}
            temp[uidB] = {}
            temp[uidL] = {}
            temp[uidB]['inProgress'] = admin.firestore.FieldValue.arrayUnion(res.data().name)
            temp[uidL]['inProgress'] = admin.firestore.FieldValue.arrayRemove(res.data().name)
            
            db.collection('reports').doc(timestamp.toString())
            .set(temp, { merge: true })
               // db.collection('reports').doc(timestamp.toString()).get()
            // .then(doc => {
                
            // })
        })
        
        let ProjectRef = db.collection('projects')
        .where('Task', 'array-contains', db.collection('tasks').doc(tid))
    
        ProjectRef.get().then(results => {
            let counter = 0
            let tmp
            results.forEach(res => {
                tmp = res
                counter++
            })
            if (counter != 0) {
                let userExist = 0
                for (let x of tmp.data().users) {
                    if (x === uidL) {
                        userExist++
                    }
                }
                // if (userExist === 1) {
                //     tmp.ref.update({ users: admin.firestore.FieldValue.arrayRemove(uidL) })
                // }
                tmp.ref.update({ users: admin.firestore.FieldValue.arrayUnion(uidB) })
                console.log('OK')
            }
        })
    })

}

const generateTimestamp=(date)=>{
    /**
     * @param {String} date In format yyyy/mm/dd
     */
    const timestamp = new Date(date)
    return timestamp
}

const addHoliday=({name,date})=>{
    /**
     * Function to set holiday in firebase document
     * @param {Object}
     * => {
     *      name: 'Idul Fitri',
     *      date:'yyyy/mm/dd'
     *    }
     * 
     */
    const timestamp = generateTimestamp(date)

    db.collection('day-off').doc(timestamp.toString())
    .set({name:name,type:'holiday',users:[]},{merge:true})
    console.log(timestamp)
}

const userDayOff=async ({userID,startDate,long,reason})=>{
    let start = generateTimestamp(startDate)
    
    for(let i=0;i < long;i++){
        await insertDayOff(start,userID,reason)
        start=generateTimestamp(dateCalc.add(start,1,'day'))
    }
    
}

const insertDayOff=async(date,userID,reason)=>{
    return db.collection('day-off').doc(date.toString())
    .get().then(async results=>{
        if(results.data()===undefined){   
            let schema = {
                name:'cuti',
                type:'day-off',
                users:[]
            }
            
            await db.collection('day-off').doc(date.toString())
            .set(schema,{merge:true})
            
            await db.collection('day-off').doc(date.toString())
            .update({ users:admin.firestore.FieldValue.arrayUnion({userID:userID,reason:reason}) })
        }else{
            console.log(results.data().type)
            if(results.data().type!='holiday'){
                db.collection('day-off').doc(date.toString())
                .update({users:admin.firestore.FieldValue.arrayUnion({userID:userID,reason:reason}) })
            } 
        }
        
        console.log('result ')
        console.log(results.data())
    })
    .catch(e=>{
        console.log(e)
        return e
    })
}

const checkDayOff=async()=>{
    /**
     * Function to check user(s) who free today
     * 
     * @returns {Array} [] OR [userID,userID]
     */

    let {timestamp} = getDate()
    todayDate = timestamp
    let result = []

    return db.collection('day-off').doc(todayDate.toString())
    .get().then(results=>{
        if(results.data()===undefined){
            return []
        }else{
            results.data().users.forEach(res=>{
                result.push(res.userID)
            })
        }
        return result
    })
}

const updateUser = (userID,payload)=>{
    db.collection('users').doc(userID.toString()).set(payload,{merge:true})
}

// load()


module.exports = {
    load,
    listenProjects,
    listenUsers,
    updateUser,
    addProjects,
    addTaskTransaction,
    deleteProject,
    getTaskCount,
    getDate,
    exportToExcel,
    getUserProjects,
    getUserTasks,
    editProjectName,
    getUsersData,
    generateTimestamp,
    getProjects,
    saveUser,
    isUserExist,
    getUserTasksOrderByPriority,
    assignUserToProjects,
    updateTaskStatus,
    checkDayOff,
    isAdmin,
    setAdmin,
    takeOverTask
}
