const {addProjects} = require('./DataTransaction')
const {
    onTypeListenMessage,
    onCancelMessage,
    onSureMessage,
    onCreated
} = require('./CrudProject.config')
const {App} = require('../core/App')

class CrudProject extends App{
    constructor(userID, name, prefix){
        super()
        this.register([
            this.onTypeListen.name,
            this.create.name
        ])
        this.addCache('userID', userID)
        this.addCache('name', name)
        this.addCache('prefix', prefix)
        this.prefix=prefix+'@'+userID
        this.addCache('token', Math.random().toString(36).substring(8))
    }
    onTypeListen(context){
        const {text} = context
        if(text==="SAVE"){
            console.log(this.cache.userID, `${this.cache.prefix} - SAVE BUTTON CLICKED`)
            return this.onSure()
        }else if(text==="CANCEL"){
            console.log(this.cache.userID, `${this.cache.prefix} - CANCEL BUTTON CLICKED`)
            return onCancelMessage()            
        }
        if(this.cache.projects===undefined){
            this.addCache('projects',[])
        }
        this.cache.projects.push({
            projectName:text
        })
        console.log(this.cache.userID, `${this.cache.prefix} - on Type Listen ${text}`)
        return onTypeListenMessage(text, this.cache.userID, this.cache.prefix)
    }

    onSure(){
        let text,action
        if(this.cache.prefix==='createProjects'){
            text=`apakah kamu yakin akan membuat project:\n`
            let i=1
            action='create'
            this.cache.projects.forEach(project=>{
                text+=`${i}. ${project.projectName}\n`
                i++
            })
        }else if(this.cache.prefix==='deleteProjects'){

        }else if(this.cache.prefix==='updateProjects'){

        }else if(this.cache.prefix==='readProjects'){

        }

        return onSureMessage(text, this.cache.prefix, this.cache.userID, action, 'c'+this.cache.token)
    }

    create(args){
        console.log(this.cache.userID, `${this.cache.prefix} - create`)
        const [res, token] = args.split('@')
        if(res==='N'){
            console.log(this.cache.userID, `No button clicked`)
            return onCancelMessage()
        }
        if(token!=='c'+this.cache.token){
            console.log(this.cache.userID, 'token is invalid')
            return
        }
        addProjects(this.cache.projects)
        return onCreated()
    }



    
}

module.exports={CrudProject}