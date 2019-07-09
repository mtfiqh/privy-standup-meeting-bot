const {addTaskTransaction, getUserProjects,getUsersData, isAdmin,getUserTasks, getProjects} = require("./DataTransaction")
const {App} = require('../core/App')
const {onTypeListenMessage,onShowTasks, onPrioritySelected, onCancelMessage, onSelectProjects,onAssign, onSureMessage, onSaved, onSelectUser} = require('./Tasks.config')

class Tasks extends App{
    constructor(userID, prefix, name){
        super()
        this.register([
            this.onTypeListen.name,
            this.setPriority.name,
            this.selectProject.name,
            this.onSure.name,
            this.selectUser.name
        ])
        this.addCache('userID',userID)
        this.addCache('name', name)
        this.prefix=prefix
        //add prefix to be guide what func will be use
        //addTasks or assignTasks
        this.addCache('prefix', prefix)
        this.addCache('token', Math.random().toString(36).substring(8))
        this.addCache('countTasks',0)

    }
    
    async showTasks(from){
        await this.listTasks(from)
        return onShowTasks(this.text)
    }

    async listTasks(from){
        this.text="Berikut task yang kamu punya\n"
        const getTheTasks = function(tasks){
            let i=1
            for (let task of tasks){
                let tempDate = task.date.toDate()
                let readableDate = tempDate.getDate()+'/'+tempDate.getMonth()+'/'+tempDate.getFullYear()
                this.text+=`\n<b>#${task.projectName}</b>\n${i}. ${task.name} [${task.priority}]\nDibuat pada: ${readableDate}\n`
                i++
            }
        }
        await getUserTasks(this.cache.userID).then(getTheTasks.bind(this))
    }
    
    async onTypeListen(args){
        const{from, text}=args
        if(text==="SAVE"){
            console.log(from.id, `${this.cache.prefix} - SAVE BUTTON CLICKED`)            
            console.log(from.id, `${this.cache.prefix} - load projects from firebase`)
            await this.setKeyboardOfUsersProject(from.id)
            console.log('dataprojects', this.dataProjects)
            return onSelectProjects(this.dataProjects)

        }else if(text==="CANCEL"){
            console.log()
            delete this.cache
            return onCancelMessage()
        }
        console.log(from.id, `${this.cache.prefix} - Insert Task(s)`)
        //if tasks not create yet
        if(this.cache.tasks===undefined){
            this.addCache('tasks', [])
            console.log(from.id, `${this.cache.prefix} - cache tasks created`)
        }
        this.cache.tasks.push(text)
        console.log(from.id, `${this.cache.prefix} - ${text} added`)
        return onTypeListenMessage(text, this.cache.prefix, this.cache.userID, this.cache.countTasks.toString()+this.cache.token)
    }

    setPriority(args){
        const [priority, token]=args.split('@')
        if(this.cache.countTasks.toString()+this.cache.token !== token){
            console.log(this.cache.userID, 'clicked invalid button token')
            return
        }
        if(this.cache.priority===undefined){
            this.addCache('priority',[])
            console.log(this.cache.userID, `${this.cache.prefix} - cache priority created`)
        }
        this.cache.priority.push(priority)
        this.cache.countTasks++
        return onPrioritySelected(priority, this.cache.userID, this.cache.prefix)
    }

    async setKeyboardOfUsersProject(userID){
        this.dataProjects = []
        const setProjects = function(projects){
            if(this.cache.projects===undefined) this.addCache('projects', [])
            projects = new Set(projects)
            let count=0
            for(let project of projects){
                this.dataProjects.push([{text:`${project}`, callback_data:`${this.cache.prefix}@${this.cache.userID}-selectProject-${count}@p${this.cache.token}`}])
                this.cache.projects.push(project)
                count++
            }
            this.dataProjects.push([{text:`CANCEL`, callback_data:`${this.cache.prefix}@${this.cache.userID}-selectProject-c@p${this.cache.token}`}])

        }
        if(this.cache.prefix==="addTasks"){
            await getUserProjects(userID).then(setProjects.bind(this))
        }else if(this.cache.prefix==="assignTasks"){
            await getProjects('In Progress').then(setProjects.bind(this))
        }
    }
    async setKeyboardOfUsers(){
        this.dataUsers = []
        const getUsers = function(users){
            if(this.cache.users===undefined) this.addCache('users', [])
            users = new Set(users)
            let count=0
            for(let user of users){
                this.dataUsers.push([{text:`${user.name}`, callback_data:`${this.cache.prefix}@${this.cache.userID}-selectUser-${count}@u${this.cache.token}`}])
                this.cache.users.push({
                    userID:user.userID,
                    name:user.name
                })
                count++
            }
            this.dataUsers.push([{text:`CANCEL`, callback_data:`${this.cache.prefix}@${this.cache.userID}-selectUser-c@u${this.cache.token}`}])
        }
        await getUsersData('all').then(getUsers.bind(this))
    }

    async selectProject(args){
        const [idx, token]=args.split('@')
        if(idx=="c"){
            delete this.cache
            return onCancelMessage()
        }

        if(`p${this.cache.token}`!==token){
            console.log(this.cache.userID, `${this.cache.prefix} - selectProject token is invalid`)
            return
        }

        this.cache.projects = this.cache.projects[idx]
        console.log(this.cache.userID, `${this.cache.projects} selected`)
        if(`${this.cache.prefix}`==='addTasks'){
            console.log(this.cache.userID, 'on addTask goto onSure')
            const text = this.createTextForSure()
            return onSureMessage(text, this.cache.prefix, this.cache.userID, 's'+this.cache.token)
        }
        console.log(this.cache.userID, 'on assignTasks goto select User')
        await this.setKeyboardOfUsers()
        return onSelectUser(this.dataUsers)
        
        
    }

    createTextForSure(){
        let text=`Berikut list tasks, task yang akan kamu masukkan kedalam project ${this.cache.projects}`
        let i=0
        for(let task of this.cache.tasks){
            console.log(task)
            text=`${text}\n ${i+1}. ${task} [${this.cache.priority[i]}]`
            i++
        }
        if(this.cache.prefix==="assignTasks") text=text+`\n\nakan diberikan kepada ${this.cache.users.name}`
        return text
    }

    createTextForNotif(){
        let text = `Kamu mendapatkan tasks dari ${this.cache.name} untuk project ${this.cache.projects} berikut list tasks nya:\n\n`
        let i=0
        for(let task of this.cache.tasks){
            console.log(task)
            text=`${text}\n ${i+1}. ${task} [${this.cache.priority[i]}]`
            i++
        }
        return text
    }
    
    async onSure(args){
        console.log(this.cache.userID, `${this.cache.prefix} - onSure`)
        const [ans, token]=args.split('@')
        if(token!=='s'+this.cache.token){
            console.log(this.cache.userID, `${this.cache.prefix} - onSure token is invalid`)
            return
        }
        if(ans==="Y"){
            let i=0
            let tasks=[]
            for(let task of this.cache.tasks){
                tasks.push({
                    name:task,
                    userID:this.cache.prefix==="addTasks" ? this.cache.userID : this.cache.users.userID,
                    projectName: this.cache.prefix==="addTasks"? this.cache.projects[0] : this.cache.projects,
                    status:'In Progress',
                    priority:this.cache.priority[i]
                })
                i++
            }
            addTaskTransaction(tasks)
            console.log(this.cache.userID, `${this.cache.prefix} - saved`)
            if(this.cache.prefix==="assignTasks"){
                let textMe =`Selamat, tasks berhasil di assign ke ${this.cache.users.name}`
                let textTo = this.createTextForNotif()
                return onAssign(this.cache.users, textMe, textTo)  
                // delete this.cache
            } 
            return onSaved()

        }else if(ans==="N"){
            delete this.cache
            return onCancelMessage()
        }
    }

    selectUser(args){
        const [idx, token]=args.split('@')
        if('u'+this.cache.token!==token){
            console.log(this.cache.userID, `${this.cache.prefix} - onSelect User token is invalid`)
            return
        }
        if(this.idx=='c'){
            console.log(this.cache.userID, `${this.cache.prefix} cancel action`)
            delete this.cache
            return onCancelMessage()
        }
        this.cache.users=this.cache.users[idx]
        console.log(this.cache.users)
        console.log(this.cache.userID, 'on addTask goto onSure')
        const text = this.createTextForSure()
        return onSureMessage(text, this.cache.prefix, this.cache.userID, 's'+this.cache.token)
    }
}


module.exports={Tasks}
