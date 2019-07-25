
class Advice  {

    constructor(prefix, id, name){

        this.prefix = prefix;
        this.id = id
        this.name = name
    }

    onRequest(){
        return {
            message: 'Masukkan Masukan Anda!',
            options: {
                parse_mode: "Markdown",
                reply_markup:{
                    keyboard:[
                        ['Save'],
                        ["Cancel"]
                    ],
                    resize_keyboard: true
                }
            }
        }
    }
}

module.exports = {
    Advice
}