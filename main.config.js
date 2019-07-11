
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
            getOptions: id => {
                return {
                    parse_mode: 'Markdown',
                    reply_markup: {
                        inline_keyboard: [
                            [{ text: 'Menu', callback_data: `Menu@${id}-cron` }]
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
        remainder:{
            first:{
                getMessage : name => `Selamat Pagi ${name}\nJangan lupa mengisi task hari ini. \nTekan tombol Menu atau kirim */menu* untuk menggunakan fitur bot.`
            },
            second:{
                getMessage: name => `Selamat Siang ${name}\nJangan lupa melaporkan task hari ini yang sudah *Done*. \nTekan tombol Menu atau kirim */menu* untuk menggunakan fitur bot.`
            }
        }

    }
}