require("dotenv").config()
const printer=require("pdf-to-printer")
const axios = require("axios");
const htmlToPdf = require("html-pdf-node");
// printer.getPrinters().then(console.log)
// let filename="package.json"
// printer.print(filename, {printer: process.env.PRINTER_ID}).then(console.log).catch(console.error)
async function getToken(){
    let result=""
    await axios.post(process.env.LOGIN_URL, {
        [process.env.LOGIN_FIELD_NAME??"login"]: process.env.LOGIN,
        password: process.env.PASSWORD
    }).then(res=>{
        if(res.status===200){
            result=res.data?.data??''
        }
    })
    return result??""
}

function sleep(s){
    return new Promise((r)=>setTimeout(r, s))
}

async function run(){
    let token=await getToken()

    await axios.get("http://localhost:3000/cheque/1", {
        headers: {
            Authorization: 'Bearer '+token,
            ContentType: "text/html"
        },
    }).then(async res=>{
        console.log(res.data)
        await htmlToPdf.generatePdf({content: res.data}, {width: "400", path: './cheques/1.pdf'})
    })

    // await htmlToPdf.generatePdf({url: "http://localhost:3000/check-preview"}, {width: "400", height: 400, path: './cheques/1.pdf'})
    // printer.print("cheques/1.pdf", {
    //     // printer: process.env.PRINTER_ID
    // }).then(console.log).catch(console.error)
    while (false){

        if(!token){
            console.error("Token not found. Please check login data!")
            continue
        }
        await axios.get(process.env.GET_URL, {
            headers: {
                Authorization: "Bearer "+token
            }
        }).then(res=>{
            if(res.status!==204){
                console.log(res.data)
            }else{
                console.error("Not sold any product")
            }
        }).catch(console.error)
        await sleep(5000)
    }
}
run().finally(()=>console.log("Bye!"))
