const {addTaskTransaction} = require("./dataTransaction.js")
let project
class ReportInProgress {

    constructor() {
        this.tasks={}
        this.session = {}
        this.progress={}
        this.priority={}
    }
    reset(uid){
        try{
            delete this.tasks[uid]
            delete this.session[uid]
            delete this.progress[uid]
            delete this.priority[uid]

        }catch(e){
            console.log("function reset - reportInProgress.js")
            console.log(e)
        }
    }
    saveProgress(uid, text, bot){
        try{

            if(this.session[uid]==="add task"){
                this.progress[uid].push(text)
                this.session[uid]="add task priority"
                bot.sendMessage(uid, "Sekarang pilih priority dari task "+text, this.messageOption("fourth"))
                console.log(this.progress)
            }else if(this.session[uid]==="add task priority"){
                if(text==="HIGH"){
                    this.session[uid]="add task"
                    bot.sendMessage(uid, "priority ditetapkan "+text, this.messageOption("second"))
                    this.priority[uid].push(text)
                }else if(text==="MEDIUM"){
                    this.session[uid]="add task"
                    bot.sendMessage(uid, "priority ditetapkan "+text, this.messageOption("second"))
                    this.priority[uid].push(text)
                    
                }else if(text==="LOW"){
                    this.session[uid]="add task"
                    bot.sendMessage(uid, "priority ditetapkan "+text, this.messageOption("second"))                    
                    this.priority[uid].push(text)
                }else{

                }
            }else{
                console.log("User belum berada di session add task")
            }
        }catch(e){
            console.log("function saveProgress - reportInProgress.js")
            console.log(e)
        }
    }

    chooseProject(uid, p, bot){
        try{
            this.session[uid]="choose project"
            let temp = []
            p.forEach(array =>{
                temp.push(array[0])
            })
            project = new Set(temp)
            let text = ""
            let i=1
            let j=0
            this.progress[uid].forEach(e =>{
                // let tempText=i.toString()
                text=text+i.toString()+'. '+e+" ["+this.priority[uid][j]+"]"+"\n"
                i++
                j++
            })
            bot.sendMessage(uid, "Berikut daftar tasks baru yang akan kamu simpan\n"+text)

        }catch(e){
                console.log("function chooseProject - reportInProgress.js")
                console.log(e)
        }
    }

    saveToTasks(uid, projectName, bot){
        // save to tasks
        // console.log(bot)
        try{
            if(project.has(projectName)){
                const {day, month, year} = getDate()
                for(let i of Object.keys(this.progress[uid])){
                    const temp = {
                        name: this.progress[uid][i],
                        userID: uid,
                        date : year+'-'+month+'-'+day,
                        projectName: projectName,
                        status:'In Progress',
                        priority:this.priority[uid][i]
                    }
        
                    this.tasks[uid].push(temp)
                }

                addTaskTransaction(this.tasks[uid], projectName)
                this.reset(uid)
                bot.sendMessage(uid, "Tasks mu berhasil disimpan!", this.messageOption())
            }else if(projectName==="CANCEL"){
                console.log("cancel")
                bot.sendMessage(uid, "Kamu membatalkan untuk melaporkan progress, yuk laporkan dulu", this.messageOption("first"))
                this.reset(uid)
            }else{
                console.log("ga sesuai")
    
                bot.sendMessage(uid, "Maaf, nama project nya ga sesuai nih dengan yangs sedang kamu kerjakan, pilih lagi ya!")
            }

        }catch(e){
            console.log("function saveToTasks - reportInProgress.js")
            console.log(e)
        }
    }

    addTask(uid){
        try{
            console.log(this.session)
            if(this.session[uid]!=="add task"){
                this.session[uid]="add task"
                this.progress[uid]=[]
                this.priority[uid]=[]
                if(this.tasks[uid]!==undefined){
                    this.tasks[uid]=[]
                    console.log("ga buat")
                }else{
                    console.log("buat")
                    this.tasks[uid]=[]
                }
            }

        }catch(e){
            console.log("function addTask - reportInProgress.js")
            console.log(e)
        }
    }

    messageOption(type, projectList){
        let opts={}
        if(type==="first"){
            opts = {
                parse_mode:'HTML',
                reply_markup: {
                    inline_keyboard:[
                        [ {text: '+ Add Task(s)', callback_data: 'addTask'} ],
                        [ {text: 'Tampilkan semua tasks', callback_data: 'showTask'}]
                    ]
                }
            }
        }else if(type==="second"){
            
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
        }else if(type==="third"){
            let temp=['CANCEL']
            // console.log(project)
            projectList.push(temp)
            opts= {
                parse_mode:'HTML',
                // reply_to_message_id: msg.message_id,
                reply_markup: JSON.stringify({
                    one_time_keyboard: true,
                    resize_keyboard:true,
                    keyboard: projectList,
                    // remove_keyboard:true,
                })
            }
        }else if(type==="fourth"){
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
        }else{
            opts= {
                reply_markup:{
                    remove_keyboard:true,
                }
            }
        }

        return opts
    }
}

const getDate = () => {
    const dateTime = require('node-datetime');
    const date = dateTime.create();

    return {
        day: date.format('d').toString(),
        month: date.format('m').toString(),
        year: date.format('Y').toString()
    }
}

module.exports = { ReportInProgress }