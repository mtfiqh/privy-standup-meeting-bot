const {App} = require('../core/App')
const {getUserTasks, addProblems} = require('./DataTransaction')
const {onAdded, onStartMessage,onSaveMessage, onCancelMessage,onCancelMessage2, onSelectedTaskMessage, typeListenMessage} = require('./insertProblems.config')

class InsertProblems extends App{
    constructor(userID, name, prefix){
        super()
        this.register([
            'onStart',
            'onSelectTask',
            'onTypeListen',
            'onSure',
            'onClose'
        ])
        this.addCache('userID', userID)
        this.addCache('name', name)
        this.addCache('prefix', prefix)
        this.addCache('keyboard', [])
        this.addCache('selectedTask', {})
        this.addCache('token', Math.random().toString(36).substring(8))
        this.addCache('problems', [])
        this.prefix=`${prefix}@${userID}`
        this.id = userID
    }
    async getAllUserTasks(){
        this.tasks={}
        const setAllUserTasks= function(tasks){
            this.tasks=tasks
        }
        await getUserTasks(this.cache.userID).then(setAllUserTasks.bind(this))
    }
    
    async onStart(type){
        this.cache.problems=[]
        await this.getAllUserTasks()
        this.cache.keyboard=[]
        let i=0
        for(let task of this.tasks){
            this.cache.keyboard.push([
                {text:task.name, callback_data:`${this.prefix}-onSelectTask-${i}@${this.cache.token}`}
            ])
            i++
        }
        this.cache.keyboard.push([
            {text:'Cancel', callback_data:`${this.prefix}-onSelectTask-c@${this.cache.token}`}
        ])
        
        return onStartMessage(this.cache.userID, this.cache.keyboard, type)
    }

    onSelectTask(args){
        const [idx, token] = args.split('@')
        if(token!==this.cache.token) return
        if(idx==='c') return onCancelMessage(this.cache.userID, this.prefix, this.cache.token)

        this.cache.selectedTask=this.tasks[idx].name
        return onSelectedTaskMessage(this.cache.userID, this.cache.prefix, this.cache.selectedTask)
    }

    onTypeListen(context){
        const {from, text} = context
        if(text==="CANCEL"){
            return onCancelMessage2(this.cache.userID, this.prefix, this.cache.token)
        }
        if(text==="SAVE"){
            this.cache['payload']=[]
            let problems=""
            let i=1
            for(let problem of this.cache.problems){
                problems+=`${i}. ${problem}\n`
                i++
                this.cache.payload.push({
                    taskName:this.cache.selectedTask,
                    problem,
                    userID:this.cache.userID
                })
            }
            return onSaveMessage(this.cache.userID, this.cache.prefix, this.cache.selectedTask, problems, this.cache.token)
        }
        this.cache.problems.push(text)
        return typeListenMessage(this.cache.userID, this.cache.prefix, text)
    }

    onSure(args){
        console.log('masuk')
        const [ans, token]=args.split('@')
        console.log(ans, token)
        if(token!==this.cache.token) return
        if(ans==='N'){
            return onCancelMessage(this.cache.userID, this.prefix, this.cache.token)
        }
        addProblems(this.cache.payload)
        return onAdded(this.cache.userID, this.prefix, this.cache.token)
        
    }

    onClose(args){
        const [token, ans] = args.split('@')
        if(token===this.cache.token){
            if(ans==='Y'){
                return this.onStart('Edit')
            }
            return{
                type:'Delete',
                id:this.cache.userID,
                destroy:true,
                prefix:this.prefix
            }
        }
    }
}

module.exports={InsertProblems}