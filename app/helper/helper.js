/**
 * ------------------------------------------
 * Report {
 *      userId {
 *          projectId {
 *              name : string,
 *              task  {
 *                  taskId  {
 *                      name    : string,
 *                      status  : string,
 *                      time    : Date
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
 *      callback_data: "prefix-action-address"
 *    }
 *  ]
 * ]
 * 
 */

 /**
  * To generate "List Task" to InlineKeyboard reply_markup
  * @param {Project} projects       :user project
  * @param {string} prefix          :callback_data prefix
  * @param {string} trueAction      :callback_data and text label button resolve-action
  * @param {string} falseAction     :callback_data and text label button rekect-action
  */
function generateTasksKeyboard(projects, prefix, trueAction="Send", falseAction="Cancel") {
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

/**
 * To generate "List Users" to InlineKeyboard reply_markup
 * @param {Array} users         :Array of users
 * @param {string} prefix       :callback_data prefix
 * @param {Set} exclude         :exlcuded user(s)
 */
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


/**
 * Convert inline keyboard button to string
 * @param {Set} selected          :button set
 * @param {string} mark           :mark name
 * @param {string} prefix         :initial message
 */
function selectedButtonToString(selected, mark, prefix="") {
    for (let item of selected) prefix += `\n✔️ ${item.name} (*${mark}*)`
    return prefix
}

/**
 * Toggle '️️✔️' from given string
 * @param {string} text         :keyboard label
 */
function toggleCheck(text){
    const checkIcon = '️️✔️'
    return text.includes(checkIcon) ? text.substr(checkIcon.length) : checkIcon + text
}

function spaces(num){
    let sp = ''
    for(let _ = 0; _ < num; _++){
        sp+='\t'
    }
    return sp
}

module.exports = {
    generateTasksKeyboard,
    parseToReportFormat,
    generateInlineButtonForUser,
    toggleCheck,
    selectedButtonToString,
    spaces
}


