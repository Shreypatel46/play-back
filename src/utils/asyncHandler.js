const asyncHander =(requestHandler)=>{
    (req,res,next)=>{
        Promise.resolve(requestHandler(req,res,next)).catch((err)=>next(err))
    }
}



export { asyncHander}

//  try catch wrapper with async

// const async =()=>{}
// const async =(func)=>{ ()=>{} } higher order function understand
// const async =(func)=> async ()=>{}

// const asyncHander = (fn)=>async (req, res, next)=>{
//     try {
//         await fn(req,res,next)
//     } catch (error) {
//         res.status(err.code || 500).json({
//             sucess: false,
//             mesaage: err.mesaage
//         })
//     }
// }