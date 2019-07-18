

const a = new Date(2019,6,18)
const b = new Date(2019,7,1)

const delta =  (b-a)/(1000*24*3600)
const actual = Math.ceil(delta+1)
console.log(actual, new Date(2019, 6, a.getDate()+actual))

