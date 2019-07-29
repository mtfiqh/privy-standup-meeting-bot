const { App } = require('../core/App')
const { getUsersData, getRoleList, updateUser } = require('./DataTransaction')
const { toggleCheck } = require('./helper/helper')
class ChangeRole extends App{
    constructor(prefix, userID, name){
        super()
        this.addCache('prefix', prefix)
        this.addCache('userID', userID)
        this.addCache('name', name)
        this.addCache('token', Math.random().toString(36).substring(8))        
        this.prefix=`${prefix}@${userID}`
        this.register([
            'onStart',
            'onMultiSelect',
            'onSingleSelect',
            'onClose',
            'onSure',
        ])
    }
    
    
    async getAllUsers(){
        this.users={}
        const setAllUsers = (users)=>{
            this.users=users
        }
        await getUsersData('all').then(setAllUsers.bind(this))
    }

    async onStart(){
        await this.getAllUsers()
        this.keyboard=[]
        let i=0
        for(let user of this.users){
            this.keyboard.push([
                {text:user.name, callback_data:`${this.prefix}-onMultiSelect-${i}@${this.cache.token}`}
            ])
            i++
        }
        this.keyboard.push([
            {text:'Select', callback_data:`${this.prefix}-onMultiSelect-s@${this.cache.token}`},
            {text:'Cancel', callback_data:`${this.prefix}-onMultiSelect-c@${this.cache.token}`}
        ])

        return{
            message:'Silahkan pilih satu atau lebih user yang akan di ganti role nya:',
            options:{
                reply_markup:{
                    inline_keyboard:this.keyboard
                }
            }
        }
    }

    /**
     * @returns 
     * [ 
     * { title: 'PM', description: 'Project Manager' },
     * { title: 'QA', description: 'Quality Assurance' } 
     * ]
     */
    async getAllRoles(){
        const setAllRoles=(roles)=>{
            this.roles=roles
        }
        await getRoleList().then(setAllRoles.bind(this))
    }

    async onMultiSelect(args){
        const [idx, token] = args.split('@')
        if(token!==this.cache.token) return
        if(this.cache.users===undefined) this.addCache('users', new Set([]))

        if(idx==='s'){
            console.log('select')
            if(this.cache.users.size<1){
                return{
                    type:'Edit',
                    id:this.cache.userID,
                    message:'Kamu harus memilih setidaknya satu user\nSilahkan pilih users tersebut akan di ganti menjadi role apa?',
                    options:{
                        reply_markup:{
                            inline_keyboard:this.keyboard
                        }
                    }
                }
            }
            await this.getAllRoles()
            this.keyboard=[]
            let i=0
            for(let role of this.roles){
                this.keyboard.push([
                    {text:role.description, callback_data:`${this.prefix}-onSingleSelect-${i}@${this.cache.token}`}
                ])
                i++
            }
            this.keyboard.push([
                {text:'Select', callback_data:`${this.prefix}-onSingleSelect-s@${this.cache.token}`},
                {text:'Cancel', callback_data:`${this.prefix}-onSingleSelect-c@${this.cache.token}`}
            ])
            
            return{
                type:'Edit',
                id:this.cache.userID,
                message:'Silahkan pilih users tersebut akan di ganti menjadi role apa?',
                options:{
                    reply_markup:{
                        inline_keyboard:this.keyboard
                    }
                }
            }

        }else if(idx==='c'){
            console.log('cancel')
            return{
                type:'Edit',
                id:this.cache.userID,
                message:'Permintaan anda dibatalkan',
                options:{
                    reply_markup:{
                        inline_keyboard:[[{text:'Close', callback_data:`${this.prefix}-onClose-${token}`}]]
                    }
                }
            }
        }

        if(this.cache.users.has(this.users[idx])){
            this.cache.users.delete(this.users[idx])
        }else{
            this.cache.users.add(this.users[idx])
        }
        this.keyboard[idx][0].text=toggleCheck(this.keyboard[idx][0].text)

        return{
            type:'Edit',
            id:this.cache.userID,
            message:'Silahkan pilih satu atau lebih user yang akan di ganti role nya:',
            options:{
                reply_markup:{
                    inline_keyboard:this.keyboard
                }
            }
        }
    }

    onSingleSelect(args){
        console.log('single select')
        const [idx, token] = args.split('@')
        if(token!==this.cache.token) return
        if(this.cache.role===undefined) this.addCache('role', -1)

        if(idx==='s'){
            if(this.cache.role===-1){
                return{
                    type:'Edit',
                    id:this.cache.userID,
                    message:'Kamu harus memilih Role nya!\nSilahkan pilih users tersebut akan di ganti menjadi role apa?',
                    options:{
                        reply_markup:{
                            inline_keyboard:this.keyboard
                        }
                    }
                }
            }

            let text=`Role akan di update menjadi ${this.roles[this.cache.role].description} untuk users dibawah ini:\n`
            let i=1
            this.cache.users.forEach(user=>{
                text+=`${i}. ${user.name}\n`
                i++
            })

            return{
                type:'Edit',
                id:this.cache.userID,
                message:text,
                options:{
                    reply_markup:{
                        inline_keyboard:[
                            [
                                {text:'Ya', callback_data:`${this.prefix}-onSure-Y@${token}`},
                                {text:'Tidak', callback_data:`${this.prefix}-onSure-N@${token}`}
                            ]
                        ]
                    }
                }
            }
        }else if(idx==='c'){
            console.log('cancel')
            return{
                type:'Edit',
                id:this.cache.userID,
                message:'Permintaan anda dibatalkan',
                options:{
                    reply_markup:{
                        inline_keyboard:[[{text:'Close', callback_data:`${this.prefix}-onClose-${token}`}]]
                    }
                }
            }
        }

        if(idx===this.cache.role){
            this.cache.role=-1
        }else{
            if(this.cache.role>=0) this.keyboard[this.cache.role][0].text=toggleCheck(this.keyboard[this.cache.role][0].text)
            this.cache.role=idx
        }
        this.keyboard[idx][0].text=toggleCheck(this.keyboard[idx][0].text)

        return{
            type:'Edit',
            id:this.cache.userID,
            message:'Silahkan pilih users tersebut akan di ganti menjadi role apa?',
            options:{
                reply_markup:{
                    inline_keyboard:this.keyboard
                }
            }
        }
    }

    onClose(token){
        if(this.cache.token!==token) return
        return{
            type:'Delete',
            id:this.cache.userID,
            destroy:true,
        }
    }

    onSure(args){
        const [ans, token] = args.split('@')
        if(token!==this.cache.token) return

        if(ans==='N'){
            return{
                type:'Edit',
                id:this.cache.userID,
                message:'Permintaan anda dibatalkan',
                options:{
                    reply_markup:{
                        inline_keyboard:[[{text:'Close', callback_data:`${this.prefix}-onClose-${token}`}]]
                    }
                }
            }
        }
        this.cache.users.forEach(user=>{
            updateUser(user.userID, {type:`${this.roles[this.cache.role].title}`,role:`${this.roles[this.cache.role].title}`})
        })

        return{
            type:'Edit',
            id:this.cache.userID,
            message:'Selamat, role berhasil di update!',
            options:{
                reply_markup:{
                    inline_keyboard:[[{text:'Close', callback_data:`${this.prefix}-onClose-${token}`}]]
                }
            }
        }
    }
}
module.exports={ ChangeRole }