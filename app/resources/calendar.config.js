const em = require('./emoticons.config')
const calendar = [
    [],
    [
        {text:'S',callback_data:'null'},{text:'M',callback_data:'null'},
        {text:'T',callback_data:'null'},{text:'W',callback_data:'null'},
        {text:'T',callback_data:'null'},{text:'F',callback_data:'null'},
         {text:'S',callback_data:'null'}],
    [
        {text:'-',callback_data:'-'},{text:'-',callback_data:'-'},
        {text:'-',callback_data:'-'},{text:'-',callback_data:'-'},
        {text:'-',callback_data:'-'},{text:'-',callback_data:'-'},
        {text:'-',callback_data:'-'}],//2
    [
        {text:'-',callback_data:'-'},{text:'-',callback_data:'-'},
        {text:'-',callback_data:'-'},{text:'-',callback_data:'-'},
        {text:'-',callback_data:'-'},{text:'-',callback_data:'-'},
        {text:'-',callback_data:'-'}],
    [
        {text:'-',callback_data:'-'},{text:'-',callback_data:'-'},
        {text:'-',callback_data:'-'},{text:'-',callback_data:'-'},
        {text:'-',callback_data:'-'},{text:'-',callback_data:'-'},
        {text:'-',callback_data:'-'}],
    [
        {text:'-',callback_data:'-'},{text:'-',callback_data:'-'},
        {text:'-',callback_data:'-'},{text:'-',callback_data:'-'},
        {text:'-',callback_data:'-'},{text:'-',callback_data:'-'},
        {text:'-',callback_data:'-'}],
    [
        {text:'-',callback_data:'-'},{text:'-',callback_data:'-'},
        {text:'-',callback_data:'-'},{text:'-',callback_data:'-'},
        {text:'-',callback_data:'-'},{text:'-',callback_data:'-'},
        {text:'-',callback_data:'-'}],
    [
        {text:'-',callback_data:'-'},{text:'-',callback_data:'-'},
        {text:'-',callback_data:'-'},{text:'-',callback_data:'-'},
        {text:'-',callback_data:'-'},{text:'-',callback_data:'-'},
        {text:'-',callback_data:'-'}],
    [
        {text:`${em.left} Prev`,callback_data:'-'},
        {text:`${em.home} Menu`,callback_data:'-'},
        {text:`${em.right} Next`,callback_data:'-'}
    ]
]

const singleTemplate = [
    {text:'-',callback_data:'-'},{text:'-',callback_data:'-'},
    {text:'-',callback_data:'-'},{text:'-',callback_data:'-'},
    {text:'-',callback_data:'-'},{text:'-',callback_data:'-'},
    {text:'-',callback_data:'-'}
]

const nav = [
    {text:`${em.left} Prev`,callback_data:'-'},
    {text:`${em.home} Menu`,callback_data:'-'},
    {text:`${em.right} Next`,callback_data:'-'}
]

const months = [
    'January','February','March','April','May','June','July','August','September','October',
    'November','December'
]
module.exports={
    calendar,
    months,
    nav,
    singleTemplate
}