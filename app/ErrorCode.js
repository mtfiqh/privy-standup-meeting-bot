const codes = {
    404:'Not Found'
}
module.exports={
    getErrors:(code,reason)=>`${codes[code]}:${reason}`
}