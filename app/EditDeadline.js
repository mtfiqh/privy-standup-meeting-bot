const START_MONTH = 0;
const END_MONTH = 11;

const clndr = require('./Calendar')
const db = require('./DataTransaction')
class EditDeadline extends clndr.CalendarKeyboard{
    constructor(userID, name){
        const prefix = "editDeadline"

        super(`${prefix}@${userID}`, userID)
        this.addCache('userID', userID)
        this.addCache('name', name)
        this.addCache('prefix', prefix)
        this.prefix=prefix+'@'+userID
        this.addCache('token', Math.random().toString(36).substring(8))
        this.id = userID
        this.deadline=null
        this.date = new Date()        
    }

    async onStart(){
        this.setProjects=undefined
        const loadProjects = (projects)=>{
            this.setProjects=projects
        }
        await db.getProjects('In Progress').then(loadProjects.bind(this))
        if((this.setProjects && this.setProjects.size<1) || this.setProjects===undefined)
            return{
                type:'Send',
                message:'Maaf, saat ini tidak ada project yang sedang berlangsung!',
                id:this.id
            }
        
        this.projects=[]
        let keyboard=[], i=0
        this.setProjects.forEach(project =>{
            this.projects.push(project)
            keyboard.push([{
                text:project,
                callback_data:`${this.prefix}-selectProject-${i}`
            }])
            i++
        })
        keyboard.push(
            [
                {text:'Select', callback_data:`${this.prefix}-selectProject-s`}
            ],
            [
                {text:'Cancel', callback_data:`${this.prefix}-selectProject-c`}
            ]        
        )
        console.table(keyboard)        
    }
}

module.exports={EditDeadline}

const e = new EditDeadline(123, 'abc')
e.onStart()