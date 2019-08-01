const START_MONTH = 0;
const END_MONTH = 11;

const clndr = require('./Calendar')
const db = require('./DataTransaction')
const { toggleCheck } = require('./helper/helper')
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
        this.selectProject=null
        this.deadline=null
        this.selectDeadline=null
        
        this.register([
            'onStart',
            'onSelectProject',
            'onSelectDeadline',
            'onPrev',
            'onNext'
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
        this.keyboard=[] 
        let i=0
        this.setProjects.forEach(project =>{
            this.projects.push(project)
            this.keyboard.push([{
                text:project,
                callback_data:`${this.prefix}-onSelectProject-${i}@${this.cache.token}`
            }])
            i++
        })
        this.keyboard.push(
            [
                {text:'Select', callback_data:`${this.prefix}-onSelectProject-s@${this.cache.token}`},
                {text:'Cancel', callback_data:`${this.prefix}-onSelectProject-c@${this.cache.token}`}
            ]
        )
        
        return{
            type:'Send',
            id:this.id,
            message:'Pilih project yang akan diubah deadline nya:',
            options:{
                reply_markup:{
                    inline_keyboard:this.keyboard
                }
            }
        }
    }

    onSelectProject(args){
        const [idx, token] = args.split('@')
        if(token!==this.cache.token) return

        if(idx==='s'){
            console.log('select')
            if(this.selectProject===null){
                return{
                    type:'NoAction',
                    message:'Kamu harus memilih salah satu project untuk melanjutkan!'
                }
            }

            return{
                type:'Edit',
                id:this.id,
                message:'Pilih deadline project:\n',
                options:{
                    reply_markup:{
                        inline_keyboard:this.makeCalendar(this.date.getFullYear(), this.date.getMonth(), 'onSelectDeadline', "Skip")
                    }
                }
            }


        }else if(idx==='c'){
            console.log('cancel')
            return {
                id:this.id,
                type:'Edit',
                message:'Permintaan dibatlkan!',
                destroy:true,
            }
        }

        if(idx===this.selectProject){
            this.selectProject=null
        }else{
            if(this.selectProject!==null) {
                console.log(this.keyboard[this.selectProject])
                this.keyboard[this.selectProject][0].text = toggleCheck(this.keyboard[this.selectProject][0].text)
            }

            this.selectProject=idx
        }
        this.keyboard[idx][0].text = toggleCheck(this.keyboard[idx][0].text)
        console.log('selected project', this.projects[this.selectProject])
        return{
            type:'Edit',
            message:'Pilih Project yang akan diubah deadline nya:\n',
            id:this.id,
            options:{
                reply_markup:{
                    inline_keyboard:this.keyboard
                }
            }
        }

    }

    onSelectDeadline(args){
        const data = clndr.parseArgs(args)
        console.log(data)
        const checkIcon = '️️✔️'

        let text = this.calendar[data.row][data.col].text
        console.log(text)
        if(text.includes(checkIcon)){
            this.selectDeadline=null
            this.deadline = null
        }else{
            if(this.selectDeadline!==null){
                this.calendar[this.selectDeadline.row][this.selectDeadline.col].text = toggleCheck(this.calendar[this.selectDeadline.row][this.selectDeadline.col].text)
            }
            this.selectDeadline=data
            this.deadline={
                'year':data.year,
                'month':data.month,
                'day':data.day
            }
        }
        this.calendar[data.row][data.col].text = toggleCheck(text)
        console.log(this.calendar[data.row][data.col].text)
        return{
            type:'Edit',
            id:this.cache.userID,
            message:'Pilih deadline project:\n',
            options:{
                reply_markup:{
                    inline_keyboard:this.calendar
                }
            }
        }
    }

    onNext(args) {
        const data = clndr.parseArgs(args);
        if (data.month == END_MONTH) {
            data.month = START_MONTH;
            data.year += 1;
        } else {
            data.month += 1;
        }

        const message = this.renderMesage();
        return {
            id: this.id,
            type: "Edit",
            message: message == false ? "Next" : message,
            options: {
                parse_mode: "Markdown",
                reply_markup: {
                    inline_keyboard: this.makeCalendar(
                        data.year,
                        data.month,
                        "onSelectDeadline",
                        "Skip"
                    )
                }
            }
        };
    }
    onPrev(args) {
        const data = clndr.parseArgs(args);
        if (data.month == START_MONTH) {
            data.month = END_MONTH;
            data.year -= 1;
        } else {
            data.month -= 1;
        }

        const message = this.renderMesage();
        return {
            id: this.id,
            type: "Edit",
            message: message == false ? "Prev" : message,
            options: {
                parse_mode: "Markdown",
                reply_markup: {
                    inline_keyboard: this.makeCalendar(
                        data.year,
                        data.month,
                        "onSelectDeadline",
                        "Skip"                        
                    )
                }
            }
        };
    }
}

module.exports={EditDeadline}

// const e = new EditDeadline(123, 'abc')
// e.onStart().then(res=>{
//     let result = e.onSelectProject(0)
//     console.log(result)
// })
// e.selectProject(0)