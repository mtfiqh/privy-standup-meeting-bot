const {addTaskTransaction,getProjects, getUsersData} = require("./DataTransaction")
const {App} = require('../core/App')

class AssignTasks extends App{
    constructor(bot){
        super()
        this.bot=bot

        this.register([
            this.onInsertTasks,
            this.onCallback,
            this.onInsertPriority,
            this.onInsertProject,
            this.onSelectUser,
            this.onMakeSure
        ])
    }

    reset(userID){
        delete this.cache[userID]
    }
    
    onCallback(args){
        let [userID, first_name]=args.split('@')
        userID=parseInt(userID)
        console.log(userID, "assignTasks- on Callback", args)
        this.addCache(userID, {
            name:first_name, 
            session:"onInsertTasks",
            tasks:[],
            priority:[],
            projects:[],
            to:{},
            token:Math.random().toString(20).substr(2,8)
        })
        console.log(userID, "assignTasks - cache created", this.cache[userID])
        this.bot.sendMessage(userID, `<a href='tg://user?id=${userID}'>${first_name}</a>, silahkan masukkan nama task yang akan di assign!`,this.messageOption("cancel"))
        console.log("membuat cache baru",userID)
    }

    onInsertTasks(args){
        const {from, text} = args
        const {id:userID, first_name:name} = from
        if(this.cache[userID]){
            if(this.cache[userID].session==="onInsertTasks"){
                console.log(userID, "assignTasks-onInsertTasks")
                if(text==="SAVE"){
                    this.bot.sendMessage(userID, `Tunggu sebentar...`, this.messageOption()).then(e=>{
                        
                        console.log(userID, "assignTasks-SaveAction")
                        // get user projects
                        getProjects("In Progress").then(projects=>{
                            if(projects.size<1){
                                this.bot.sendMessage(userID, `Mohon maaf, saat ini sedang tidak ada project yang berlangsung`, this.messageOption())
                                this.reset(userID)
                            }else{
                                projects.add('CANCEL')
                                this.cache[userID].projects=projects
                                projects=[]
                                for(let project of this.cache[userID].projects){
                                    projects.push([project])
                                }
                                this.bot.sendMessage(userID, `Task akan di tambahkan untuk project apa?`, this.messageOption("project", projects))
                                this.cache[userID].session="onInsertProject"
                            }
                        })
                    })
                    
                }else if(text==="CANCEL"){
                    console.log(userID, "assignTasks-CancelAction")
                    this.bot.sendMessage(userID, `<a href='tg://user?id=${userID}'>${from.first_name}</a>, permintaan anda sudah dibatalkan!`,this.messageOption())
                    this.reset(userID)
                }else{
                    this.cache[userID].tasks.push(text)
                    this.bot.sendMessage(userID, `<a href='tg://user?id=${userID}'>${from.first_name}</a>, pilih priority untuk task <b>${text}</b>`,this.messageOption('priority'))
                    console.log(userID, "assignTasks-insertTask ", text)
                    this.cache[userID].session="onInsertPriority"        
                }
            }
        }else{
            this.onCallback(userID+'@'+name)
        }
    }

    onInsertPriority(args){
        const {from, text}=args
        if(this.cache[from.id]){
            if(this.cache[from.id].session==="onInsertPriority"){
                if(text==="CANCEL"){
                    console.log(from.id, "assignTasks - CancelAction")
                    this.bot.sendMessage(from.id, `<a href='tg://user?id=${from.id}'>${from.first_name}</a>, permintaan anda sudah dibatalkan!`,this.messageOption())
                    this.reset(from.id)
                }else if(text==="HIGH"){
                    this.cache[from.id].session="onInsertTasks"
                    this.bot.sendMessage(from.id, "priority ditetapkan "+text, this.messageOption("save-cancel"))
                    this.cache[from.id].priority.push(text)
                    console.log(from.id, "assignTasks - priority "+text+" selected")
                }else if(text==="MEDIUM"){
                    this.cache[from.id].session="onInsertTasks"
                    this.bot.sendMessage(from.id, "priority ditetapkan "+text, this.messageOption("save-cancel"))
                    this.cache[from.id].priority.push(text)
                    console.log(from.id, "assignTasks - priority "+text+" selected")
                    
                }else if(text==="LOW"){
                    this.cache[from.id].session="onInsertTasks"
                    this.bot.sendMessage(from.id, "priority ditetapkan "+text, this.messageOption("save-cancel"))
                    this.cache[from.id].priority.push(text)
                    console.log(from.id, "assignTasks - priority "+text+" selected")
                }
            }else{

            }
        }
    }

    onInsertProject(args){
        const {from, text} = args
        console.log(from.id, 'assignTasks-Insert Project')
        if(this.cache[from.id]){
            if(this.cache[from.id].session==="onInsertProject"){
                console.log('text', text)
                console.log('data', this.cache[from.id].projects)
                if(text==="CANCEL"){
                    console.log(from.id, "assignTasks-CancelAction")
                    this.bot.sendMessage(from.id, `<a href='tg://user?id=${from.id}'>${from.first_name}</a>, permintaan anda sudah dibatalkan!`,this.messageOption())
                    this.reset(from.id)
                }else if((this.cache[from.id].projects).has(text)){
                    //pilih user
                    this.cache[from.id].projects=text
                    this.bot.sendMessage(from.id, "Sedang di proses, mohon tunggu sebentar...", this.messageOption()).then(()=>{
                        console.log(from.id, "assignTasks-get All Users Data")
                        getUsersData('all').then(users=>{
                            if(users.length<1){
                                console.error(from.id, "assignTasks, users kosong")
                            }
                            let opts=[]
                            for(let user of users){
                                opts.push([{
                                    text:user.name,
                                    callback_data:'assignTasks-onSelectUser-'+from.id+'@'+user.userID+'@'+this.cache[from.id].token
                                }])
                                this.cache[from.id].to[user.userID]=user.name
                            }
                            console.log(opts)
                            this.bot.sendMessage(from.id, 'silahkan pilih user yang akan di assign Tasks nya', this.messageOption("taskButton", opts))
                        })
                        this.cache[from.id].session="onSelectUser"
                    })
                }else{
                    this.bot.sendMessage(from.id,`Maaf, nama project tidak sesuai, pilih lagi ya`)
                }
            }else{
    
            }

        }
    }

    onSelectUser(args){
        const [userID, toUserID, token] = args.split('@')
        if(this.cache[userID] && this.cache[userID].session==="onSelectUser"){
            if(token===this.cache[userID].token){
                this.cache[userID].to={
                    userID:toUserID,
                    name:this.cache[userID].to[toUserID]
                }
                console.log('onSelectUser', args)
                let tempText="text akan disimpan ke dalam project"+"<b>"+this.cache[userID].projects+"</b>, berikut daftar task(s) nya:\n"
                let i=1
                let j=0
                for(let task of this.cache[userID].tasks){
                    tempText=tempText+i+'. '+task+'['+this.cache[userID].priority[j]+']\n'
                    i++
                    j++
                }
                tempText=tempText+"\n Tasks akan di assign ke <b>"+this.cache[userID].to.name+"</b> apakah kamu yakin?"
                this.cache[userID].session="onMakeSure"
                this.bot.sendMessage(userID, `${tempText}`, this.messageOption("save-cancel"))

            }else{
                console.error(userID, "assignTasks - onSelectUser, token is invalid")
            }
        }
    }


    onMakeSure(args){
        const {from,text}=args
        if(this.cache[from.id]){
            if(this.cache[from.id].session==="onMakeSure"){
                if(text==="CANCEL"){
                    console.log(from.id, "assignTasks-CancelAction")
                    this.bot.sendMessage(from.id, `<a href='tg://user?id=${from.id}'>${from.first_name}</a>, permintaan anda sudah dibatalkan!`,this.messageOption())
                    this.reset(from.id)
                }else if(text==="SAVE"){
                    console.log(from.id, "assignTasks-saveAction to firebase")
                    let tasks=[]
                    let i=0
                    for(let task of this.cache[from.id].tasks){
                        tasks.push({
                            name:task,
                            userID:parseInt(this.cache[from.id].to.userID),
                            projectName:this.cache[from.id].projects,
                            status:'In Progress',
                            priority:this.cache[from.id].priority[i]
                        })
                        i++
                    }
                    console.log(from.id, 'data to push to firebase: ', tasks)
                    addTaskTransaction(tasks).then(()=>{
                        this.bot.sendMessage(from.id, `Tasks berhasil ditambahkan sebagai in progress untuk ${this.cache[from.id].to.name}`, this.messageOption())
                        let tempText="di dalam project "+this.cache[from.id].projects+"berikut daftar task(s) nya:\n"
                        let i=1
                        let j=0
                        for(let task of this.cache[from.id].tasks){
                            tempText=tempText+i+'. '+task+'['+this.cache[from.id].priority[j]+']\n'
                            i++
                            j++
                        }
                        this.bot.sendMessage(this.cache[from.id].to.userID, `Kamu mendapatkan tasks dari <b>${this.cache[from.id].name}</b> ${tempText}`)

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

module.exports={AssignTasks}