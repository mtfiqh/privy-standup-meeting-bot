const {isAdmin,exportToExcel} = require("./DataTransaction")
const {App} = require('../core/App')
const {
    menuAdmin,
    menuUser,
    menuProjectsAdmin,
    menuProjectsUser,
    menuTasksUser,
    menuTasksAdmin
} = require('./resources/menu.config')

class Menu extends App{
    constructor(userID){
        super()
        this.register([
            //Basic Section
            'onMain',
            'onBackPressed',
            'onSave',
            'onClose',
            'onDayOff',
            'cron',
            'closeChild',
            //Task Section
            'onTasksClicked',
            'onReportTasks',
            'onAddTasks',
            'onListTasks',
            'onOfferTasks',
            'onAssignTasks',
            //Project Section
            'onProjectsClicked',
            'onAddProjects',
            'onEditProjects',
            'onDeleteProjects',
            'onListProjects',
        ])
        // Define Class variable here
        this.prefix     = `${Menu.name}@${userID}`
        this.userID     =  userID
        this.isAdmin    = {}
        this.state      = []
        this.visited    = new Set([])
        
    }


    //----------------BASIC SECTION-----------------------------------------

    async cron(){
        const {from } = this.cache[`from@${this.userID}`]
        return await this.onMain({from:from,chat:undefined})
    }

    async onMain({from,chat},first = false){
        this.message = ""
        this.from = from

        const load = result => { this.isAdmin = result }
        await isAdmin(from.id).then(load.bind(this))
        const opts = this.getMessageOptionOnMenu(from.id)
        const greetings = this.generateGreetings()
        this.visited.clear()
        this.onVisit(this.onMain.name,{from,chat})
        return {
            type:  first ? "Send": "Edit",
            id:this.userID,
            message: `Selamat ${greetings} ${from.first_name},\nSilahkan gunakan tombol dibawah ini.`,
            options: opts 
        }
        
    }
    
    onDayOff(){
        return {
            type:'Auto',
            message:'/dayOff'
        }
    }

    onClose(){
        return {
            destroy:true,
            id:this.userID,
            type:"Delete"
        }
    }

    closeChild(){
        return {
            id:this.userID,
            type:"Delete"
        }
    }
    
    async onSave(){
        try {
           await exportToExcel()           
           this.onVisit(this.onVisit.name) 
        } catch (error) {
            return {
                type:'Edit',
                id:this.userID,
                message:error.message,
            }
        }
        return {
            type:'Send',
            id:this.userID,
            message:'Success Export to Excel'
        } 
    }

    async onBackPressed(){
        const {func:tmp} = this.state.pop()
        const {func,args} = this.state.pop()
        const response = await this[func].call(this,args)
        this.visited.delete(tmp)
        return response
    }
        
    onVisit(name,args){
        if(!this.visited.has(name)){
            this.visited.add(name)
            this.state.push({func:name,args:args})        
        }
    }

    //-----------------TASK SECTION---------------------------
    onTasksClicked(){
        this.onVisit('onTasksClicked')
        if(this.isAdmin) return menuTasksAdmin(this.prefix,this.from)
        return menuTasksUser(this.prefix,this.from)
    }

    onAddTasks(){
        this.onVisit('onTasksClicked')
        return {
            type:'Auto',
            message:'/addTasks'
        }
    }

    onListTasks(){
        this.onVisit('onTasksClicked')
        return {
            type:'Auto',
            message:'/showTasks',
        }
    }

    onReportTasks(){
        this.onVisit('onTasksClicked')
        return {
            type:'Auto',
            message:'/report'
        }
    }

    onOfferTasks(){
        this.onVisit('onTasksClicked')
        return {
            type:'Auto',
            message:'/offer',
        }
    }

    onAssignTasks(){
        this.onVisit('onTasksClicked')
        return {
            type:'Auto',
            message:'/assignTasks',
        }
    }


    //----------------PROJECT SECTION------------------------
    onProjectsClicked(){
        this.onVisit('onProjectsClicked')
        if(this.isAdmin)
            return menuProjectsAdmin(this.from,this.prefix)

        return menuProjectsUser(this.from,this.prefix)
    }

    onAddProjects(){
        this.onVisit('onProjectsClicked')
        return {
            type:'Auto',
            message:'/createProjects',
        }
    }

    onEditProjects(){
        this.onVisit('onProjectsClicked')
        return {
            type:'Auto',
            message:'/updateProjects',
        }
    }

    onDeleteProjects(){
        this.onVisit('onProjectsClicked')
        return {
            type:'Auto',
            message:'/deleteProjects',
        }
    }

    onListProjects(){
        this.onVisit('onProjectsClicked')
        return {
            type:'Auto',
            message:'/listProjects',
        }
    }

    //-----------------SUPPORT FUNCTION-------------------------
    
    /**
     * Generate message option (button) based on user type (admin|user)
     * @param {int} userID - userID of a user
     * @returns {Object} messageOption - Message that will be rendered as button
     */
    getMessageOptionOnMenu(userID){
        if(this.isAdmin)
            return menuAdmin(this.prefix,userID)

        return menuUser(this.prefix,userID)
    }

    /**
     * Generate greetings based on local language and time
     * @returns {String} message - {'Pagi'|'Siang'|'Sore'|'Malam'}
     */
    generateGreetings(){
        const hour  = new Date().getHours()

        if(hour>4&&hour<10) 
            return 'Pagi'

        else if(hour>=10&&hour<15)
            return 'Siang'

        else if(hour>=15&&hour<19)
            return 'Sore'

        return 'Malam'
    }
    
}

module.exports={
    Menu
}