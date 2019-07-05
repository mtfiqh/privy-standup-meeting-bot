const {deleteProject,addProjects,addTaskTransaction,addHoliday,userDayOff} = require('./app/DataTransaction')

const addProject =async()=>{
    let date = new Date()
    const project = [
        {
            projectName:'Project A'
        },
        {
            projectName:'Project B'
        },
        {
            projectName:'Project C'
        },
        {
            projectName:'Project D'
        }
    ]
    await addProjects(project)
}

const addTask = async ()=>{
    const tasks= [
        {
            name:'Membuat Website',
            projectName:'Project A',
            status:'In Progress',
            userID:886120759,
            priority:'HIGH'
        },
        {
            name:'Membuat Database',
            projectName:'Project B',
            status:'In Progress',
            userID:699298349,
            priority:'MEDIUM' 
        },
        {
            name:'Membuat UI',
            projectName:'Project C',
            status:'In Progress',
            userID:524581993,
            priority:'LOW'
        },
        {
            name:'Membuat Jaringan',
            projectName:'Project D',
            status:'In Progress',
            userID:699298349,
            priority:'HIGH'
        },        
        {
            name:'Membuat Flowchart',
            projectName:'Project A',
            status:'In Progress',
            userID:886120759,
            priority:'HIGH'
        }
    ]
    await addTaskTransaction(tasks,'Project A')
}

const holiday = ()=>{
    addHoliday({name:'Idul Fitri',date:'2019/07/05'})
    addHoliday({name:'Nyepi',date:'2019/07/10'})
    addHoliday({name:'Waisak',date:'2019/07/15'})
    addHoliday({name:'Idul Adha',date:'2019/07/25'})
}

const dayoff=()=>{
    userDayOff({userID:524581993,startDate:'2019/07/03',long:10 })
    userDayOff({userID:699298349,startDate:'2019/06/29',long:10 })
    userDayOff({userID:886120759,startDate:'2019/07/10',long:10 })
}

const load =()=>{
   //addTask()
   //holiday()
   //dayoff()
}
load()