const {isAdmin,exportToExcel} = require("./DataTransaction")
const {
        menuAdmin,
        menuUser,
        menuProjectsAdmin,
        menuProjectsUser,
        menuTasksUser,
        menuTasksAdmin
    } = require('./resources/menu.config')

const {App} = require('../core/App')

class Menu extends App{
    constructor(bot,userID){
        super()
        this.register([
            //Basic Section
            this.onMain.name,
            this.onBackPressed.name,
            this.onSave.name,
            this.onClose.name,

            //Task Section
            this.onTasksClicked.name,
            this.onReportTasks.name,
            this.onAddTasks.name,
            this.onListTasks.name,
            this.onOfferTasks.name,
            this.onAssignTasks.name,
            
            //Project Section
            this.onProjectsClicked.name,
            this.onAddProjects.name,
            this.onEditProjects.name,
            this.onDeleteProjects.name,
            this.onListProjects.name,
            
            // Add new section here

        ])



        // Define Class variable here
        this.prefix = `${Menu.name}@${userID}`
        this.isAdmin={}
        this.state=[]
        this.bot=bot
        this.userID= userID
        
    }

    /**
     * response = {
     *     type : type case (ex."Edit") (required!)
     *     from : prefix,
     *     message: message
     *     options: inlineKeyboardOption
     *     deleteLast : boolean
     *     agrs : any
     * }
     */


    //----------------BASIC SECTION-----------------------------------------

    async onMain({from,chat},first = false){
        this.message = ""
        const load = result => {
            this.isAdmin = result
        }

        await isAdmin(from.id).then(load.bind(this))
        this.state.push({func:this.onMain.name,args:{from,chat}})
        this.from = from

        let opts = this.getMessageOptionOnMenu(from.id)
        let greetings = this.generateGreetings()
        
        return {
            type:  first ? "Send": "Edit",
            id:this.userID,
            message: `Selamat ${greetings} ${from.first_name},\nSilahkan gunakan tombol dibawah ini.`,
            options: opts 
        }
        
    }
    
    onClose(){
        return {
            destroy:true,
            id:this.userID,
            type:"Delete"
        }
    }
    
    async onSave(){
        try {
           await exportToExcel()            
        } catch (error) {
            console.log(error)
            return {
                type:'Edit',
                id:this.userID,
                message:error.message,
            }
        }
        return {
            type:'Edit',
            id:this.userID,
            message:'Success Export to Excel'
        } 
    }

    async onBackPressed(){
        this.state.pop()
        let {func,args} = this.state.pop()

        
        const response = await this[func].call(this,args)
        return response
        
    }
        
    //-----------------END SECTION----------------------------


    //-----------------TASK SECTION---------------------------
    onTasksClicked(){
        this.state.push({func:this.onTasksClicked.name,args:{}})

        if(this.isAdmin){
            return menuTasksAdmin(this.prefix,this.from)
        }else{
            return menuTasksUser(this.prefix,this.from)
        }
    }

    onAddTasks(){
        this.state.push({func:this.onAddTasks.name,args:{}})

        return {
            //Objects to trigger taufiq's function
            
            //Testing
            type:'Auto',
            message:'/addTasks'
        }
    }

    onListTasks(){
        this.state.push({func:this.onListTasks.name,args:{}})
        
        return {
            //Objects to trigger taufiq's function

            //Testing
            type:'Auto',
            message:'/showTasks',
        }
    }

    onReportTasks(){
        this.state.push({func:this.onReportTasks.name,args:{}})
        return {

            //Testing
            type:'Auto',
            message:'/report'
        }
    }

    onOfferTasks(){
        this.state.push({func:this.onOfferTasks.name,args:{}})
        return {
            //Object to trigger Jose's function

            //Testing
            type:'Auto',
            message:'/offer',
        }
    }

    onAssignTasks(){
        this.state.push({func:this.onAssignTasks.name,args:{}})
        return {
            //Objects to trigger taufiq's function
            //Testing
            type:'Auto',
            message:'/assignTasks',
        }
    }

    //----------------END SECTION----------------------------


    //----------------PROJECT SECTION------------------------
    onProjectsClicked(){
        this.state.push({func:this.onProjectsClicked.name,args:{}})

        if(this.isAdmin){
            return menuProjectsAdmin(this.from,this.prefix)
        }else{
            return menuProjectsUser(this.from,this.prefix)
        }
    }

    onAddProjects(){
        this.state.push({func:this.onAddProjects.name,args:{}})
        return {
            //Objects to trigger taufiq's function
            //Testing
            type:'Auto',
            message:'/addProject',
        }
    }

    onEditProjects(){
        this.state.push({func:this.onEditProjects.name,args:{}})
        return {
            //Objects to trigger taufiq's function
            //Testing
            type:'Auto',
            message:'/editProject',
        }
    }

    onDeleteProjects(){
        this.state.push({func:this.onDeleteProjects.name,args:{}})
        return {
            //Objects to trigger taufiq's function
            //Testing
            type:'Auto',
            message:'/deleteProject',
        }
    }

    onListProjects(){
        this.state.push({func:this.onListProjects.name,args:{}})
        return {
            //Objects to trigger taufiq's function
            //Testing
            type:'Auto',
            message:'/listProject',
        }
    }

    //-----------------END SECTION------------------------------


    //-----------------SUPPORT FUNCTION-------------------------
    
    /**
     * Generate message option (button) based on user type (admin|user)
     * @param {int} userID - userID of a user
     * 
     * @returns {Object} messageOption - Message that will be rendered as button
     */
    getMessageOptionOnMenu(userID){
        if(this.isAdmin){
            return menuAdmin(this.prefix,userID)
        }else{
            return menuUser(this.prefix,userID)
        }
    }

    /**
     * Generate greetings based on local language and time
     * 
     * @returns {String} message - {'Pagi'|'Siang'|'Sore'|'Malam'}
     */
    generateGreetings(){

        let now = new Date()
        let hour = now.getHours()
        let message = ''
        
        if(hour>4&&hour<10){
            message = 'Pagi'
        }else if(hour>=10&&hour<15){
            message = 'Siang'
        }else if(hour>=15&&hour<19){
            message = 'Sore'
        }else{
            message = 'Malam'
        }
        return message
    }
    
}

module.exports={Menu}