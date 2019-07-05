
const { App } = require('../core/App')
const { getUsersData, takeOverTask} = require('./DataTransaction')
const { 
    generateInlineButtonForUser, 
    selectedButtonToString,
    toggleCheck 
} =  require('./helper/helper')

dictionary = {
    send:{
        success:{
            message: "Berikut Task anda yang sudah Yang di *Offer*.",
            options:{ "parse_mode": "Markdown"}
        },
        failed:{
            message: "*Mohon Maaf!*, Anda Harus memilih task.",
            options:{ "parse_mode": "Markdown"},
            deleteLast:true
        }
    },
    select:{
        success:{
            message:`berikut task anda yang masih *In Progress*, silahkan di klik untuk task yang sudah *Done*`,
            options:{
                "parse_mode": "Markdown"
            }
        }
    }
}

class TakeOfferTask extends App {

    constructor(projects,id, name, inlineKeyboard){
        super()
        this.prefix = `${TakeOfferTask.name}@${id}`
        this.projects = projects
        this.id = id
        this.name = name
        this.inlineKeyboard = inlineKeyboard
        this.usersKeyboard = null
        this.taskSelected = new Set([])
        this.processed = []
        this.prev = null
        this.friend = null
        this.register([
            this.select,
            this.process,
            this.selectUser,
            this.offer,
            this.respondNo,
            this.respondYes,
            this.cancel
        ])

    }

    toggleCheckIcon(index) {
        const text = this.inlineKeyboard[index][0].text
        this.inlineKeyboard[index][0].text = toggleCheck(text)
        return this.inlineKeyboard
    }

    toggleCheckIconUser(index) {
        if(this.prev!==null || this.prev==index){
            const text = this.usersKeyboard[this.prev][0].text
            this.usersKeyboard[this.prev][0].text = toggleCheck(text)
        }
        const text = this.usersKeyboard[index][0].text
        this.usersKeyboard[index][0].text = toggleCheck(text)
        this.prev = index
        return this.usersKeyboard
    }

    toggleTask(projectId, taskId) {
        const item = projectId + "::" + taskId
        if (this.taskSelected.has(item)) {
            this.taskSelected.delete(item)
        } else {
            this.taskSelected.add(item)
        }
    }

    toggleUser(userId){
        if(this.friend!==userId){
            this.friend = userId
        }
        console.log('frinedID', this.friend)
    }

    select(address){
        const indexOfpressedKeyboard = parseInt(address.split('@').pop())
        const { projectId, taskId } = this.cache[this.prefix][address]
        const { options, message } = { ...dictionary.select.success }

        this.toggleTask(projectId, taskId)
        options["reply_markup"] = {
            inline_keyboard: this.toggleCheckIcon(indexOfpressedKeyboard, )
        }

        return {
            message: `Halo ${this.name}, ${message}`,
            options: options,
            deleteLast: true
        }
        
    }

    selectUser(address){
        const [friendId ,index] = address.split('@')
        const indexOfpressedKeyboard = parseInt(index)
        this.toggleUser(friendId)
        // const { projectId, taskId } = this.cache[this.prefix][address]
        const { options } = { ...dictionary.select.success }
        options["reply_markup"] = {
            inline_keyboard: this.toggleCheckIconUser(indexOfpressedKeyboard)
        }

        return {
            message: this.cache["messageOnUserSelection"],
            options: options,
            deleteLast: true
        }
    }

    async process(){
        await this.setUserKeyboard().then(this.setTaskToOffer.bind(this))
        if(this.processed.length==0) return {...dictionary.send.failed}
        const { options, message } = {...dictionary.send.success}
        if(this.usersKeyboard==null) throw new Error("User Keyboard belum di set")

        options["reply_markup"] = { inline_keyboard: this.usersKeyboard}
        this.cache["messageOnUserSelection"] = `Halo ${this.name}, ${
            selectedButtonToString(this.processed ,"Selected",message)
        }`
        
        return {
            message: this.cache["messageOnUserSelection"],
            options: options,
            deleteLast: true
        }
    }

    cancel(){
        return {
            deleteLast:true
        }
    }

    offer(){
        if(this.friend==null) throw new Error("Select Friend first!")
        const dataOffer = []
        this.processed.forEach(item => {
            dataOffer.push({
                ...item,
                receiverId:parseInt(this.friend)
            })
        })

        this.processed = dataOffer

        let message = `Halo teman anda ${this.name} melakukan *offer* task berikut. Apakah Anda setuju?`
        message = selectedButtonToString(dataOffer,"Waiting",message)

        return {
            receiver:{
                id: this.friend,
                message : message,
                options:{
                    "parse_mode": "Markdown",
                    "reply_markup": {
                        "inline_keyboard": [
                            [
                                { text: "Yes", callback_data: `${this.prefix}-respondYes` },
                                { text: "No", callback_data :   `${this.prefix}-respondNo` }
                            ],
                        ]
                    }
                }
            },
            sender:{
                id: this.id,
                message: "Menunggu Konfirmasi Dari Teman Anda.",
                options:{
                    "parse_mode": "Markdown"
                },
                deleteLast:true
            }
            
        }
        
    }

    async setUserKeyboard(){
        const getUsersKeyboard =  function (users){
            this.usersKeyboard = generateInlineButtonForUser(
                users, 
                this.prefix, 
                new Set([this.id])
            )
        }
        await getUsersData('all').then(getUsersKeyboard.bind(this))
    }

    respondYes(){
        const friend = this.friend
        let r_message = "*Terimakasih!* Task berhasil ditambahkan ke progress Anda."
        let s_message = "*Selamat!*, Permintaan Anda diterima. Berikut Task anda yang berhasil di *Offer* :"
        if(this.friend==null)  return 
        s_message += selectedButtonToString(this.processed, "transfered")
        takeOverTask(this.processed)
        this.friend = null
        this.taskSelected.clear()
        delete this.cache[this.prefix]
        
        return {
            receiver:{
                id: friend,
                message : r_message,
                options:{
                    "parse_mode": "Markdown"
                },
                deleteLast:true
            },
            sender:{
                id: this.id,
                message: s_message,
                options:{
                    "parse_mode": "Markdown"
                }
            }
            
        }
        
    }

    respondNo(){
        const friend = this.friend
        let r_message = "*Terimakasih!* Task tidak ditambahkan ke progress Anda."
        let s_message = "*Mohon Maaf!*, Permintaan Anda ditolak."

        this.friend = null
        this.taskSelected.clear()
        delete this.cache[this.prefix]
        
        return {
            receiver:{
                id: friend,
                message : r_message,
                options:{
                    "parse_mode": "Markdown"
                },
                deleteLast:true
            },
            sender:{
                id: this.id,
                message: s_message,
                options:{
                    "parse_mode": "Markdown"
                }
            }
            
        }
    }

    setTaskToOffer(){
        for (let value of this.taskSelected) {
            const [projectId, taskId] = value.split("::")
            const task = this.projects[projectId].task[taskId]
            this.processed.push({
                senderId: this.id,
                taskId: taskId,
                name: task.name
            })
        }
    }

}

module.exports = {
    TakeOfferTask
}