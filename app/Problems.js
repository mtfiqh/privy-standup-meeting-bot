const { App } = require('../core/App')
const {getProblems,getAllTasks} = require('./DataTransaction')
const {generateKeyboardList,generateMessageProblems}= require('./Problems.config')
class Problems extends App{
    constructor(userID, prefix){
        super()
        this.register([
            'onGetTask',
            'onSelectProblem',
            'onBackPressed',
            'onClose'
        ])
        this.userID = userID,
        this.prefix = prefix
    }

    async onGetTask(first=true){
        const allTask = await getAllTasks()
        const taskHaveProblems = []
        console.log('in')
        allTask.forEach(task=>{
            if((task.problems!=undefined)&&(task.problems.length!=0&&task.status=="In Progress")){
                taskHaveProblems.push(task)
                if(this.cache[task.taskID]==undefined){
                    this.addCache(task.taskID,task.name)
                }
            }
        })
        const keyboard = generateKeyboardList(taskHaveProblems,this.prefix)
        return {
            type:`${first?`Send`:`Edit`}`,
            message:`Berikut task yang memiliki kendala`,
            options:{
                parse_mode:'Markdown',
                reply_markup:{
                    inline_keyboard:keyboard
                }
            }
        }
    }

    async onSelectProblem(taskID){
        const problems = await getProblems(taskID)
        const message  = await generateMessageProblems(problems,this.cache[taskID])
        
        return {
            type:'Edit',
            message:message,
            options:{                
                parse_mode:'Markdown',
                reply_markup:{
                    inline_keyboard:[
                        [
                            {text:`Back`,callback_data:`${this.prefix}-onBackPressed-`}
                        ]
                    ]
                }
            }
        }
    }

    onBackPressed(){
        return this.onGetTask(false)
    }

    onClose(){
        return {
            destroy:true,
            type:'Delete',
            id:this.userID
        }
    }
}

module.exports={
    Problems
}