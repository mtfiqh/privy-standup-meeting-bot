const assert = require('assert')
const dt = require('../app/DataTransaction')
const dummy = require('../addDummy')

describe('Test On DataTransaction.js',function(){
    describe('On Getter Methods',function(){
        this.beforeAll(async function(){
            await dummy.addUser()
            this.timeout(15000)
        })
        it('On Get All User Data',async function(){
            await dt.getUsersData('all').then(result=>{
                if(result.length!=0){
                    assert.equal('userID' in result[0],true)
                }
            })
            this.timeout(15000)
        })
        it('On Get Specific User Data',async function(){
            const user = dummy.getRandomUser()
            await dt.getUsersData(user.userID).then(result=>{
                assert.deepEqual(result,user)
            })
            this.timeout(15000)
        })
        this.afterAll(async function(){
            await dummy.deleteUser()
            this.timeout(15000)
        })
    })
})