const db = require("./DataTransaction");

class QA {
    constructor(qaList) {
        this.qaList = qaList;
    }

    get QAs() {
        return this.qaList;
    }

    static async getInstance() {
        if (QA.self == undefined) {
            const qaList = await QA.fetchQAs();
            QA.self = new QA(qaList);
        }
        return QA.self;
    }

    static fetchQAs() {
        return  db.getQA();
    }

}

module.exports = {
    QA
};
