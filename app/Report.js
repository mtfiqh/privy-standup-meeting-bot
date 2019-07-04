const { App } = require('../core/App')
const { dictionary } = require('./Report.config')
const { updateTaskStatus } = require('./DataTransaction')

class Report extends App {
    /**
     * Report Constructor
     * @param {Project} projects 
     * @param {Number} id 
     * @param {string} name 
     * @param {InlineKeyboardButton} inlineKeyboard 
     */
    constructor(projects, id, name, inlineKeyboard) {
        super()
        if (inlineKeyboard === undefined) {
            throw new Error(`${Report.name}.inlineKeyboard is undefined!`)
        }
        this.prefix = `${Report.name}@${id}`
        this.projects = projects
        this.id = id
        this.name = name
        this.doneTask = []
        this.taskSelected = new Set([])
        this.inlineKeyboard = inlineKeyboard
        this.register([
            this.select,
            this.send,
            this.cancel
        ])
    }

    /**
     * Toggle Icon Check On Inline Keyboard Button
     * @param {Number} index 
     * @return InlineKeyboardButton
     */
    toggleCheckIcon(index) {
        const checkIcon = '️️✔️'
        const pressedKeyboard = this.inlineKeyboard[index][0]
        let { text } = pressedKeyboard
        text = text.includes(checkIcon) ? text.substr(checkIcon.length) : checkIcon + text
        pressedKeyboard.text = text
        this.inlineKeyboard[index][0] = pressedKeyboard
        return this.inlineKeyboard
    }

    /**
     * Toggle Selected Task
     * @param {string} projectId 
     * @param {string} taskId 
     */
    toggleTask(projectId, taskId) {
        const item = projectId + "::" + taskId
        if (this.taskSelected.has(item)) {
            this.taskSelected.delete(item)
        } else {
            this.taskSelected.add(item)
        }
    }

    /**
     * On Select Inline Keyboard Button
     * @param {any} address - address of Report.cache
     */
    select(address) {
        const indexOfpressedKeyboard = parseInt(address.split('@').pop())
        const { projectId, taskId } = this.cache[this.prefix][address]
        const { options, message } = { ...dictionary.select.success }

        this.toggleTask(projectId, taskId)
        options["reply_markup"] = {
            inline_keyboard: this.toggleCheckIcon(indexOfpressedKeyboard)
        }

        return {
            message: `Halo ${this.name}, ${message}`,
            options: options,
            deleteLast: true
        }
    }

    /**
     * On Report Progress. Update task status
     */
    send() {
        if (this.taskSelected.size == 0)
            return dictionary.send.failed
        for (let value of this.taskSelected) {
            const [projectId, taskId] = value.split("::")
            const task = this.projects[projectId].task[taskId]
            const { name } = task
            this.doneTask.push({
                projectId: projectId,
                taskId: taskId,
                userId: this.id,
                name: name,
                projectName: this.projects[projectId].name
            })
            // remove from projects state
            this.removeTaskFromProject(projectId, taskId)
        }
        // send
        const data = {}
        data[this.id] = [...this.doneTask]
        updateTaskStatus(data)
        this.clearDoneTask()
        this.cleanCache()
        return this.doneTaskToString(data[this.id])
    }

    /**
     * Make doneTask listing
     * @param {Array} done 
     */
    doneTaskToString(done) {
        let { options, message } = { ...dictionary.send.success }
        for (let task of done) message += `\n✔️ ${task.name} (*Done*)`
        return { message, options, deleteLast: true }
    }

    /**
     * canceling selecting task
     */
    cancel() {
        this.clearDoneTask()
        return { deleteLast: true }
    }

    /**
     * clean cache
     */
    cleanCache() {
        delete this.cache[this.prefix]
    }

    /**
     * clean done task
     */
    clearDoneTask() {
        this.doneTask.splice(0, this.doneTask.length)
        this.taskSelected.clear()
    }

    /**
     * Removing spesific task from this.projects
     * @param {} projectId 
     * @param {*} taskId 
     */
    removeTaskFromProject(projectId, taskId) {
        delete this.projects[projectId].task[taskId]
    }

}
module.exports = {
    Report
}