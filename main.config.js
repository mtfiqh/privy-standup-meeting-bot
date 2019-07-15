const {getUserTasks,getStatistic} = require('./app/DataTransaction')
const em = require('./app/resources/emoticons.config')

module.exports = {
    dictionary:{
        start:{
            getMessage: name => `Selamat Datang ${name}\nTekan tombol Menu atau kirim */menu* untuk menggunakan fitur bot.`,
            getOptions: () => {
                return {
                    parse_mode: 'Markdown',
                    reply_markup: {
                        inline_keyboard: [
                            [{ text: 'Menu', callback_data: '/menu' }]
                        ]
                    }
                }
            }
        },
        initMenuCron:{
            getOptions: (id,name,type) => {
                if(type==10){
                    return {
                        parse_mode: 'Markdown',
                        reply_markup: {
                            inline_keyboard: [
                                [{ text: `${em.add} Add Task(s)`, callback_data: `Menu@${id}-onAddTasks-${id}@${name}` }],
                                [{ text: `${em.home} Menu`, callback_data: `Menu@${id}-cron-${id}@${name}` }]
                            ]
                        }
                    }    
                }
                return {
                    parse_mode: 'Markdown',
                    reply_markup: {
                        inline_keyboard: [
                            [{ text: `${em.add} Add Task(s)`, callback_data: `Menu@${id}-onAddTasks-${id}@${name}` }],
                            [{ text: `${em.home} Menu`, callback_data: `Menu@${id}-cron-${id}@${name}` }]
                        ]
                    }
                }
            }
        },
        addTasks:{
            getMessage: () => `Silahkan ketik nama task(s) mu`,
            getOptions: () => {
                return {
                    reply_markup: {
                        resize_keyboard: true,
                        keyboard: [['CANCEL']]
                    }
                }
            }
        },
        assignTasks:{
            getMessage: () => `Silahkan ketik nama task(s) mu yang akan di assign`,
            getOptions: () => {
                return {
                    reply_markup: {
                        resize_keyboard: true,
                        keyboard: [['CANCEL']]
                    }
                }
            }
        },
        initTasks:{
            getMessage: ()=> `Silahkan ketik nama task(s) mu yang akan di assign`,
            getOptions: ()=>{
                return {
                    reply_markup: {
                        resize_keyboard: true,
                        keyboard: [['CANCEL']]
                    }
                }
            }
        },
        initOfferTask:{
            done: {
                getMessage : name => `Halo *${name}* semua task Anda sudah *Done*.`,
                getOptions: prefix => {
                    return {
                        parse_mode: 'Markdown',
                        reply_markup:{
                            inline_keyboard:[
                                [
                                    {text:"Close", callback_data:`${prefix}-closeChild`}
                                ]
                            ]
                        }
                    }
                }
            },
            inprogress:{
                getMessage : name => `Halo *${name}* Berikut adalah task Anda yang masih *In Progress*. Pilih task yang yang akan di *Tawarkan*.`,
                getOptions: keyboard => {
                    return {
                        parse_mode: 'Markdown',
                        reply_markup: {
                            inline_keyboard:keyboard
                        }
                    }
                }
            }
        },
        initUserReport:{
            done:{
                getMessage: name => `Halo *${name}* semua task Anda sudah *Done*.`,
                getOptions:  prefix => {
                    return {
                        parse_mode: 'Markdown',
                        reply_markup: {
                            inline_keyboard:[
                                [
                                    {text:"Close", callback_data:`${prefix}-closeChild`}
                                ]
                            ]
                        }
                    }
                }
            },
            inprogress:{
                getMessage: name => `Halo *${name}* Berikut adalah task Anda yang masih *In Progress*. Pilih task yang sudah *Done*.`,
                getOptions: keyboard => {
                    return {
                        parse_mode: 'Markdown',
                        reply_markup: {
                            inline_keyboard:keyboard
                        }
                    }
                }
            }
        },
        initProjects:{
            getMessage : () => `Silahkan ketik nama project yang akan di input`,
            getOptions: () =>{
                return {
                    reply_markup: {
                        resize_keyboard: true,
                        keyboard: [['CANCEL']]
                    }
                }
            }
        },
        reminder:{
            first:{
                getMessage : async (name,uid) =>{
                    let listTask = ''
                    let counter = 1
                    return getUserTasks(parseInt(uid)).then(tasks=>{
                        tasks.forEach(task=>{
                            listTask = listTask.concat(`${counter}. ${task.name}\n`)
                            counter++
                        })
                        return  `Selamat Pagi ${name}\n${counter==1?'':`Berikut ini task kamu yang belum selesai \n${listTask}`}Jangan lupa tambahkan task hari ini.`  
                    })
                }
            },
            second:{
                getMessage: async (name,uid) =>{
                    return getStatistic(uid).then(result=>{
                        const added = result.Added
                        const done  = result.Done
                        const recurring = result.Recurring

                        return `Selamat Siang ${name}\n${done==(recurring+added)?'Selamat, semua tugas anda telah selesai':`${done==0?'Anda belum menyelesaikan tugas satu pun. Ada kendala?':`${done} dari ${recurring+added} tugas anda telah selesai.`} `}`
                    })
                }

            }
        }

    }
}