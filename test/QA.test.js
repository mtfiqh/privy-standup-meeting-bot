const assert = require('assert')
const {QA} = require('../app/QA')

describe("app/QA.js", ()=>{
    describe("Singleton pattern", ()=> {
        it("First instance should be same with the next inctance", async ()=> {
            const p = await QA.getInstance()
            const q = await QA.getInstance()
            assert.deepEqual(p, q)
        })
    })
})

