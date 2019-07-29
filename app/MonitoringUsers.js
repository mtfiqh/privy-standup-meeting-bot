const { App } = require('../core/App')
const { getUserTaskCountAndDayOff, getUsersData, getUserTasksOrderByPriority } = require('./DataTransaction')

class MonitoringUsers extends App{
    constructor(userID, name){
        super()
        this.register([
            'onStart',
            'onUsers'
        ])
        this.addCache('prefix', 'monitUsers')
        this.addCache('name', name)
        this.addCache('userID', userID)
        this.prefix=`monitUsers@${userID}`
        
    }

    async getUsers(){
        this.users = undefined
        const setUsers = (users)=>{
            this.users=users
        }
        await getUsersData('all').then(setUsers.bind(this))
        await this.getTasksCountandDayOff()
    }

    async getTasksCountandDayOff(){
        const set = (i, res)=>{ 
            this.users[i]['tasksCount'] = res.task
            this.users[i]['cuti'] = res.cuti
        }
        let i=0
        for(let user of this.users){
            await getUserTaskCountAndDayOff(user.userID).then(set.bind(this, i))
            i++
        }
    }


    async onStart(){
        await this.getUsers()
        let inline_keyboard=[]
        let i=0
        for(let user of this.users){
            inline_keyboard.push([
                {text:`${user.name} - ${user.tasksCount} tasks ${user.cuti ? '[CUTI]':''}`, callback_data:`${this.prefix}-onUsers-${i}`}
            ])
            i++
        }
        inline_keyboard.push([
            {text:'Refresh', callback_data:`${this.prefix}-onUsers-r`},
            {text:'Close', callback_data:`${this.prefix}-onUsers-c`}
        ])

        return{
            type:'Send',
            id:this.cache.userID,
            message:`Halo,${this.cache.name} berikut semua list users yang ada:\n`,
            options:{
                reply_markup:{
                    inline_keyboard
                }
            }
        }
    }

    async onUsers(idx){
        if(idx==='r'){
            //refresh and resend
            await this.getUsers()
            let inline_keyboard=[]
            let i=0
            for(let user of this.users){
                inline_keyboard.push([
                    {text:`${user.name} - ${user.tasksCount} tasks ${user.cuti ? '[CUTI]':''}`, callback_data:`${this.prefix}-onUsers-${i}`}
                ])
                i++
            }
            inline_keyboard.push([
                {text:'Refresh', callback_data:`${this.prefix}-onUsers-r`},
                {text:'Close', callback_data:`${this.prefix}-onUsers-c`}
            ])
            return{
                type:'Edit',
                id:this.cache.userID,
                message:`Refresh!\nHalo,${this.cache.name} berikut semua list users yang ada:\n`,
                options:{
                    reply_markup:{
                        inline_keyboard
                    }
                }
            }
        }

        if(idx==='c'){
            return{
                type:'Delete',
                id:this.cache.userID,
                destroy:true
            }
        }
        this.tasks=undefined
        const setTasks = (tasks)=>{
            this.tasks=tasks
        }
        let message=`${this.users[idx].name}, memiliki list tasks berikut:`
        await getUserTasksOrderByPriority(this.users[idx].userID).then(setTasks.bind(this))
        let i=1
        for(let task of this.tasks){
            let tempDate = task.date.toDate()
            let readableDate = tempDate.getDate()+'/'+(tempDate.getMonth()+1)+'/'+tempDate.getFullYear()
            message+=`\n<b>#${task.projectName}</b>\n${i}. ${task.name} [${task.priority}]\nDibuat pada: ${readableDate}\n`
            i++
        }
        return{
            type:'Edit',
            id:this.cache.userID,
            message,
            options:{
                parse_mode:'HTML',
                reply_markup:{
                    inline_keyboard:[
                        [
                            {text:`<< Back`, callback_data:`${this.prefix}-onUsers-r`},
                            {text:`Close`, callback_data:`${this.prefix}-onUsers-c`}
                        ]
                    ]
                }
            }
        }
    }
}

module.exports={MonitoringUsers}