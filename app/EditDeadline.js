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
        
        this.register([
            'onStart',
            'selectProject'
        ])
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
        
        return{
            type:'Send',
            id:this.id,
            message:'Pilih project yang akan diubah deadline nya:',
            options:{
                reply_markup:{
                    inline_keyboard:keyboard
                }
            }
        }
    }

    selectProject(idx){
        if(idx==='s'){
            console.log('select')
            return //select
        }else if(idx==='c'){
            console.log('cancel')
            return //cancel
        }

        console.log('index', idx)
        console.log(this.projects[idx])
    }
}

module.exports={EditDeadline}

const e = new EditDeadline(123, 'abc')
e.onStart().then(res=>{
    e.selectProject(0)
})