
const { App }                     = require('../core/App')
const { dictionary:dict }         = require('./Report.config')
const helper                      = require('./helper/helper')
const  db                         = require('./DataTransaction')

class Report extends App {

    constructor(projects, id, name, keyboard){
        if(keyboard===undefined)
            throw new Error(`${Report.name} should be defined!`)
        
        super()
        this.prefix     = `${Report.name}@${id}`
        this.id         = id
        this.name       = name
        this.keyboard   = keyboard
        this.projects   = projects

        // state
        this.selected   = new Set([])
        this.bucket     = []
        this.separator  = '::' // toggleSelectedTask

        this.register(["select","send","cancel"])
    }

    select(address){
        // address : item@index
        const pressedButtonPosition  = parseInt(address.split('@').pop())
        const { projectId, taskId }  = this.cache[this.prefix][address]
        const { options, message }   = { ...dict.select.success }

        options.reply_markup = {
            inline_keyboard : this.toggleSelectedTask(
                projectId, 
                taskId,
                pressedButtonPosition
            )
        }
        
        return {
            id: this.id,
            type :"Edit",
            message: `Halo *${this.name}*, ${message}`,
            options:  options
        }
    }

    send(){
        if(this.selected.size==0) 
            return {
                destroy:true,
                id:this.id,
                type: "Edit",
                ...dict.send.failed
            }

        const dataTosend = {}
        for(let item of this.selected){
            const [projectId, taskId] = item.split(this.separator)
            const task = this.projects[projectId].task[taskId]
            this.bucket.push({
                projectName : this.projects[projectId].name,
                name : task.name,
                userId : this.id,
                projectId,
                taskId
            })
            delete this.projects[projectId].task[taskId]
        }
        
        // Mark tasks as done=
        dataTosend[this.id]=[...this.bucket]
        db.updateTaskStatus(dataTosend)

        // cleaning temp
        this.bucket.splice(0, this.bucket.length)
        this.selected.clear()
        delete this.cache[this.prefix]

        // response
        const {message, options} = dict.send.success
        return {
            destroy:true,
            id:this.id,
            type: "Edit",
            message : helper.selectedButtonToString(dataTosend[this.id],"Done",message),
            options
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

}


module.exports ={
    Report
}
