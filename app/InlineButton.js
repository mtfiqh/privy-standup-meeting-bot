
const {App} = require('../core/App')
class InlineButton extends App {
    constructor(){
        super()
    }

    selectedButtonToString(selected, mark, prefix="") {
        for (let item of selected) prefix += `\n✔️ ${item.name} (*${mark}*)`
        return prefix
    }

    toggleCheck(text){
        const checkIcon = '️️✔️'
        return text.includes(checkIcon) ? text.substr(checkIcon.length) : checkIcon + text
    }

    toggleCheckIcon(index, button) {
        const text = button[index][0].text
        button[index][0].text = this.toggleCheck(text)
        return button
    }

    getSelectedIndex(address){
        const indexOfpressedKeyboard = parseInt(address.split('@').pop())
        return indexOfpressedKeyboard
    }

}


module.exports = {
    InlineButton
}