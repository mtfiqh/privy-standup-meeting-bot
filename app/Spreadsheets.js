const {getErrors} = require('./ErrorCode')

class garbageCollection{
    constructor(){
        this.err = []
    }
}
const gb = new garbageCollection()
async function save(date, report) {

    const data=report
    let {parseSheetID} = require('./helper/config')
    let spreadsheetId = parseSheetID()
    let maxLength=0
    const {
        google
    } = require('googleapis')
    const keys = require('../credentials/firebase.json')

    const client = new google.auth.JWT(
        keys.client_email,
        null,
        keys.private_key,
        ['https://www.googleapis.com/auth/spreadsheets']
    )
    await client.authorize().catch(e=>{
        gb.err.push(e)
    })

    await write(client)
    
    if(gb.err.length!=0){
        throw new Error(gb.err)
    }

    async function write(client) {
        const gsapi = google.sheets({
            version: 'v4',
            auth: client,
        })

        let title = date.year + "-" + date.month + "-" + date.day
        
        const request = {
            "spreadsheetId": spreadsheetId,
            "resource": {
                "requests": [{
                    "addSheet": {
                        "properties": {
                            "title": title,
                        }
                    }
                }]
            }
        }
        let wait = true
        await gsapi.spreadsheets.batchUpdate(request).catch(e=>{
            if(e.code==404){
                gb.err.push(getErrors(e.code,'Spreadsheet id, check settings'))
            }else if(e.code==400){

            }else{
                gb.err.push(getErrors(e.code,e.message))
            }
        })                 
        
        const prop = {
            spreadsheetId: spreadsheetId,
            range: title+"!A1", //sheet!A1
            valueInputOption: 'USER_ENTERED',
            resource: {
                values: data,
            }
        }

        gsapi.spreadsheets.values.update(prop).catch(e=>{
            if(e.code==404){
                gb.err.push(getErrors(e.code,'Spreadsheet id, check settings'))
            }else{
                gb.err.push(getErrors(e.code,e.message))
            }
        })
    }        
}


// export
module.exports = {
    save
}