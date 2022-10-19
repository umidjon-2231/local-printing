require("dotenv").config()
const printer=require("pdf-to-printer")
const axios = require("axios");
const htmlToPdf = require("html-pdf-node");
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
    while (true){

        if(!token){
            console.error("Token not found. Please check login data!")
            continue
        }
        await axios.get(process.env.GET_URL, {
            headers: {
                Authorization: "Bearer "+token
            }
        }).then(async res=>{
            if(res.status!==204){
                let sells=res.data.data
                for (let i = 0; i< sells.length; i++) {
                    let sell=sells[i];
                    await axios.get(process.env.CHEQUE_URL+sell.id, {
                        headers: {
                            Authorization: 'Bearer '+token,
                            ContentType: "text/html"
                        },
                    })
                        .then(async cheque=>{
                            await htmlToPdf.generatePdf({content: cheque.data}, {width: "400", path: `./cheques/${sell?.id}.pdf`}
                                , async ()=>{
                                    await printer.print(`cheques/${sell?.id}.pdf`, {
                                        printer: process.env.PRINTER_ID
                                    }).catch(console.error)
                                    await axios.patch(process.env.STATUS_EDIT_URL, {}, {
                                        params: {
                                            id: sell?.id,
                                            chequeStatus: 1
                                        },
                                        headers: {
                                            Authorization: "Bearer "+token
                                        }
                                    }).catch((e)=>{
                                        console.log(e)
                                        process.exit(0)
                                    })
                                }
                            )
                                .catch(console.error)
                        })
                }

            }else{
                console.error("Not sold any product")
            }
        }).catch(console.error)
        await sleep(1000)
    }
}
run().finally(()=>console.log("Bye!"))
