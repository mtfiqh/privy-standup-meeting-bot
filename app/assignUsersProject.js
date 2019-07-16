const {App} = require('../core/App')
const {onStartMessage, onSelectionMessage, onCancelMessage, onSureMessage, onSuccess} = require('./assignUsersProject.config')
const {getProjects,getUsersData, assignUserToProjects} = require('./DataTransaction')
const {toggleCheck} = require('./helper/helper')


class assignUsersProject extends App{
    constructor(userID, name, prefix){
        super()
        this.addCache('userID', userID)
        this.addCache('name', name)
        this.addCache('prefix', prefix)
        this.addCache('token',Math.random().toString(36).substr(2,8))
        this.prefix = `${prefix}@${userID}`
        this.register([
            'onStart',
            'onSelection',
            'onClose',
            'onSure'
        ])
        this.addCache('idxProject', {})
    }

    /**
     * function to get and set all projects
     */
    async getAllProjects(){
        this.projects={}
        const setProjects = function(projects){
            this.projects=Array.from(projects)
        }
        await getProjects('In Progress').then(setProjects.bind(this))
    }

    /**
     * 
     * function to get and set all users
     * 
     */
    async getAllUsers(){
        this.users={}
        this.setOfUsers={}
        const setUsers = function(users){
            console.log(users)
            this.users=users
            this.setOfUsers=new Set(users)
        }
        await getUsersData('all').then(setUsers.bind(this))
    }
    /**
     * function that will be called at first
     * 
     */
    async onStart(){
        console.log(this.cache.userID, `${this.prefix} loading projects`)
        await this.getAllProjects()
        // console.log(this.projects)
        this.cache.keyboard=[]
        let i = 0
        this.projects.forEach(project=>{
            this.cache.keyboard.push([{
                text:project,
                callback_data:`${this.prefix}-onSelection-${i}@${this.cache.token}@s`
            }])
            i++
        })

        this.cache.keyboard.push([{
            text:`Select`,
            callback_data:`${this.prefix}-onSelection-s@${this.cache.token}@s`
        },{
            text:`Cancel`,
            callback_data:`${this.prefix}-onSelection-c@${this.cache.token}@s`
        }])

        return onStartMessage(this.cache.keyboard)
    }

    onClose(){
        return{
            type:'Delete',
            id:this.cache.userID,
            destroy:true,
        }
    }
    /**
     * 
     * @param {any} args
     * multiple : m --> can select multiple choices, s --> only single choice 
     * if m -> goto onUsersSelect, s --> goto onProjectSelect
     */
    onSelection(args){
        const [idx, token, multiple] = args.split('@')
        if(token!==this.cache.token){console.log(this.prefix, 'token is invalid'); return}
        if(idx==="s"){
            //select
            if(multiple==='s'){
                //goto onProjectSelect
                if(this.cache.idxProject>=0){
                    return this.onProjectSelect()
                }
                return onSelectionMessage(this.cache.keyboard, this.cache.userID, `Kamu harus memilih dulu!\n`)


            }else if(multiple==='m'){
                //goto onUsersSelect
                if(this.cache.idxUsers && this.cache.idxUsers.size>=1){
                    return this.onUsersSelect()
                }
                return onSelectionMessage(this.cache.keyboard, this.cache.userID, `Kamu harus memilih dulu!\n`)
            }
        }else if(idx==="c"){
            //cancel
            return onCancelMessage(this.cache.userID, this.prefix, this.cache.token)
        }
        if(multiple==='s'){
            if(this.cache.idxProject === idx){
                this.cache.idxProject = {}
                this.cache.keyboard[idx][0].text = toggleCheck(this.cache.keyboard[idx][0].text)
            }else{
                this.cache.keyboard[idx][0].text = toggleCheck(this.cache.keyboard[idx][0].text)
                if(this.cache.idxProject>=0){
                    this.cache.keyboard[this.cache.idxProject][0].text = toggleCheck(this.cache.keyboard[this.cache.idxProject][0].text)
                }  
                this.cache.idxProject=idx
            }
        }else if(multiple==='m'){
            if(this.cache.idxUsers===undefined) this.addCache('idxUsers', new Set([]))
            if(this.cache.idxUsers.has(idx)){
                // kalo sudah di select then unselect
                this.cache.idxUsers.delete(idx)
                this.cache.keyboard[idx][0].text=toggleCheck(this.cache.keyboard[idx][0].text)
            }else{
                this.cache.idxUsers.add(idx)
                this.cache.keyboard[idx][0].text=toggleCheck(this.cache.keyboard[idx][0].text)
            }
        }

        return onSelectionMessage(this.cache.keyboard, this.cache.userID)
        
    }

    async onProjectSelect(){
        this.cache.selectProject = this.projects[this.cache.idxProject]
        await this.getAllUsers()
        this.cache.keyboard=[]
        let i=0
        this.users.forEach(user=>{
            this.cache.keyboard.push([{
                text:user.name, callback_data:`${this.prefix}-onSelection-${i}@${this.cache.token}@m`
            }])
            i++
        })
        this.cache.keyboard.push([{
            text:`Select`,
            callback_data:`${this.prefix}-onSelection-s@${this.cache.token}@m`
        },{
            text:`Cancel`,
            callback_data:`${this.prefix}-onSelection-c@${this.cache.token}@m`
        }])
        return onSelectionMessage(this.cache.keyboard, this.cache.userID, `Silahkan pilih user(s) yang akan di assign ke project ${this.cache.selectProject}`)
    }

    onUsersSelect(){
        let users=""
        let i=1
        this.cache.idxUsers.forEach(idxUser=>{
            users+=`${i}. ${this.users[idxUser].name}\n`
            i++
        })
        return onSureMessage(this.cache.userID, this.prefix, this.cache.token, this.projects[this.cache.idxProject], users)
    }

    onSure(args){
        const [choose, token] = args.split('@')
        if(token!==this.cache.token){
            return
        }

        if(choose==='Y'){
            // assignUserToProjects()
            this.cache.idxUsers.forEach(idxUser=>{
                assignUserToProjects(this.projects[this.cache.idxProject], this.users[idxUser].userID)
            })
            return onSuccess(this.cache.userID, this.prefix, this.cache.token)
        }else if(choose==='N'){
            return onCancelMessage(this.cache.userID, this.prefix, this.cache.token)
        }
    }

}

module.exports={assignUsersProject}