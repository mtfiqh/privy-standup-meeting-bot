const {db,addProjects,addTaskTransaction,addHoliday,userDayOff} = require('../app/DataTransaction')

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

const users = [
    {
        name:'user test A',
        status:'active',
        type:'admin',
        userID:1234,
        username:'testA1234'
    },
    {
        name:'user test B',
        status:'active',
        type:'admin',
        userID:2234,
        username:'testB1234'
    },
    {
        name:'user test C',
        status:'active',
        type:'admin',
        userID:3234,
        username:'testA1234'
    },
    {
        name:'user test D',
        status:'active',
        type:'admin',
        userID:4234,
        username:'testA1234'
    }
]

const addProject =async()=>{
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

const addUser=()=>{
    users.forEach(user=>{
        db.collection('users').doc(user.userID.toString()).set(user)
    })
}

const deleteUser=()=>{
    users.forEach(user=>{
        db.collection('users').doc(user.userID.toString()).delete()
    })
}

const getRandomUser=()=>{
    return users[Math.ceil((Math.random()*100)%users.length)]
}

const load =()=>{

}
module.exports={
    addUser,
    deleteUser,
    addProject,
    addTask,
    holiday,
    dayoff,
    getRandomUser
}