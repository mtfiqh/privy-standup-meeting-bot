
module.exports = {
    dictionary : {
        send:{
            success:{
                message: "*Terimakasih!* Berikut Task anda yang sudah *Done*.",
                options:{ "parse_mode": "Markdown"}
            },
            failed:{
                message: "*Mohon Maaf!*, Anda Harus memilih task.",
                options:{ "parse_mode": "Markdown"}
            }
        },
        select:{
            success:{
                message:`berikut task anda yang masih *In Progress*, silahkan di klik untuk task yang sudah *Done*`,
                options:{
                    "parse_mode": "Markdown"
                }
            }
        }
    }
}