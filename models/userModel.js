const mongoose=require("mongoose")
const userSchema=new mongoose.Schema({

    name:{
        type:String,
        required:true,
        trim:true
    },
    
    mobile: {
        type: String,
        required: true,
    },
    email:{
        type:String,
        required:true,
        trim:true
    },
    password:{
        type:String,
        required:true
    },
    is_admin:{
        type:Number,
        required:true
    },
    is_verified:{
        type:Number,
        default:0
    },
    status: {
        type: String,
        uStatus: ['Active', 'Block'],
        default: 'Active'
    }
})

module.exports=mongoose.model('User',userSchema)