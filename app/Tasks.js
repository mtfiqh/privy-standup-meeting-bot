const {addTaskTransaction, getUserProjects, isAdmin,getUserTasks} = require("./DataTransaction")
const {App} = require('../core/App')
/**
 * lookup begin with addTask-action-args
 * session:
 *      #onInsertTask
 *      #onInsertPriority
 *      #onInsertProject
 *      #onMakeSure
 *
 */

class Tasks extends App {
    constructor(bot){
        super()
        this.bot=bot
        this.register([
            this.reset,
            this.onInsertTask,
            this.onInsertPriority,
            this.onInsertProject,
            this.onMakeSure,
            this.showButton,
            this.onCallbackInsertTask,
            this.onShowTasks,
        ])
    }

    showButton(from){
        console.log(from.id, "show button tasks, checking is admin")
        this.bot.sendMessage(from.id,"Mohon Tunggu sebentar ya....", this.messageOption()).then(()=>{
            isAdmin(from.id).then(admin=>{
                let keyboard=[
                    [
                        {text:'+ Add Tasks', callback_data:"tasks-onCallbackInsertTask-"+from.id+"@"+from.first_name}, 
                        {text:'Show Tasks', callback_data:"tasks-onShowTasks-"+from.id}
                    ]
                ]
                if(admin){
    
                }
                this.bot.sendMessage(from.id, `Menu: Tasks`, this.messageOption("taskButton",keyboard))
            })

        })
    }

    reset(userID){
        delete this.cache[userID]
    }
    /**
     * 
     * @param {userID} args 
     */
    onShowTasks(args){
        this.bot.sendMessage(args, "tunggu sebentar ya, sedang mengumpulkan data mu", this.messageOption())
        args=parseInt(args)
        console.log(args, "on Show Tasks")
        getUserTasks(args).then(tasks=>{
            console.log(args, "parsing list of tasks, sort by project")
            let list={}
            for(let task of tasks){
                if(task.projectName in list){

                }else{
                    list[task.projectName]=[]
                }
                let tempDate = task.date.toDate()
                let readableDate = tempDate.getDate()+'/'+tempDate.getMonth()+'/'+tempDate.getFullYear()
                list[task.projectName].push({
                    name:task.name,
                    priority:task.priority,
                    date: readableDate//new Date(task.date._seconds)
                })
            }
            console.log(args, "parsing object to String of tasks")
            let text="Berikut List Tasks mu:\n\n"
            for(let l of Object.keys(list)){
                text=text+'<b>'+l+"</b>\n"
                let i =1
                for(let t of list[l]){
                    text=text+i+'. '+t.name+' ['+t.priority+']\n'+t.date+'\n\n'
                    i++
                }
                text=text+'\n\n'
            }
            // console.log(text)
            this.bot.sendMessage(args, `${text}`, this.messageOption())
        })
    }
    onCallbackInsertTask(args){
        let [userID, first_name]=args.split('@')
        userID=parseInt(userID)
        console.log(userID, "on Callback Insert Task", args)
        this.addCache(userID, {
            name:first_name, 
            session:"onInsertTask",
            tasks:[],
            priority:[],
            projects:{}
        })
        this.bot.sendMessage(userID, `<a href='tg://user?id=${userID}'>${first_name}</a>, silahkan masukkan nama tasknya!`,this.messageOption("cancel"))
        console.log("membuat cache baru",userID)
    }

    onInsertTask(args){
        const {from, text}=args
        if(this.cache[from.id]){
            if(this.cache[from.id].session==="onInsertTask"){
                console.log(from.id, "addTask-onInsertTask")
                if(text==="SAVE"){
                    this.bot.sendMessage(from.id, `Tunggu sebentar...`, this.messageOption()).then(e=>{
                        
                        console.log(from.id, "addTask-SaveAction")
                        // get user projects
                        getUserProjects(from.id).then(projects=>{
                            if(projects.length<1){
                                this.bot.sendMessage(from.id, `Mohon maaf, kamu tidak terkait dengan projects apapun, silahkan hubungi leader`, this.messageOption())
                                this.reset(from.id)
                            }else{
                                projects.push(['CANCEL'])
                                this.cache[from.id].projects=new Set([].concat(...projects))
                                this.bot.sendMessage(from.id, `Task akan di tambahkan untuk project apa?`, this.messageOption("project", projects))
                                this.cache[from.id].session="onInsertProject"
                            }
                        })
                    })
                    
                }else if(text==="CANCEL"){
                    console.log(from.id, "addTask-CancelAction")
                    this.bot.sendMessage(from.id, `<a href='tg://user?id=${from.id}'>${from.first_name}</a>, permintaan anda sudah dibatalkan!`,this.messageOption())
                    this.reset(from.id)
                }else{
                    this.cache[from.id].tasks.push(text)
                    this.bot.sendMessage(from.id, `<a href='tg://user?id=${from.id}'>${from.first_name}</a>, pilih priority untuk task <b>${text}</b>`,this.messageOption('priority'))
                    console.log(from.id, "addTask-insertTask ", text)
                    this.cache[from.id].session="onInsertPriority"        
                }
            }
        }else{
            this.cache[from.id]={
                name:from.first_name, 
                session:"onInsertTask",
                tasks:[],
                priority:[],
                projects:{}
            }
            this.bot.sendMessage(from.id, `<a href='tg://user?id=${from.id}'>${from.first_name}</a>, silahkan masukkan nama tasknya!`,this.messageOption("cancel"))
            console.log("membuat cache baru",from.id)
        }
        
    }

    onInsertPriority(args){
        const {from, text}=args
        if(this.cache[from.id]){
            if(this.cache[from.id].session==="onInsertPriority"){
                if(text==="CANCEL"){
                    console.log(from.id, "addTask-CancelAction")
                    this.bot.sendMessage(from.id, `<a href='tg://user?id=${from.id}'>${from.first_name}</a>, permintaan anda sudah dibatalkan!`,this.messageOption())
                    this.reset(from.id)
                }else if(text==="HIGH"){
                    this.cache[from.id].session="onInsertTask"
                    this.bot.sendMessage(from.id, "priority ditetapkan "+text, this.messageOption("save-cancel"))
                    this.cache[from.id].priority.push(text)
                    console.log(from.id, "priority "+text+" selected")
                }else if(text==="MEDIUM"){
                    this.cache[from.id].session="onInsertTask"
                    this.bot.sendMessage(from.id, "priority ditetapkan "+text, this.messageOption("save-cancel"))
                    this.cache[from.id].priority.push(text)
                    console.log(from.id, "priority "+text+" selected")
                    
                }else if(text==="LOW"){
                    this.cache[from.id].session="onInsertTask"
                    this.bot.sendMessage(from.id, "priority ditetapkan "+text, this.messageOption("save-cancel"))
                    this.cache[from.id].priority.push(text)
                    console.log(from.id, "priority "+text+" selected")
                }
            }else{

            }
        }
    }

    onInsertProject(args){
        const {from, text} = args
        if(this.cache[from.id]){
            if(this.cache[from.id].session==="onInsertProject"){
                console.log('text', text)
                console.log('data', this.cache[from.id].projects)
                if(text==="CANCEL"){
                    console.log(from.id, "addTask-CancelAction")
                    this.bot.sendMessage(from.id, `<a href='tg://user?id=${from.id}'>${from.first_name}</a>, permintaan anda sudah dibatalkan!`,this.messageOption())
                    this.reset(from.id)
                }else if((this.cache[from.id].projects).has(text)){
                    //make sure
                    let tempText="text akan disimpan ke dalam project"+"<b>"+text+"</b>, berikut daftar task(s) nya:\n"
                    this.cache[from.id].projects = text //mengubah dari projects cache dari kumpulan semua project ke 1 project yang dipilih
                    let i=1
                    let j=0
                    for(let task of this.cache[from.id].tasks){
                        tempText=tempText+i+'. '+task+'['+this.cache[from.id].priority[j]+']\n'
                        i++
                        j++
                    }
                    this.cache[from.id].session="onMakeSure"
                    this.bot.sendMessage(from.id, `${tempText}`, this.messageOption("save-cancel"))
                }else{
                    this.bot.sendMessage(from.id,`Maaf, nama project tidak sesuai, pilih lagi ya`)
                }
            }else{
    
            }

        }
    }

    onMakeSure(args){
        const {from,text}=args
        if(this.cache[from.id]){
            if(this.cache[from.id].session==="onMakeSure"){
                if(text==="CANCEL"){
                    console.log(from.id, "addTask-CancelAction")
                    this.bot.sendMessage(from.id, `<a href='tg://user?id=${from.id}'>${from.first_name}</a>, permintaan anda sudah dibatalkan!`,this.messageOption())
                    this.reset(from.id)
                }else if(text==="SAVE"){
                    console.log(from.id, "addTask-saveAction to firebase")
                    let tasks=[]
                    let i=0
                    for(let task of this.cache[from.id].tasks){
                        tasks.push({
                            name:task,
                            userID:from.id,
                            projectName:this.cache[from.id].projects,
                            status:'In Progress',
                            priority:this.cache[from.id].priority[i]
                        })
                        i++
                    }
                    console.log(from.id, 'data to push to firebase: ', tasks)
                    addTaskTransaction(tasks).then(()=>{
                        this.bot.sendMessage(from.id, `Tasks berhasil ditambahkan sebagai in progress`, this.messageOption())
                        this.reset(from.id)
                    })
                }

            }
        }
    }

    messageOption(type, projectList){
        let opts={}
        if(type==="save-cancel"){    
            opts= {
                // reply_to_message_id: msg.message_id,
                parse_mode: "HTML",
                reply_markup: JSON.stringify({
                    one_time_keyboard: true,
                    resize_keyboard:true,
                    keyboard: [
                        ["SAVE"],
                        ["CANCEL"]
                    ],
                    // remove_keyboard:true,
                })
            }
        }else if(type==="cancel"){
            opts= {
                // reply_to_message_id: msg.message_id,
                parse_mode: "HTML",
                reply_markup: JSON.stringify({
                    one_time_keyboard: true,
                    resize_keyboard:true,
                    keyboard: [
                        ["CANCEL"]
                    ],
                    // remove_keyboard:true,
                })
            }
        }else if(type==="priority"){
            opts= {
                // reply_to_message_id: msg.message_id,
                parse_mode: "HTML",
                reply_markup: JSON.stringify({
                    one_time_keyboard: true,
                    resize_keyboard:true,
                    keyboard: [
                        ["HIGH", "MEDIUM", "LOW"],
                        ["CANCEL"]
                    ],
                    // remove_keyboard:true,
                })
            }
        }else if(type==="taskButton"){
            opts= {
                // reply_to_message_id: msg.message_id,
                parse_mode: "HTML",
                reply_markup: JSON.stringify({
                    inline_keyboard: projectList,
                    // remove_keyboard:true,
                })
            }
        }else if(type==="project"){
            console.log(projectList)
            opts= {
                // reply_to_message_id: msg.message_id,
                parse_mode: "HTML",
                reply_markup: JSON.stringify({
                    one_time_keyboard: true,
                    resize_keyboard:true,
                    keyboard: projectList
                    // remove_keyboard:true,
                })
            }
        }else{
            opts= {
                parse_mode: "HTML",
                reply_markup:{
                    remove_keyboard:true,
                }
            }
        }

        return opts
    }

}

module.exports = {Tasks}