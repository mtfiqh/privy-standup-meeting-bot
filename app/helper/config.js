const fs      = require('fs')
const payload = fs.readFileSync('./settings.json')
class Config {
    constructor(){
        console.log("FIRST.........")
        this.data = JSON.parse(payload)
    }

    static  getInstance() {
        if (Config.self == undefined) {
            Config.self = new Config();
        }
        return Config.self;
    }
    
    reload(){
        this.data = JSON.parse(payload)
    }
}

const config   = Config.getInstance()
const settings = config.data
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
    settings: Config.getInstance().data,
    refresh : config.reload,
    parseSheetID,
    config
}