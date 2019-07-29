const fs      = require('fs')
const payload = fs.readFileSync('./settings.json')
let settings  = JSON.parse(payload)

async function refresh(){
    try {
        let tmp  =  fs.readFileSync('../../settings.json')
        settings = JSON.parse(tmp)
    } catch (error) {
        console.log(error)
    }
}

function parseSheetID(){
    const url = settings.spreadsheetURL.split('/')
    let sheetID = ''

    url.forEach(element => {
        if(element.length==44){
            sheetID = element
        }
    })
    return sheetID
}

module.exports={
    settings,
    refresh,
    parseSheetID
}