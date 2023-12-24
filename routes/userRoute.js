const express = require("express")
const userRoute=express()

userRoute.set('view engine','ejs')
userRoute.set('views','./views/users')

const session=require("express-session")
const config=require("../config/config")
userRoute.use(session({secret: config.sessionSecret,
    resave: false, 
    saveUninitialized: true  
  }));
  

const bodyparser=require("body-parser")
userRoute.use(bodyparser.json())
userRoute.use(bodyparser.urlencoded({extended:true}))

const UserAuth=require("../middleware/userAuth")

//sign up
const userController=require("../controllers/userControllers")
userRoute.get("/register",userController.loadRegister)
userRoute.post("/register",UserAuth.isLogout,userController.insertUser)

//login
userRoute.post("/login",userController.verifyLogin)
userRoute.get("/login",UserAuth.isLogin,userController.verifyLogin)

//home
userRoute.get("/",UserAuth.isLogout,userController.loadHome)

//logout
userRoute.get("/logout",userController.userLogout)

module.exports=userRoute