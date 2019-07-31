const firebase  = require("./Firebase.js")
const { save }  = require('./Spreadsheets.js')

const dateTime  = require('node-datetime');
const dateCalc  = require("add-subtract-date");
const log       = require('simple-node-logger').createSimpleLogger('./log/DB.log')

const admin     = firebase.admin()
const db        = firebase.database();
const users     = new Set([])
const projects  = []
const tasks     = new Set([])

class DBLogger{
    static err(name, reason){
        const message = `@${name} : ${reason} at ${new Date().toISOString()}`
        log.setLevel('error')
        log.error(message)
        return new Error(message)
    }

    static info(name,info){
        const message = `@${name} : ${info} at ${new Date().toISOString()}`
        log.setLevel('info')
        log.info(message)
    }
}


/**
 * Listen to users change in firebase document
 */
listenUsers = async () => {
    db.collection('users')
    .onSnapshot(user => {
        user.docChanges().forEach(data => {
    
            if (data.type === 'added') {
                users.add(data.doc.data())
            } else if (data.type === 'removed') {
                users.delete(data.doc.data())
            }
    
        })
    
    })
}

/**
 * Listen to projects change in firebase document
 */
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

                projects[data.doc.id]                = {}
                projects[data.doc.id]['projectName'] = data.doc.data().projectName
                projects[data.doc.id]['Task']        = tasks
                tasks = []
                
                // console.log('Projects added ' + data.doc.data().projectName)
            } else if (data.type === 'removed') {
                // console.log('Projects ' + data.doc.data().projectName + ' removed')
            }
        })
    })
}

/**
 * Listen to tasks change in firebase document
 */
listenTasks = async () => {
    db.collection('tasks')
    .onSnapshot(user => {
        let counter = 0
        
        user.docChanges().forEach(data => {
            
            if (data.type === 'added') {
                tasks.add(data.doc.data())
               
                counter++
            } else if (data.type === 'removed') {
               
                db.collection('projects').doc(data.doc.data().projectID)
                .update(
                { 
                    Task: admin.firestore.FieldValue
                        .arrayRemove(db.collection(tasks).doc(data.doc.data().taskID)) 
                })

                tasks.delete(data.doc.data())
            
            } else if (data.type === 'modified') {
            
            }
        })
    })
}

//-------------------------GET SECTION-------------------------------------//

/**
 * Get users data from firebase document
 * @param {id} - userID of a user or keyword 'all' to get all users data
 * 
 * @return {Array} - Array of user data or single object of user data 
 */
const getUsersData = async (id) => {

    let userData = new Set([])

    if (id === 'all') {
        return db.collection('users').get()
        .then(items => {
            if(!items.empty){
                items.forEach(item => {
                    userData.add(item.data())
                })
                
                return Array.from(userData)
            }
            return new Array()
        }).catch(err=>{
            DBLogger.err(getUsersData.name,err.message)
        })

    } else {
        let dbRef = db.collection('users').where('userID', '==', id)
        
        return dbRef.get()
        .then(data => {
            if(!data.empty){
                data.forEach(details => {
                    userData.add(details.data())
                })
              
                return Array.from(userData)[0]
            }
            return new Array()
        }).catch(err=>{
            DBLogger.err(getUsersData.name,err.message)
        })
    }
}

/**
 * Get user tasks in order by priority HIGH, MEDIUM or LOW
 * 
 * @param {uid}     - userID of a user
 * @param {order}   - order of tasks can be ASC or DESC
 *
 * @returns {Array} - An array containing user data in requested order 
 */
const getUserTasksOrderByPriority = async (uid, order) => {
    let taskList = []
    
    dbRef = db.collection('tasks').orderBy('priority', order)
    
    return dbRef.get()
    .then(results => {
        results.forEach(result => {
            if(result.data().status!=undefined&&result.data().userID!=undefined){
                if (result.data().status != 'done' && result.data().userID === uid) {
                    taskList.push(result.data())
                }
            }else{
                DBLogger.info(getUserTasksOrderByPriority.name,`undefined status or userID`)
            }
        })
        
        return taskList
    })
    .catch(err => {
        DBLogger.err(getUserTasksOrderByPriority.name,err.message)
    })
}

/**
 * Get all projects
 * @param {type} - type of projects like 'finished' or 'In Progress'
 * 
 * @returns {Set} - returns a set of project names
 */
const getProjectName = async (type) => {

    let projectNames = new Set([])

    return db.collection('projects').get()
    .then(projects => {
        projects.forEach(project => {
            if(project.data().status!=undefined){
                if (project.data().status == type) {
                    projectNames.add(project.data().projectName)
                }
            }else{
                DBLogger.err(getProjectName.name,`projects status undefined`)
            }
        })
        return projectNames
    })
    .catch(err => {
        DBLogger.err(getProjectName.name,err.message)
    })
}

const getDetailedProject = async (type) => {
    let projectsData = new Set([])

    return db.collection('projects').get()
    .then(projects => {
        projects.forEach(project => {
            if(project.data().status!=undefined){
                if (project.data().status == type) {
                    projectsData.add(project.data())
                }
            }else{
                DBLogger.err(getDetailedProject.name,`projects status undefined`)
            }
        })
        return projectsData
    })
    .catch(err => {
        DBLogger.err(getDetailedProject.name,err.message)
    })
}

/**
 * 
 * @param {int} uid | userID of a  user
 */
const getUserTasks = async (uid) => {
    let taskList = new Set([])
    // let projects = new Set([])

    dbRef = db.collection('tasks').where('userID', '==', uid)
    return dbRef.get()
    .then(async data => {
        data.forEach( dt => {
            if(dt.data().status!=undefined){
                if (dt.data().status == 'In Progress') {
                    taskList.add(dt.data())            
                } 
            }else{
                DBLogger.err(getUserTasks.name,`task status undefined`)
            }
        })
        //Code below to hide task of finished projects
        // await db.collection('projects').get()
        // .then(result=>{
        //     result.forEach(res=>{
        //         if(res.data().status==='finished'){
        //             projects.add(res.data().projectName)
        //         }
        //     })
        // })
        // taskList.forEach(task=>{
        //     if(projects.has(task.projectName.toString())){
        //         taskList.delete(task)
        //     }
        // })
        if(taskList.size==0) return new Array()
        if(taskList.size==1) return Array.from(taskList)
        return sortingTask(Array.from(taskList))
    }).catch(err => {
        DBLogger.err(getUserTasks.name,err.message)
    })
}

/**
 * Sorting an array from tasklist to its project based on priority
 */
const sortingTask=(taskList)=>{
    const all = {}
    const high      = []
    const medium    = []
    const low       = []
    let temp
    
    taskList.forEach(task=>{
        if(task.priority!=undefined){
            if(task.priority==='HIGH'){
                high.push(task)
            }else if(task.priority==='MEDIUM'){
                medium.push(task)
            }else{
                low.push(task)
            }
            
            all[task.projectName] = []
        }else{
            DBLogger.err(sortingTask.name,`task priority undefined`)
        }
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

/**
 * Get project(s) of a user
 * 
 * @param {uid} - userID of a user
 * 
 * @returns {Project List} - returns project list of a user in an Array
 */
const getUserProjects = async (uid) => {
    let projectList = []
    dbRef = db.collection('projects').where('users', 'array-contains', uid)
    
    return dbRef.get()
    .then(data => {
        if(data.size == 0) return new Array()
        let temp = new Set([])
        data.forEach(project => {
            temp.add(project.data().projectName)
        })
    
        for (project of temp) {
            let tmp = []
            tmp.push(project)
            projectList.push(tmp)
        }
        return projectList
    })
    .catch(err => {
        DBLogger.err(getUserProjects.name,err.message)
    })

}

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
const getDate = () => {
    const date    = dateTime.create();
    let timestamp = new Date(date.format('Y') +'/'+date.format('m')+'/'+date.format('d'))
    return {
        day      : date.format('d'),
        month    : date.format('m'),
        year     : date.format('Y'),
        timestamp: timestamp
    }
}


const getStatistic = async (uid)=>{
    const {timestamp} = getDate()
    return db.collection('statistics').doc(timestamp.toString())
    .get().then(results=>{
        if(results.data()==undefined||results.data()[uid.toString()]==undefined) return null
        return results.data()[uid.toString()]
    })
    .catch(err=>{
        DBLogger.err(getStatistic.name,err.message)    
    })
}

/**
 * @returns 
 * [ 
 * { title: 'PM', description: 'Project Manager' },
 * { title: 'QA', description: 'Quality Assurance' } 
 * ]
 */
const getRoleList = async () =>{
    const list = []
    return db.collection('roles').get()
    .then(result=>{
        result.forEach(res=>{
            const desc = res.data().description==undefined?`${res.id}`:res.data().description
            list.push({title:res.id,description:desc})
        })
        return list
    })
    .catch(err=>{
        DBLogger.err(getRoleList.name,err.message)
    })
}

const getTodayReport = async () => {
    const { timestamp } = getDate()
    
    return db.collection('reports').doc(timestamp.toString()).get()
    .then(data => {
        if(data.data()==undefined) {
            DBLogger.info(getTodayReport.name,`report at ${timestamp.toString()} is unavailable`) 
            return undefined
        }
        return data.data()
    })
    .catch(err=>{
        DBLogger.err(getTodayReport.name,err.message)
    })
}

/**
 * 
 * @param {String} taskName | Task name in the project
 */
const getProjectByTask = async (taskName) => {
    return db.collection('tasks').where('name', '==', taskName)
    .get().then(results => {
        let tmp = []
        results.forEach(res => {
            tmp.push(res.data())
        })
        return tmp
    })
    .catch(err=>{
        DBLogger.err(getProjectByTask.name,err.message)
    })
}

const getTaskCount = async () => {
    let temp = {}

    return db.collection('tasks').get()
    .then(async results => {
        if(!results.empty){
            await db.collection('projects').get()
                .then(result => {
                    result.forEach(item => {
                        if ((item.data().status!=undefined)&&(item.data().status != 'finished')) {
                            let tmpProjectName = item.data().projectName!=undefined?item.data().projectName:'null'
                            
                            temp[tmpProjectName] = {
                                taskDone: 0,
                                allTask: 0
                            }
                        }
                    })
                })
                results.forEach(result => {
                    let tmpProjectName = result.data().projectName!=undefined?result.data().projectName:'null'
                    if (temp[tmpProjectName] != undefined) {
                        if (result.data().status == 'done') {
                            temp[tmpProjectName].taskDone++
                        }
                        temp[tmpProjectName].allTask++
                    }
                })
        }else{
            DBLogger.info(getTaskCount.name,`Results empty`)
        }
        return temp
    })
}

const getPastTaskToExcel= ()=>{

    return db.collection('tasks').get()
    .then(result=>{
        result.forEach(res=>{
            if((res.data()!=undefined)&&(res.data().status=='In Progress')){
                let temp = {}
                let {timestamp} = getDate()
                
                temp[res.data().userID] = {}
                temp[res.data().userID]['inProgress'] = admin.firestore.FieldValue.arrayUnion(res.data().name)
                if(res.data().problems!=undefined){
                    temp[res.data().userID]['problems'] = res.data().problems
                }

                db.collection('reports').doc(timestamp.toString())
                .set(temp, { merge: true })
                .catch(err=>{
                    DBLogger.err(getPastTaskToExcel.name,err.message)
                })
            }
        })
    })
    .catch(err=>{
        DBLogger.err(getPastTaskToExcel.name,err.message)
    })

}

/**
 * 
 * @param {int} year
 */
const getHoliday= async (year)=>{
    const holidays = []
    const dbRef = db.collection('day-off').where('year','==',year).orderBy('timestamp','asc')
    return dbRef.get().then(results=>{
        results.forEach(res=>{
            if((res.data()!=undefined)&&(res.data().type == 'holiday')){
                holidays.push(
                {
                    date:`${res.data().year}/${res.data().month}/${res.data().day}`,
                    name:res.data().name})
                }
            }
        )
        return holidays
    })
    .catch(err=>{
        DBLogger.err(getHoliday.name,err.message)
    })
}

/**
 * Get list of year to list holiday
 */
const getYearsFromDayOff = async ()=>{
    const years = new Set([])

    return db.collection('day-off').orderBy('year','asc').get()
    .then(results=>{
        results.forEach(res=>{
            if(res.data().type == 'holiday'){
                years.add(res.data().year)
            }
        })
        return Array.from(years)
    })
}

/**
 * 
 * @param {Object} Date | {day,month,year} 
 * @param {String} by   | Filter day off by day, month or year
 */
const getDayOff=async ({day,month,year},by)=>{
    day = parseInt(day)
    month = parseInt(month)
    year = parseInt(year)
    if(by==='year'){
        return db.collection('day-off')
        .where('year','==',year)
        .orderBy('timestamp','asc')
        .get().then(result=>{
            let tmp = []
            result.forEach(res=>{
                if(res.data().type=='cuti'){
                    tmp.push(res.data())
                }
            })
            return dayOffParser(tmp)
        })
        .catch(err=>{
            DBLogger.err(getDayOff.name,`@year, ${err.message}`)
        })
    }else if(by==='month'){
        return db.collection('day-off')
        .where('year','==',year)
        .where('month','==',month)
        .orderBy('timestamp','asc')
        .get().then(result=>{
            let tmp = []
            result.forEach(res=>{
                if(res.data().type=='cuti'){
                    tmp.push(res.data())
                }
            })
            return dayOffParser(tmp)
        })
        .catch(err=>{
            DBLogger.err(getDayOff.name,`@month, ${err.message}`)
        })
    }else if(by==='day'){
        return db.collection('day-off')
        .where('year','==',year)
        .where('month','==',month)
        .where('day','==',day)
        .orderBy('timestamp','asc')
        .get().then(result=>{
            let tmp = []
            result.forEach(res=>{
                if(res.data().type=='cuti'){
                    tmp.push(res.data())
                }
            })
            return dayOffParser(tmp)
        })
        .catch(err=>{
            DBLogger.err(getDayOff.name,`@day, ${err.message}`)
        })
    }
}

const dayOffParser = (list)=>{
    const newList = []
    list.forEach(data=>{
        data.users.forEach( user=>{
            newList.push({
                user:user['name'],
                alasan:user['reason'],
                userID:user['userID'],
                tanggal:`${data.day}/${data.month}/${data.year}`
            })
        })
    })
    if(newList.length==0) return new Array()
    return newList
}

/**
 * Get advice/feedback from users
 * @returns {Array}
 */
const getAdvice=async ()=>{
    const advices = []
    return db.collection('advices').get()
    .then(results=>{
        results.forEach(result=>{
            advices.push(result.data())
        })
        return advices
    })
    .catch(err=>{
        DBLogger.err(getAdvice.name,err.message)
    })
}

/**
 * Get user role from specific userid
 * @param {int} userID | userid of a user
 * @returns {String} user's role
 */
const getUserRole=(userID)=>{
    const role = {}

    return db.collection('users').where('userID','==',userID)
    .get().then(users=>{
        users.forEach(user=>{
            role[user.data().userID] = user.data().role
        })
        return role[userID]
    })
    .catch(err=>{
        DBLogger.err(getUserRole.name,err.message)
    })
}

/**
 * Get list of QA's
 */
const getQA=()=>{
    const QAs = []

    return db.collection('users').where('role','==','QA')
    .get().then(users=>{
        users.forEach(user=>{
            const tmp = {
                name:user.data().name==undefined?`null`:user.data().name,
                role:user.data().role==undefined?`null`:user.data().role,
                userID:user.data().userID==undefined?`null`:user.data().userID
            }
            QAs.push(tmp)
        })
        return QAs
    })
    .catch(err=>{
        DBLogger.err(getUserRole.name,err.message)
    })
}

const getUserTaskCountAndDayOff= async (userID)=>{
    const user = {}
    let {timestamp} = getDate()
    await db.collection('tasks')
    .where('userID','==',userID)
    .where('status','==','In Progress')
    .get()
    .then(items=>{
        user['task'] = items.size
    })
    .catch(err=>{
        DBLogger.err(getUserTaskCountAndDayOff.name,`on task ${err.message}`)
    })

    await db.collection('day-off').doc(timestamp.toString()).get()
    .then(items=>{
        user['cuti'] = false
        if(items.data()){
            items.data().users.forEach(item=>{
                if(item.userID==userID){
                    user['cuti'] = true
                }
            })
        }
    })
    .catch(err=>{
        DBLogger.err(getUserTaskCountAndDayOff.name,`on day-off ${err.message}`)
    })
    return user
}

const isUserActive = async (userID)=>{
    const userStatistic = await getStatistic(userID)
    if(userStatistic==null) return false
    return (userStatistic.Done + userStatistic.Added)!=0
}

const getGroupID = ()=>{
    let id = {}
    return db.collection('groups').get()
    .then(groups=>{
        groups.forEach(group=>{
            id = group.id
        })
        return id
    })
    .catch(err=>{
        DBLogger.err(getGroupID.name,err.message)
    })
}

const getProblems=async(taskID)=>{
    return db.collection('tasks').doc(taskID).get()
    .then(result=>{
        return result.data().problems==undefined? new Array():result.data().problems
    })
    .catch(err=>{
        DBLogger.err(getProblems.name,err.message)
    })
}

const getAllTasks= async ()=>{
    const tasks = []
    return db.collection('tasks').get()
    .then(results=>{
        results.forEach(result=>{
            tasks.push(result.data())
        })
        return tasks
    })
    .catch(err=>{
        DBLogger.err(getAllTasks.name,err.message)
    })
}

//---------------------------ADD SECTION---------------------------------//

const saveUser = (userID, data) => {
    isUserExist(userID).then(res=>{
        if(!res){
            db.collection('users').doc(userID.toString()).set(data)
            .catch(err=>{
                DBLogger.err(saveUser.name,err.message)
            })
            
        }else{
            console.log(userID+' already registered!')
        }
    })
}

const addAdvice=(advice,name)=>{
    db.collection('advices').doc().set({name:name,advice:advice})
    .catch(err=>{
        DBLogger.err(addAdvice.name,err.message)
    })
}

const assignUserToProjects = (projectName, userID) => {
    let projectRef = db.collection("projects").where("projectName", "==", projectName)
    projectRef.get()
    .then(data => {
        data.forEach(project => {
            db.collection('projects').doc(project.id)
            .update({ users: admin.firestore.FieldValue.arrayUnion(userID) })
            .catch(err=>{
                DBLogger.err(assignUserToProjects.name,`on update projects ${err.message}`)
            })
        })
    })
    .catch(err=>{
        DBLogger.err(assignUserToProjects.name,`on get projects ${err.message}`)
    })
}

/**
 * Add task(s) to tasks document in firebase 
 * @param {Object} - an object that contains information of task
 * 
 */
const addTaskTransaction = async (data) => {
    let { timestamp } = getDate()    
    let taskIDs = []
    let userID
    for (dt of data) {
        let taskRef       = db.collection('tasks').doc()
        let taskID        = taskRef.id
        let projectRef    = db.collection("projects").where("projectName", "==", dt.projectName)
        taskIDs.push(taskID)
        
        await projectRef.get()
        .then(result => {
            result.forEach(item => {
                let temp = {}
                temp[dt.userID] = {}
                temp[dt.userID]['inProgress'] = admin.firestore.FieldValue.arrayUnion(dt.name)
                userID = dt.userID
                
                taskRef.set(
                    {
                        taskID     : taskRef.id,
                        name       : dt.name,
                        projectName: dt.projectName,
                        status     : 'In Progress',
                        projectID  : item.id,
                        userID     : userID,
                        date       : timestamp,
                        priority   : dt.priority 
                    }
                )

                db.collection('projects').doc(item.id)
                .update({ Task: admin.firestore.FieldValue.arrayUnion(taskRef) })
                .catch(err=>{
                    DBLogger.err(addTaskTransaction.name,`on projects Task update ${err.message}`)
                })

                db.collection('projects').doc(item.id)
                .update({ users: admin.firestore.FieldValue.arrayUnion(dt.userID) })
                .catch(err=>{
                    DBLogger.err(addTaskTransaction.name,`on projects users update ${err.message}`)
                })

                db.collection('reports').doc(timestamp.toString())
                .set(temp, { merge: true })
                .catch(err=>{
                    DBLogger.err(addTaskTransaction.name,`on projects reports update ${err.message}`)
                })
                    
            })
            
        })
        .catch(err=>{
            DBLogger.err(addTaskTransaction.name,`on get projects ${err.message}`)
        })
    }
    updateStatistic(data.length,userID,'add')

    return taskIDs
}


const userDayOff=async ({userID,startDate,long,reason})=>{
    let start = generateTimestamp(startDate)
    
    for(let i=0;i < long;i++){
        await isHoliday(`${start.getFullYear()}/${start.getMonth()+1}/${start.getDate()}`)
        .then(async res=>{
            if(start.getDay()==0||start.getDay()==6||res){
                i--
            }else{
                await insertDayOff(start,userID,reason)
            }
            start=generateTimestamp(dateCalc.add(start,1,'day'))
        })
    }
}

const insertDayOff=async(date,userID,reason)=>{
    return db.collection('day-off').doc(date.toString())
    .get().then(async results=>{
        if((date.getDay()!=6)&&(date.getDay()!=0)){
            if(results.data()===undefined){   
                let schema = {
                    name:'cuti',
                    type:'cuti',
                    users:[],
                    year:date.getFullYear(),
                    month:(date.getMonth()+1),
                    day:date.getDate(),
                    timestamp:date.getTime()
                }
                
                await db.collection('day-off').doc(date.toString())
                .set(schema,{merge:true})
                .catch(err=>{
                    DBLogger.err(insertDayOff.name,`on set schema ${err.message}`)
                })
    
                await getUsersData(userID).then(async res=>{
                    await db.collection('day-off').doc(date.toString())
                    .update({ users:admin.firestore.FieldValue.arrayUnion({userID:userID,reason:reason,name:res.name}) })
                    .catch(err=>{
                        DBLogger.err(insertDayOff.name,`on update day-off, ${err.message}`)
                    })  
                })
                .catch(err=>{
                    DBLogger.err(insertDayOff.name,`on get user, ${err.message}`)
                })
    
            }else{
                if(results.data().type!='holiday'){
                    db.collection('day-off').doc(date.toString())
                    .update({users:admin.firestore.FieldValue.arrayUnion({userID:userID,reason:reason}) })
                    .catch(err=>{
                        DBLogger.err(insertDayOff.name,`on update day-off ${err.message}`)
                    })
                } 
            }
        }
        
    })
    .catch(err=>{
        DBLogger.err(insertDayOff.name,`${err.message}`)
    })
}


/**
 * 
 * @param {*} payload 
 * payload = [
 * {taskName: nama, problem :problem,userID:12345},
 * {taskName: nama, problem :problem,userID:12345}
 * ]
 */
const addProblems = async (payload)=>{
    let {timestamp} = getDate()
    for(item of payload){
        const user = await getUsersData(item.userID)
        let problem = `${user.name} : ${item.problem}`
        let temp = {}

        temp[item.userID] = {}
        temp[item.userID]['problems'] = admin.firestore.FieldValue.arrayUnion(problem)
        await db.collection('tasks').where('name','==',item.taskName)
        .get().then(results=>{
            results.forEach(result=>{
                db.collection('tasks').doc(result.data().taskID).set({
                    problems:admin.firestore.FieldValue.arrayUnion(problem)},{merge:true}
                )
                .catch(err=>{
                    DBLogger.err(addProblems.name,`on set tasks, ${err.message}`)
                }) 
            })
        })
        .catch(err=>{
            DBLogger.err(addProblems.name,`on get tasks, ${err.message}`)
        })        

        await db.collection('reports').doc(timestamp.toString())
        .set(temp, { merge: true })
        .catch(err=>{
            DBLogger.err(addProblems.name,`on set reports, ${err.message}`)
        }) 
    }
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
                deadline   : project.deadline,
                date       : timestamp,
                status     : 'In Progress',
                Task       : [],
                users      : []
            }
        )
        .catch(err=>{
            DBLogger.err(addProjects.name,`${err.message}`)
        }) 

        pids.add(projectID)
    })
    return pids
}

/**
 * Function to set holiday in firebase document
 * @param {Object}
 * => {
 *      name: 'Idul Fitri',
 *      date:'yyyy/mm/dd'
 *    }
 * 
 */
const addHoliday=({name,date})=>{
    const timestamp = generateTimestamp(date)
    const [year,month,day] = date.split('/')
    db.collection('day-off').doc(timestamp.toString())
    .set({
        name:name,
        type:'holiday',
        users:[],
        year:parseInt(year),
        month:parseInt(month),
        day:parseInt(day),
        timestamp:timestamp
    },{merge:true}
    )
    .catch(err=>{
        DBLogger.err(addHoliday.name,`${err.message}`)
    }) 
    
}

//---------------------------SET SECTION------------------------------//

const setAdmin = (userID) => {
    /**
     * Set a user as admin
     * 
     * @param {userID} - userID of a user who will be set as admin
     */

    db.collection('users').doc(userID.toString())
    .update({ role:'admin',type: 'admin' })
    .then(()=>{DBLogger.info(setAdmin.name,`${userID} set as admin`)})
    .catch(err=>{
        DBLogger.err(setAdmin.name,`${err.message}`)
    })
}

const setGroupID = ({id,payload})=>{
    db.collection('groups').doc(id.toString()).set(payload)
    .catch(err=>{
        DBLogger.err(setGroupID.name,`${err.message}`)
    })
}

//-------------------------CHECKING SECTION------------------------------//

const isUserExist = async (userID) => {
    return db.collection('users').doc(userID.toString()).get()
    .then(data => {
        if (data.exists) return true
        return true
    })
    .catch(err=>{
        DBLogger.err(isUserExist.name,`${err.message}`)
    })
}

/**
 * 
 * @param {int} userID 
 * 
 * @returns {boolean}
 */
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
    .catch(err=>{
        DBLogger.err(isAdmin.name,`${err.message}`)
    })
}

/**
 * Function to check user(s) who free today
 * 
 * @returns {Array} [] OR [userID,userID]
 */
const checkDayOff = async()=>{
    let {timestamp} = getDate()
    todayDate = timestamp
    let result = []

    return db.collection('day-off').doc(todayDate.toString())
    .get().then(results=>{
        if(results.data()===undefined){
            return new Array()
        }else{
            results.data().users.forEach(res=>{
                result.push(res.userID)
            })
        }
        return result
    })
    .catch(err=>{
        DBLogger.err(checkDayOff.name,`${err.message}`)
    })
}

const isHoliday = async (date=null)=>{
    let {timestamp} = getDate()
    if(date!=null){
      timestamp = generateTimestamp(date)   
    }
    
    return db.collection('day-off').doc(timestamp.toString())
    .get().then(result=>{
        if(result.data()&&(result.data().type=='holiday')){
            return true
        }
        return false
    })
    .catch(err=>{
        DBLogger.err(isHoliday.name,`${err.message}`)
    })
}

//---------------------EDIT SECTION----------------------------------//


const editProjectName = (oldName, newName) => {
    let projectRef = db.collection('projects').where('projectName', '==', oldName)

    projectRef.get()
    .then(data => {
        data.forEach(dt => {
            db.collection('projects').doc(dt.id).set({ projectName: newName }, { merge: true })
            .then(()=>{
                DBLogger.info(editProjectName.name,`project ${oldName} edited to ${newName}`)
            })
            .catch(err=>{
                DBLogger.err(editProjectName.name,`on set project ${err.message}`)
            })
        })
    })
    .catch(err=>{
        DBLogger.err(editProjectName.name,`on get project, ${err.message}`)
    })
}

const editProjectDeadline = (projectName, deadline) => {
    let projectRef = db.collection('projects').where('projectName', '==', projectName)

    projectRef.get()
    .then(data => {
        data.forEach(dt => {
            db.collection('projects').doc(dt.id).set({deadline:deadline }, { merge: true })
            .then(()=>{
                DBLogger.info(editProjectDeadline.name,`project ${oldName} edited to ${newName}`)
            })
            .catch(err=>{
                DBLogger.err(editProjectDeadline.name,`on set project ${err.message}`)
            })
        })
    })
    .catch(err=>{
        DBLogger.err(editProjectDeadline.name,`on get project, ${err.message}`)
    })
}

//------------------------------DELETE SECTION-----------------------//

const deleteProject = async (projectName) => {
    let projectRef = db.collection('projects').where('projectName', '==', projectName)
    return projectRef.get()
    .then(data => {
        let isSuccess = false
        
        data.forEach(dt => {
            db.collection('projects').doc(dt.id).set(
                { status: 'finished' }, { merge: true })
            .then(()=>{
                isSuccess = true
                DBLogger.info(deleteProject.name,`project ${projectName} deleted`)
            })
            .catch((err)=>{
                DBLogger.err(deleteProject.name,err.message)
            })
            for(let taskID of dt.data().Task){
                taskID.set({status:'deleted'},{merge:true})
            }
        })
        return isSuccess
    })
    .catch(err => {
        DBLogger.err(deleteProject.name,err.message)
    })

}

//-----------------------UPDATE SECTION------------------------------------//

const updateTaskStatus = (payload) => {
    let {timestamp} = getDate()
    let stat = {}
    Object.keys(payload).forEach(key => {
        items = payload[key]
        stat[key] = items.length

        items.forEach(item => {
            const { projectName, userId: userID, name } = item
            const taskReference = db.collection('tasks')
            .where('projectName', '==', projectName)
            .where('name', '==', name).where('userID', '==', userID)
            
            taskReference.get().then(results => {
                results.forEach(result => {
                    db.collection('tasks').doc(result.id).update({ status: 'done' }).catch(err=>{
                        DBLogger.err(updateTaskStatus.name,`update status done fail, ${err.message}`)
                    })
                    let temp = {}
                    temp[userID] = {}
                    temp[userID]['done'] = admin.firestore.FieldValue.arrayUnion(name)
                    temp[userID]['inProgress'] = admin.firestore.FieldValue.arrayRemove(name)

                    db.collection('reports').doc(timestamp.toString())
                    .set(temp, { merge: true })
                    .catch(err=>{
                        DBLogger.err(updateTaskStatus.name,`set reports fail, ${err.message}`)
                    })

                })

            }).catch(err => {
                DBLogger.err(updateTaskStatus.name,err.message)  
            })
        })

        updateStatistic(stat[key],key,'done')
    })
}

const updateUser = (userID,payload)=>{
    db.collection('users').doc(userID.toString()).set(payload,{merge:true})
    .then(()=>{
        DBLogger.info(updateUser.name,`${userID} data has been updated!`)
    })
    .catch(err=>{
        DBLogger.err(updateUser.name,err.message)
    })
}

const updateStatistic =(taskCount,userID,type)=>{
    const {timestamp} = getDate()
    let payload = {}
    
    db.collection('statistics').doc(timestamp.toString())
    .get().then(async results=>{
        if(!results.exists){
            if(type=='add'){
                payload['Added'] = taskCount
            }else{
                payload['Done'] = taskCount
            }
            await db.collection('statistics').doc(timestamp.toString())
            .set({[userID.toString()]:payload}, { merge: true })
            .catch(err=>{
                DBLogger.err(updateStatistic.name,`set new statistics, ${err.message}`)
            })
        }else{
            if(type=='add'){
                let oldAdded = results.data()[userID.toString()] && results.data()[userID.toString()].Added 
                payload['Added'] = oldAdded==undefined?taskCount:oldAdded+taskCount
            }else{
                let oldAdded = results.data()[userID.toString()]&&results.data()[userID.toString()].Done
                payload['Done'] = oldAdded==undefined?taskCount:oldAdded+taskCount
            }

            await db.collection('statistics').doc(timestamp.toString())
            .set({[userID.toString()]:payload},{merge:true})
            .catch(err=>{
                DBLogger.err(updateStatistic.name,`set new user statistics, ${err.message}`)
            })

        }
 
    })
    .catch(err=>{
        DBLogger.err(updateStatistic.name,`${err.message}`)
    })
}


//------------------------MISC SECTION--------------------------------//

const resetStat = ()=>{
    let {timestamp} = getDate()
    getUsersData('all').then(results=>{
        
        results.forEach(res=>{
            
            db.collection('statistics').doc(timestamp.toString())
            .set({[res.userID.toString()]:{Done:0,Added:0,Recurring:0}}, { merge: true }).then(()=>{
                
                getUserTasks(res.userID).then(task=>{
                    
                    db.collection('statistics').doc(timestamp.toString())
                    .get().then(results=>{
                        
                        db.collection('statistics').doc(timestamp.toString())
                        .set({[res.userID.toString()]:{Recurring:results.data()[res.userID.toString()].Recurring+task.length}},{merge:true})
                        .catch(err=>{
                            DBLogger.err(resetStat.name,`set new statistics, ${err.message}`)
                        })
                    })
                    .catch(err=>{
                        DBLogger.err(resetStat.name,`get old statistics, ${err.message}`)
                    })
                })
            })
            .catch(err=>{
                DBLogger.err(resetStat.name,`set statistics, ${err.message}`)
            })
        })
    })
}

const exportToExcel = async () => {
    const { year, month, day, timestamp } = getDate()
    let userIDs = new Set([])
    let usersReport
    const reportList = []
    const report = [
        ["Nama", "In Progress","Done", "Problem", "Project"]
    ]

    await getPastTaskToExcel()

    await getUsersData('all').then(async results => {
        results.forEach(item => {
            userIDs.add(item)
        })
    })

    await getTodayReport().then(result => {
        if(result!=undefined){
            usersReport = result
        }
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
        if(todayReport[userData['userID']].problems!=undefined){
            problem          = todayReport[userData['userID']].problems
        }
        
        tmp.push(userData['name'])
        
    
    
        // console.log(inProgress.length)
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
                ipTemp = todayReport[userData['userID']].inProgress&&todayReport[userData['userID']].inProgress[0]
                if(ipTemp!=undefined){
                    getTask.push(getProjectByTask(ipTemp))
                }else{
                    ipTemp=' '
                }
            }
        } else {
            // console.log('bawah')
            ipTemp  = ' '
            project = ' '
        }
        tmp.push(ipTemp)
    

        if (done != undefined) {
            if (done.length > 1) {
                let counter = 1
    
                done.forEach(item => {
                    doneTemp = doneTemp.concat(counter + '. ' + item + '\n')
                    counter++
                })
            } else {
                doneTemp = todayReport[userData['userID']].done && todayReport[userData['userID']].done[0]
                if(doneTemp==undefined){
                    infoTemp = ' '
                }
            }
        } else {
            doneTemp = ' '
        }
        tmp.push(doneTemp)


        // if (info != undefined) {
        //     if (info.length > 1) {
        //         let counter = 1
                
        //         info.forEach(item => {
        //             if(item!=undefined){
        //                 infoTemp = infoTemp.concat(counter + '. ' + item + '\n')
        //                 counter++
        //             }
        //         })
        //     } else {
        //         infoTemp = todayReport[userData['userID']].info[0]
        //         if(infoTemp==undefined){
        //             infoTemp = ' '
        //         }
        //     }
    
        // } else {
        //     infoTemp = ' '
        // }
        // tmp.push(infoTemp)
    
    
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
                problemTemp = todayReport[userData['userID']].problems&&todayReport[userData['userID']].problems[0]
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

const takeOverTask = (payloads) => {
    let {timestamp} = getDate()
    payloads.forEach(payload =>{

        const {taskId:tid, receiverId:uidB, senderId:uidL} = payload
        db.collection('tasks').doc(tid).set({ userID: uidB }, { merge: true })
        .catch(err=>{
            DBLogger.err(takeOverTask.name,`set new userID, ${err.message}`)
        })

        db.collection('tasks').doc(tid).get()
        .then(res=>{
            let temp = {}
            temp[uidB] = {}
            temp[uidL] = {}
            temp[uidB]['inProgress'] = admin.firestore.FieldValue.arrayUnion(res.data().name)
            temp[uidL]['inProgress'] = admin.firestore.FieldValue.arrayRemove(res.data().name)

            if(res.data().problems!=undefined){
                res.data().problems.forEach(problem=>{
                    temp[uidB]['problems'] = admin.firestore.FieldValue.arrayUnion(problem)
                    temp[uidL]['problems'] = admin.firestore.FieldValue.arrayRemove(problem)
                })
            }

            db.collection('reports').doc(timestamp.toString())
            .set(temp, { merge: true })
            .catch(err=>{
                DBLogger.err(takeOverTask.name,`set reports, ${err.message}`)
            })
            
        })
        .catch(err=>{
            DBLogger.err(takeOverTask.name,`get task, ${err.message}`)
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
                .catch(err=>{
                    DBLogger.err(takeOverTask.name,`update user in projects, ${err.message}`)
                })
            }
        })
        .catch(err=>{
            DBLogger.err(takeOverTask.name,`get projects, ${err.message}`)
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

module.exports = {
    listenProjects,
    listenUsers,
    updateUser,
    addProjects,
    addTaskTransaction,
    addProblems,
    getRoleList,
    getUserRole,
    getAdvice,
    getTaskCount,
    getDate,
    getStatistic,
    getUserProjects,
    getUserTasks,
    getGroupID,
    getUsersData,
    getDetailedProject,
    getProjects: getProjectName,
    getHoliday,
    getYearsFromDayOff,
    getUserTasksOrderByPriority,
    getDayOff,
    getQA,
    getProblems,
    getUserTaskCountAndDayOff,
    getAllTasks,
    addAdvice,
    checkDayOff,
    addHoliday,
    userDayOff,
    deleteProject,
    exportToExcel,
    editProjectName,
    generateTimestamp,
    saveUser,
    isUserExist,
    isUserActive,
    assignUserToProjects,
    updateTaskStatus,
    isHoliday,
    isAdmin,
    setAdmin,
    resetStat,
    takeOverTask,
    setGroupID,
    db
}
