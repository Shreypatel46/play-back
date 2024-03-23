class ApiError extends Error{
    constructor(
        statuscode,
        message="somethig went wrong",
        errors=[],
        stack="",

    ){
        super(message)
        this.statuscode=statuscode
        this.data =null
        this.message =message
        this.succcess= false,
        this.errors=errors

        // to get complete view where error can get occur in stack 
        if(stack){
            this.stack =stack
        }
        else{
            Error.captureStackTrace(this, this.constructor)
            //  passes instance ,in which way we are taling
        }
    }
}

export {ApiError}