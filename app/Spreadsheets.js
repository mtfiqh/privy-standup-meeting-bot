
function save(date, report) {
    const data=report

    let maxLength=0
    console.log("\n\n")
    console.log(data)
    console.log("\n\n")

    const {
        google
    } = require('googleapis')
    const keys = require('./keys-sheets.json')

    const client = new google.auth.JWT(
        keys.client_email,
        null,
        keys.private_key,
        ['https://www.googleapis.com/auth/spreadsheets']
    )

    client.authorize((err, tokens) => {
        if (err) {
            console.log(err)
        } else {
            console.log('connected! ' + tokens)
            write(client)
        }
    })

    async function write(client) {
        const gsapi = google.sheets({
            version: 'v4',
            auth: client,
        })

        let title = date.year + "-" + date.month + "-" + date.day
        // let title = "res"
        // create new sheets
        const request = {
            // The ID of the spreadsheet
            "spreadsheetId": '1YfZQRCdkrZ5I45AMs_7N5GEYnj6_tFQbU6zW_sfICvc',
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
        // console.log(report.data)
        let wait = true
        gsapi.spreadsheets.batchUpdate(request, (err, response) => {
            if (err) {
                // TODO: Handle error
                console.log("pembuatan sheets baru error\n" + err)
            } else {
                console.log("sheets baru dibuat untuk : " + title)
            }

             // update properties
             const prop = {
                spreadsheetId: '1YfZQRCdkrZ5I45AMs_7N5GEYnj6_tFQbU6zW_sfICvc',
                range: title+"!A1", //sheet!A1
                valueInputOption: 'USER_ENTERED',
                resource: {
                    values: data,
                }
            }
            gsapi.spreadsheets.values.update(prop, (err, response)=>{
                if(err){
                    console.log(err)
                }else{
                    console.log("Data berhasil di save")
                }
            })
            
        });

       
    }


}


// export
module.exports = {
    save
}