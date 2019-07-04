const assert = require("assert")
const { App } = require('./App')

class Task extends App {
    constructor() {
        super()
        this.register([
            this.onSave,
            this.onUpdate
        ])
    }

    onSave(key) {
        return this.cache[key]
    }

    onUpdate() {
        return "OnUpdate"
    }
}

const task = new Task()
const task2 = new Task()
const lookUp = { "Task": task, "Task2": task2 }

describe(` Test core/App.js`, function () {
    describe("Instantiated App directly.", function () {
        it('Abstract class "App" cannot be instantiated directly.',
            function () {
                try {
                    new App()
                } catch (error) {
                    assert.equal(error.message, "Abstract class 'App' cannot be instantiated directly.")
                }
            })
    })

    describe("Task extends App", function () {
        it('Task Listen On Save cache 111',
            function () {
                const command = "Task-onSave-111"
                const [cmd, action, addr] = command.split('-')
                const payloads = {
                    name:"Taufiq",
                    status: true
                }
                lookUp[cmd].addCache(addr,payloads)
                const res = lookUp[cmd].listen(action, addr)
                assert.deepEqual(res, payloads)
            })

        it('Task Listen On Save cache 222',
            function () {
                const command = "Task2-onSave-222"
                const [cmd, action, addr] = command.split('-')
                const payloads = {
                    name:"Jose",
                    status: true
                }
                lookUp[cmd].addCache(addr,payloads)
                const res = lookUp[cmd].listen(action, addr)
                assert.deepEqual(res, payloads)
            })

        it('Task Listen On Update',
            function () {
                const command = "Task-onUpdate-333"
                const [cmd, action, addr] = command.split('-')
                const res = lookUp[cmd].listen(action, {})
                assert.deepEqual(res, "OnUpdate")
            })
    })
})
