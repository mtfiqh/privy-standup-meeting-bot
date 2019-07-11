const {addProjects, getProjects, deleteProject, editProjectName,getTaskCount} = require('./DataTransaction')
const{toggleCheck} = require('./helper/helper')
const {
    onTypeListenMessage,
    onCancelMessage,
    onSureMessage,
    onCreated,
    onSelectMessage,
    onDeleted,
    onUpdate,
    updated,
    onShowProjects,
} = require('./CrudProject.config')
const {App} = require('../core/App')

class CrudProject extends App{
    constructor(userID, name, prefix){
        super()
        this.register([
            'onTypeListen',
            'create',
            'showKeyboard',
            'onSelect',
            'delete',
            'update',
            'read',
            'onClose',
        ])
        this.addCache('userID', userID)
        this.addCache('name', name)
        this.addCache('prefix', prefix)
        this.prefix=prefix+'@'+userID
        this.addCache('token', Math.random().toString(36).substring(8))
    }
    onTypeListen(context){
        const {text} = context
        if(this.cache.prefix==='updateProjects'){
            this.cache.updateProject = text
            return this.onSure()
        }
        if(text==="SAVE"){
            console.log(this.cache.userID, `${this.cache.prefix} - SAVE BUTTON CLICKED`)
            return this.onSure()
        }else if(text==="CANCEL"){
            console.log(this.cache.userID, `${this.cache.prefix} - CANCEL BUTTON CLICKED`)
            return onCancelMessage("Send", this.cache.userID, this.cache.prefix)            
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
            text=`${this.cache.projectsArray[this.cache.selectIdx]} akan diubah menjadi ${this.cache.updateProject}, apakah kamu yakin?`
            action='update'
            edit=false
        }else if(this.cache.prefix==='readProjects'){

        }

        return onSureMessage(text, this.cache.prefix, this.cache.userID, action, 'c'+this.cache.token, edit)
    }

    create(args){
        console.log(this.cache.userID, `${this.cache.prefix} - create`)
        const [res, token] = args.split('@')
        if(res==='N'){
            console.log(this.cache.userID, `No button clicked`)
            return onCancelMessage("Send", this.cache.userID, this.cache.prefix)
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
    async getAllProjectsCounts(){
        this.addCache('projects', {})
        const setAllProjects = function(projects){
            this.cache.projects=(projects)
        }
        await getTaskCount().then(setAllProjects.bind(this))
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
        return onSelectMessage(this.cache.keyboard, this.cache.userID, true, true, this.cache.prefix)
    }

    onSelect(args){
        const [idx, token]=args.split('@')
        if(token!=='d'+this.cache.token){
            console.log(this.cache.userID, 'token is invalid')
            return
        }
        if(this.cache.select===undefined) this.addCache('select', new Set([]))
        if(idx==='c') return onCancelMessage("Delete", this.cache.userID, this.cache.prefix)
        if(idx==='s'){
            if(this.cache.select.size<1) return onSelectMessage(this.cache.keyboard, this.cache.userID, false, 'Kamu harus memilih projectnya')
            if(this.cache.prefix==='updateProjects'){
                return onUpdate(this.cache.userID, this.cache.prefix, this.cache.projectsArray[this.cache.selectIdx])
            }
            return this.onSure()
        }
        if(this.cache.prefix==="deleteProjects"){
            if(this.cache.select.has(this.cache.projectsArray[idx])){
                this.cache.select.delete(this.cache.projectsArray[idx])
                this.cache.keyboard[idx][0].text=toggleCheck(this.cache.keyboard[idx][0].text)
            }else{
                this.cache.select.add(this.cache.projectsArray[idx])
                this.cache.keyboard[idx][0].text=toggleCheck(this.cache.keyboard[idx][0].text)
            }
        }else if(this.cache.prefix==="updateProjects"){
            console.log(this.cache.selectIdx)
            console.log(idx)
            if(this.cache.select.size>0){
                console.log('msk')
                this.cache.keyboard[this.cache.selectIdx][0].text=toggleCheck(this.cache.keyboard[this.cache.selectIdx][0].text)            
                this.cache.select.delete(this.cache.projectsArray[this.cache.selectIdx])
            }
            if(this.cache.selectIdx!==idx){
                console.log('masuk')
                this.cache.selectIdx=idx
                this.cache.keyboard[idx][0].text=toggleCheck(this.cache.keyboard[idx][0].text)            
                this.cache.select.add(this.cache.projectsArray[idx])
            }else{
                if(this.cache.selectIdx === idx){
                    this.cache.selectIdx=undefined
                }
            }
            
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
            return onCancelMessage("Delete", this.cache.userID, this.cache.prefix)
        }
        this.cache.select.forEach(project=>{
            deleteProject(project)
        })
        return onDeleted(this.cache.userID)
    }

    update(args){
        const [res, token]=args.split('@')
        if(token!=='c'+this.cache.token){
            console.log(this.cache.userID, `invalid token`)
            return
        }
        if(res==="N"){
            return onCancelMessage("Delete", this.cache.userID, this.cache.prefix)
        }
        editProjectName(this.cache.projectsArray[this.cache.selectIdx], this.cache.updateProject)
        return updated()
    }

    async read(){
        await this.getAllProjectsCounts()
        let message
        console.log(this.cache.projects)
        if(this.cache.projects.size<1){
            message='Tidak ada project yang sedang berlangsung untuk saat ini'
        }else{
            message='Berikut projects yang sedang berlangsung untuk saat ini\n'
            let i=1
            Object.keys(this.cache.projects).forEach(project =>{
                message+=`${i}. ${project} [${this.cache.projects[project].taskDone}/${this.cache.projects[project].allTask}]\n\n`
                i++
            })
        }

        return onShowProjects(message, this.prefix, 'cl'+this.cache.token)

    }
    
    onClose(token){
        if(token!=='cl'+this.cache.token){
            console.log('token invalid')
            return
        }
        return{
            destroy:true,
            type:'Delete',
            id:this.cache.userID
        }
    }
}

module.exports={CrudProject}