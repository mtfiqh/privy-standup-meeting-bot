const assert = require('assert')
const {MonitoringUsers} = require('../app/MonitoringUsers')

const monit = new MonitoringUsers('123','abc')

async function init(){
    await monit.onStart()
}

describe('Monitoring Users',  ()=>{
    describe('onStart()', ()=>{
        it('User tidak mungkin undefined',   ()=>{
            console.log(monit.users)
            assert.equal(monit.users!==undefined, true)
            this.timeout(15000)
        })
        it('check kemungkinan yang didapatkan', ()=>{
            if(monit.users && monit.users.length>=0){
                console.log(monit.users)
                assert.equal('userID' in monit.users[0], true)
                this.timeout(15000)

            }
            
        })
    })
}).beforeAll(()=>{
    init()
})
