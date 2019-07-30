const em = require('./resources/emoticons.config')
function generateKeyboardList(tasks,prefix){
    const inline_keyboard = []
    let counter = 1
    for(let task of tasks){
        const tmp = []
        tmp.push({text:`${task.name} (${task.problems.length} ${task.problems.length==1?'problem':'problems'})`,callback_data:`${prefix}-onSelectProblem-${task.taskID.toString()}`})
        inline_keyboard.push(tmp)
        counter++
    }
    inline_keyboard.push([{text:`${em.delete} Close`,callback_data:`${prefix}-onClose-null`}])
    return inline_keyboard
}

function generateMessageProblems(problems,taskName){
    let message = `List problems task *${taskName}*\n`
    let counter = 1
    for(let problem of problems){
        message = message.concat(`${counter}. ${problem}\n`)
        counter++
    }
    return message
}

module.exports={
    generateKeyboardList,
    generateMessageProblems
}