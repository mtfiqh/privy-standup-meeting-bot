const {addProjects, getProjects, deleteProject} = require('./DataTransaction')
const{toggleCheck} = require('./helper/helper')
const {
    onTypeListenMessage,
    onCancelMessage,
    onSureMessage,
    onCreated,
    onSelectMessage,
    onDeleted
} = require('./CrudProject.config')
const {App} = require('../core/App')

class CrudProject extends App{
    constructor(userID, name, prefix){
        super()
        this.register([
            this.onTypeListen.name,
            this.create.name,
            this.showKeyboard.name,
            this.onSelect.name,
            this.delete.name,
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
        let text,action,edit
        if(this.cache.prefix==='createProjects'){
            text=`apakah kamu yakin akan membuat project:\n`
            let i=1
            edit=false
            action='create'
            this.cache.projects.forEach(project=>{
                text+=`${i}. ${project.projectName}\n`
                i++
            })
        }else if(this.cache.prefix==='deleteProjects'){
            text=`apakah kamu yakin akan menghapus projects:\n`
            let i=1
            action='delete'
            edit=true
            this.cache.select.forEach(project=>{
                text+=`${i}. ${project}\n`
                i++
            })
        }else if(this.cache.prefix==='updateProjects'){

        }else if(this.cache.prefix==='readProjects'){

        }

        return onSureMessage(text, this.cache.prefix, this.cache.userID, action, 'c'+this.cache.token, edit)
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
    
    async getAllProjects(){
        this.addCache('projects', {})
        this.addCache('projectsArray',{})
        const setAllProjects = function(projects){
            this.cache.projects=(projects)
            this.cache.projectsArray=Array.from(projects)
        }
        await getProjects('In Progress').then(setAllProjects.bind(this))
    }

    async showKeyboard(next){
        console.log('next', next)
        console.log(this.cache.userID, `${this.cache.prefix} - projects loading`)
        await this.getAllProjects()
        console.log(this.cache.userID, `${this.cache.prefix} - projects loaded`)
        if(this.cache.keyboard===undefined) this.addCache('keyboard', [])
        let i=0
        this.cache.projects.forEach(project=>{
            this.cache.keyboard.push([
                {text:project, callback_data:`${this.cache.prefix}@${this.cache.userID}-onSelect-${i}@d${this.cache.token}`}
            ])
            i++
        })
        this.cache.keyboard.push([{
            text:'SELECT',
            callback_data:`${this.cache.prefix}@${this.cache.userID}-onSelect-s@d${this.cache.token}`
        },{
            text:'CANCEL',
            callback_data:`${this.cache.prefix}@${this.cache.userID}-onSelect-c@d${this.cache.token}`
        }])
        return onSelectMessage(this.cache.keyboard, this.cache.userID, true, true)
    }

    onSelect(args){
        const [idx, token]=args.split('@')
        if(token!=='d'+this.cache.token){
            console.log(this.cache.userID, 'token is invalid')
            return
        }
        if(this.cache.select===undefined) this.addCache('select', new Set([]))
        if(idx==='c') return onCancelMessage()
        if(idx==='s'){
            if(this.cache.select.size<1) return onSelectMessage(this.cache.keyboard, this.cache.userID, false, 'Kamu harus memilih projectnya')
            return this.onSure()
        }
        if(this.cache.select.has(this.cache.projectsArray[idx])){
            this.cache.select.delete(this.cache.projectsArray[idx])
            this.cache.keyboard[idx][0].text=toggleCheck(this.cache.keyboard[idx][0].text)
        }else{
            this.cache.select.add(this.cache.projectsArray[idx])
            this.cache.keyboard[idx][0].text=toggleCheck(this.cache.keyboard[idx][0].text)
        }
        return onSelectMessage(this.cache.keyboard, this.cache.userID, false)
    }

    delete(args){
        const [res, token]=args.split('@')
        if(token!=='c'+this.cache.token){
            console.log(this.cache.userID, `invalid token`)
            return
        }
        if(res==="N"){
            return onCancelMessage()
        }
        this.cache.select.forEach(project=>{
            deleteProject(project)
        })
        return onDeleted()
    }



    
}

module.exports={CrudProject}