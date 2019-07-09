

const { App }                     = require('../core/App')
const { dictionary:dict }         = require('./TakeOfferTask.config')
const helper                      = require('./helper/helper')
const  db                         = require('./DataTransaction')

class TakeOfferTask extends App {
    constructor(projects, id, name, keyboard){
        if(keyboard===undefined)
            throw new Error(`${Report.name} should be defined!`)
        
        super()
        this.prefix     = `${TakeOfferTask.name}@${id}`
        this.id         = id
        this.name       = name
        this.keyboard   = keyboard
        this.projects   = projects

        // state
        this.selected   = new Set([])
        this.bucket     = []
        this.separator  = '::' // toggleSelectedTask

        this.userKeyboard = null
        this.prevFriend   = null
        this.friend       = null

        this.register([
            'select', 
            'cancel',
            'process',
            'offer',
            'selectUser',
            "respondYes",
            "respondNo"
        ])
    }

    select(address){
        // address : item@index
        const pressedButtonPosition  = parseInt(address.split('@').pop())
        const { projectId, taskId }  = this.cache[this.prefix][address]
        const keyboard = this.toggleSelectedTask(
            projectId, 
            taskId,
            pressedButtonPosition
        )
        return {
            id: this.id,
            type :"Edit",
            message: dict.select.success.getMessage(this.name),
            options: dict.select.success.getOptions(keyboard)
        }
    }

    cancel(){
        this.selected.clear()
        this.bucket.splice(0, this.bucket.length)
        return {
            destroy:true,
            id:this.id,
            type:"Delete"
        }
    }

    async process(){
        await this.setUserKeyboard().then(this.prepareTaskForOffer.bind(this))
        if(this.userKeyboard==null) throw new Error("User keyboard is null on 'process'!")

        if(this.bucket.length==0) return {
            id: this.id,
            type: "Edit",
            destroy:false,
            message: dict.process.failed.getMessage(),
            options:dict.process.failed.getOptions()
        }

        const taskList = helper.selectedButtonToString(this.bucket, 'Selected')
        this.cache['messageOnProcess'] = {
            message: dict.process.success.getMessage(this.name, taskList),
            options: dict.process.success.getOptions(this.userKeyboard)
        }

        return {
            id:this.id,
            type:"Edit",
            destroy: false,
            ...this.cache["messageOnProcess"]
        }


    }

    selectUser(address){
        const [friendId, index] = address.split('@')
        const indexOfPressedKeyboard = parseInt(index)
        this.toggleUser(friendId)
        const keyboard = this.toggleCheckIconUser(indexOfPressedKeyboard)
        return{
            id:this.id,
            type:"Edit",
            destroy:false,
            message: this.cache["messageOnProcess"].message,
            options: dict.select.success.getOptions(keyboard)
        }
    }

    offer(){
        
        if(this.friend==null) return  {
            id:this.id,
            type:"Edit",
            destroy: false,
            message: dict.offer.failed.getMessage(this.cache["messageOnProcess"].message),
            options: this.cache["messageOnProcess"].options
        }

        let dataOffer = []
        this.bucket.forEach(item => {
            dataOffer.push({
                ...item,
                receiverId: parseInt(this.friend)
            })
        })

        this.bucket = dataOffer
        dataOffer = undefined
        const taskList =helper.selectedButtonToString(this.bucket,"waiting")

        console.log("Waiting Task", taskList)
        return {
            type:"Confirm",
            receiver:{
                id:this.friend,
                message :dict.offer.receiver.getMessage(this.name, taskList),
                options :dict.offer.receiver.getOptions(this.prefix)
            },
            sender:{
                id:this.id,
                type: "Edit",
                message: dict.offer.sender.getMessage(),
                options:dict.offer.sender.getOptions()
            }
        }

    }

    respondNo(){
        const friend = this.friend
        this.friend = null
        this.selected.clear()
        delete this.cache[this.prefix]

        return {
            type:"Confirm",
            destroy:true,
            receiver:{
                id:friend,
                type:"Edit",
                message: dict.respondNo.receiver.getMessage(),
                options: dict.respondNo.receiver.getOptions()
            },
            sender:{
                id:this.id,
                type: "Send",
                message: dict.respondNo.sender.getMessage(),
                options:dict.respondNo.sender.getOptions()
            }
        }



    }

    respondYes(){
        console.log("Respond Yes")
        if(this.friend==null) return
        const friend = this.friend
        const taskList = helper.selectedButtonToString(this.bucket, "transfered")
        
        db.takeOverTask(this.bucket)
        
        this.friend = null
        this.selected.clear()
        delete this.cache[this.prefix]

        console.log(taskList)
        return {
            type:"Confirm",
            destroy:true,
            receiver:{
                id:friend,
                type:"Edit",
                message: dict.respondYes.receiver.getMessage(taskList),
                options: dict.respondYes.receiver.getOptions()
            },
            sender:{
                id:this.id,
                type:"Send",
                message: dict.respondYes.sender.getMessage(taskList),
                options:dict.respondYes.sender.getOptions()
            }
        }


    }

    async setUserKeyboard(){
        const getUserKeyboard = function(users){
            this.userKeyboard = helper.generateInlineButtonForUser(
                users,
                this.prefix,
                new Set([this.id])
            )
        }
        await db.getUsersData('all').then(getUserKeyboard.bind(this))
    }

    prepareTaskForOffer(){
        for(let item of this.selected){
            const [projectId, taskId] = item.split(this.separator)
            const task = this.projects[projectId].task[taskId]
            this.bucket.push({
                senderId: this.id,
                taskId:taskId,
                name:task.name
            })
        }
    }

    toggleCheckIcon(position){
        const text = this.keyboard[position][0].text
        this.keyboard[position][0].text = helper.toggleCheck(text)
        return this.keyboard
        
    }

    toggleSelectedTask(projectId, taskId, position){
        const item = `${projectId}${this.separator}${taskId}`
        if(this.selected.has(item))
            this.selected.delete(item)
        else
            this.selected.add(item)
        return this.toggleCheckIcon(position)
    }

    toggleCheckIconUser(postion){
        if(this.prevFriend!=null || this.prevFriend==postion){
            const text = this.userKeyboard[this.prevFriend][0].text
            this.userKeyboard[this.prevFriend][0].text = helper.toggleCheck(text)
        }
        const text = this.userKeyboard[postion][0].text
        this.userKeyboard[postion][0].text = helper.toggleCheck(text)
        this.prevFriend = postion
        return this.userKeyboard
    }

    toggleUser(userId){
        if(this.friend!=userId){
            this.friend = userId
        }
        console.log("Friend Selected", userId)
    }
}


module.exports = {
    TakeOfferTask
}