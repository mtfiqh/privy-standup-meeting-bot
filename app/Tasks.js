const {addTaskTransaction, getUserProjects, isAdmin,getUserTasks} = require("./DataTransaction")
const {App} = require('../core/App')
const {onTypeListenMessage, onPrioritySelected, onCancelMessage, onSelectProjects, onSureMessage, onSaved} = require('./Tasks.config')

class Tasks extends App{
    constructor(userID, prefix){
        super()
        this.register([
            this.onTypeListen.name,
            this.setPriority.name,
            this.selectProject.name,
            this.onSure.name
        ])
        this.addCache('userID',userID)
        //add prefix to be guide what func will be use
        //addTasks or assignTasks
        this.addCache('prefix', prefix)
        this.addCache('token', Math.random().toString(36).substring(8))
        this.addCache('countTasks',0)

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
        const getProjects = function(projects){
            if(this.cache.projects===undefined) this.addCache('projects', [])
            projects = new Set(projects)
            let count=0
            for(let project of projects){
                this.dataProjects.push([{text:`${project}`, callback_data:`${this.cache.prefix}@${this.cache.userID}-selectProject-${count}@p${this.cache.token}`}])
                this.cache.projects.push(project)
                count++
            }
            this.dataProjects.push([{text:`CANCEL`, callback_data:`${this.cache.prefix}@${this.cache.userID}-selectProject-cancel@p${this.cache.token}`}])

        }
        await getUserProjects(userID).then(getProjects.bind(this))
    }

    selectProject(args){
        const [idx, token]=args.split('@')
        if(idx==="cancel"){
            delete this.cache
            return onCancelMessage()
        }

        if(`p${this.cache.token}`!==token){
            console.log(this.cache.userID, `${this.cache.prefix} - selectProject token is invalid`)
            return
        }

        this.cache.projects = this.cache.projects[idx]
        let text=`Berikut list tasks, task yang akan kamu masukkan kedalam project ${this.cache.projects}`
        console.log(this.cache.userID, `${this.cache.projects} selected`)
        let i=0
        if(`${this.cache.prefix}`==='addTasks'){
            console.log(this.cache.userID, 'on addTask goto onSure')
            for(let task of this.cache.tasks){
                console.log(task)
                text=`${text}\n ${i}. ${task} [${this.cache.priority[i]}]`
                i++
            }
            return onSureMessage(text, this.cache.prefix, this.cache.userID, 's'+this.cache.token)
        }
        return
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
                    userID:this.cache.userID,
                    projectName:this.cache.projects[0],
                    status:'In Progress',
                    priority:this.cache.priority[i]
                })
                i++
            }
            addTaskTransaction(tasks)
            console.log(this.cache.userID, `${this.cache.prefix} - saved`)
            delete this.cache
            return onSaved()

        }else if(ans==="N"){
            delete this.cache
            return onCancelMessage()
        }
    }
}


module.exports={Tasks}