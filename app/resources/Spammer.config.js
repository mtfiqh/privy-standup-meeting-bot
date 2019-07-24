const em = require('./emoticons.config')

module.exports={
    message:
        `Task anda belum ada yang selesai. Apakah ada kendala ?`,
    options: (prefix)=>{

        return {
            reply_markup:{
                inline_keyboard: [
                    [ 
                        {
                            text:`${em.done} Mark Task As Done`,callback_data:`${prefix}-onTaskDone-`}
                    ],
                    [ 
                        {
                            text:`${em.add} Tambah kendala`,callback_data:`${prefix}-onAddProblem-`}
                    ],
                    [ 
                        {
                            text:`${em.close} Lewati`,callback_data:`${prefix}-stop-`}
                    ]
            ]
        }}
    }
    
}