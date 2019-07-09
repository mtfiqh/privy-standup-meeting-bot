const assert = require("assert")
const {Report} = require('./Report')


const projects = {
    "SaPHXtJkCRwX2xUoJPV9":{
       "name":"Project C",
       "task":{
          "9i8eNNyDBFAnVIe2p1pU":{
             "name":"Task 1",
             "status":"In Progress",
             "time":{
                "_seconds":1562518800,
                "_nanoseconds":0
             }
          },
          "eH8atJYRVCl5zFdN0Dw0":{
             "name":"Task 2",
             "status":"In Progress",
             "time":{
                "_seconds":1562518800,
                "_nanoseconds":0
             }
          },
          "Z1ZdP9v9i1dsHorR0Sff":{
             "name":"Task 3",
             "status":"In Progress",
             "time":{
                "_seconds":1562518800,
                "_nanoseconds":0
             }
          },
          "BM7WfX0o8FiMzmOoiymz":{
             "name":"Task 4",
             "status":"In Progress",
             "time":{
                "_seconds":1562518800,
                "_nanoseconds":0
             }
          }
       }
    }
}
const keyboard = [
    [
       {
          "text":"Task 1",
          "callback_data":"Report@1-select-item@0"
       }
    ],
    [
       {
          "text":"Task 2",
          "callback_data":"Report@1-select-item@1"
       }
    ],
    [
       {
          "text":"Task 3",
          "callback_data":"Report@1-select-item@2"
       }
    ],
    [
       {
          "text":"Task 4",
          "callback_data":"Report@1-select-item@3"
       }
    ],
    [
       {
          "text":"Process",
          "callback_data":"Report@1-process"
       },
       {
          "text":"Cancel",
          "callback_data":"Report@1-cancel"
       }
    ]
 ]
 const addrs    ={  
   "item@0":{  
      "projectId":"SaPHXtJkCRwX2xUoJPV9",
      "taskId":"9i8eNNyDBFAnVIe2p1pU"
   },
   "item@1":{  
      "projectId":"SaPHXtJkCRwX2xUoJPV9",
      "taskId":"eH8atJYRVCl5zFdN0Dw0"
   },
   "item@2":{  
      "projectId":"SaPHXtJkCRwX2xUoJPV9",
      "taskId":"Z1ZdP9v9i1dsHorR0Sff"
   },
   "item@3":{  
      "projectId":"SaPHXtJkCRwX2xUoJPV9",
      "taskId":"BM7WfX0o8FiMzmOoiymz"
   }
}

const userId   = 1
const name     = "Jose"


const reportA = new Report(projects, userId, name, keyboard).addCache('Report@1',addrs)



const actual = [
   [
      {
         text:"Task 1",
         "callback_data":"Report@1-select-item@0"
      }
   ],
   [
      {
         text:"️️✔️Task 2",
         callback_data:"Report@1-select-item@1"
      }
   ],
   [
      {
         text:"Task 3",
         callback_data:"Report@1-select-item@2"
      }
   ],
   [
      {
         text:"Task 4",
         callback_data:"Report@1-select-item@3"
      }
   ],
   [
      {
         text:"Process",
         callback_data:"Report@1-process"
      },
      {
         text:"Cancel",
         callback_data:"Report@1-cancel"
      }
   ]
]

const actual2 = [
   [
      {
         text:"Task 1",
         "callback_data":"Report@1-select-item@0"
      }
   ],
   [
      {
         text:"️️✔️Task 2",
         callback_data:"Report@1-select-item@1"
      }
   ],
   [
      {
         text:"️️✔️Task 3",
         callback_data:"Report@1-select-item@2"
      }
   ],
   [
      {
         text:"Task 4",
         callback_data:"Report@1-select-item@3"
      }
   ],
   [
      {
         text:"Process",
         callback_data:"Report@1-process"
      },
      {
         text:"Cancel",
         callback_data:"Report@1-cancel"
      }
   ]
]

describe(` Test app/Report.js`, function () {
   describe("On Select Task.", function () {
       it(`Select Task-2 should be has one Task `,
           function () {
               const {options} = reportA.select('item@1')
               assert.deepEqual(options.reply_markup.inline_keyboard, actual)
           })
      it(`Select Task-3 should be has 2 tasks`,
           function () {
               const {options} = reportA.select('item@2')
               assert.deepEqual(options.reply_markup.inline_keyboard, actual2)
           })
      it(`Toggle Task-3 should be has 1 task`,
           function () {
               const {options} = reportA.select('item@2')
               assert.deepEqual(options.reply_markup.inline_keyboard, actual)
           })
      it(`Toggle Task-3 again should be has 2 tasks`,
         function () {
            const {options} = reportA.select('item@2')
            assert.deepEqual(options.reply_markup.inline_keyboard, actual2)
         })
   })

})