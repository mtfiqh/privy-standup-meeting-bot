/**
 * Generate inline keyboard for reply_markup 
 * ------------------------------------------
 * report format =  {
 *      userId :{
 *          projectId:{
 *              name : string,
 *              task : {
 *                  taskId : {
 *                      name: string,
 *                      status: string,
 *                      time: Date
 *                  }
 *              }
 *          }
 *      }
 * }
 * --------------------------------------------
 * retrun format = [
 *  [
 *    {
 *      text: "keyboard name",
 *      callback_data:"{
 *          "projectId": "projectId",
 *          "taskId": "taskId"
 *      }"
 *    }
 *  ]
 * ]
 * 
 * @param {Object} report 
 * @param {string} userId 
 * @param {string} salt - unique code generated by each new message
 * @returns {Array2D} 
 */
function generateInlineKeyboardFrom(projects, prefix, trueAction="Send", falseAction="Cancel") {
    const inlineKeyboard = []
    const addrs  = {}
    let counter = 0
    for (projectId of Object.keys(projects)) {
        const tasks = projects[projectId].task
        for (taskId of Object.keys(tasks)) {
            let addr = 'item@'+counter
            const keyboardLayout = {
                text: tasks[taskId].name,
                callback_data: `${prefix}-select-${addr}`
            }
            inlineKeyboard.push([keyboardLayout])
            addrs[addr] = {
                projectId,
                taskId
            }
            counter+=1
        }
    }
    inlineKeyboard.push([{
        text: trueAction,
        callback_data: `${prefix}-${trueAction.toLocaleLowerCase()}`
    }, {
        text: falseAction,
        callback_data: `${prefix}-${falseAction.toLocaleLowerCase()}`
    }])
    return {inlineKeyboard,addrs}
}

/**
 * Report input Format :
 * --------------------------------
 * [{
 *  userID:string,
 *  projectID : string,
 *  status: string,
 *  name: string,
 *  projectName : string,
 *  date : Date,
 *  taskId: string
 * }]
 * ---------------------------------
 * return format =  {
 *      userId :{
 *          projectId:{
 *              name : string,
 *              task : {
 *                  taskId : {
 *                      name: string,
 *                      status: string,
 *                      time: Date
 *                  }
 *              }
 *          }
 *      }
 * }
 * 
 * @param {Array} report 
 * @return {Object} 
 */
function parseToReportFormat(report) {
    const result = {}
    for (let item of report) {
        const { projectID, status, name, projectName, date, taskID, userID } = item
        if(result[userID]===undefined){
            result[userID] = {}
        }
        if(result[userID][projectID]===undefined){
            result[userID][projectID] = {
                name: projectName,
                task: {}
            }
        }
        result[userID][projectID].task[taskID] = {
            name: name,
            status: status,
            time: date
        }
    }
    return result
}

function generateToken(str, salt){
    return Math.random().toString(10).slice(2,6) + `${str}${salt}`
}

function generateInlineButtonForUser(users,prefix,exclude=new Set([])){
    const inlineKeyboard = []
    let counter = 0
    for(let user of users){
        const {userID, name} = user
        let addr = userID+'@'+counter
        if(!exclude.has(userID)){
            inlineKeyboard.push([{
                text:name,
                callback_data: `${prefix}-selectUser-${addr}`
            }])
            counter+=1
        }
    }
    inlineKeyboard.push([{
        text: "Offer",
        callback_data: `${prefix}-offer`
    }, {
        text: "Cancel",
        callback_data: `${prefix}-cancel`
    }])
    return inlineKeyboard
}

function generateTaskToOffer(users,prefix,exclude=new Set([])){
    const inlineKeyboard = []
    const addrs  = {}
    let counter = 0
    for(let user of users){
        const {userID, name} = user
        if(!exclude.has(userID)){
            inlineKeyboard.push([{
                text:name,
                callback_data: `${prefix}-selectUser-${addr}`
            }])
            counter+=1
        }
        addrs
    }
    inlineKeyboard.push([{
        text: "Offer",
        callback_data: `${prefix}-offer`
    }, {
        text: "Cancel",
        callback_data: `${prefix}-cancel`
    }])
    return inlineKeyboard
}

function selectedButtonToString(selected, mark, prefix="") {
    for (let item of selected) prefix += `\n✔️ ${item.name} (*${mark}*)`
    return prefix
}

function toggleCheck(text){
    const checkIcon = '️️✔️'
    return text.includes(checkIcon) ? text.substr(checkIcon.length) : checkIcon + text
}


module.exports = {
    generateInlineKeyboardFrom,
    parseToReportFormat,
    generateToken,
    generateInlineButtonForUser,
    toggleCheck,
    selectedButtonToString
}


