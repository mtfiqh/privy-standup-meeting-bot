const {App} = require('../core/App')
const {onStartMessage} = require('./assignUsersProject.config')
const {getProjects} = require('./DataTransaction')


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
            'onSelection'
        ])
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
                callback_data:`${this.cache.prefix}-onSelection-${i}@${this.cache.token}`
            }])
            i++
        })
        console.log('keyboard', this.cache.keyboard)
    }

    onSelection(){

    }

}

module.exports={assignUsersProject}