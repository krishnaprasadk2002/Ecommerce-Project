const bcrypt = require("bcrypt");
const User = require("../models/userModel");
const Products=require("../models/productModel")
const category=require("../models/categoryModel")
const userOtpVerification = require("../models/otpModel")
const nodemailer = require("nodemailer");



const loadRegister = async (req, res) => {
  try {
    res.render('registeration');
  } catch (error) {
    console.log(error.message);
  }
}

const securePassword = async (password) => {
  try {
    const passwordHash = await bcrypt.hash(password, 10);
    return passwordHash;
  } catch (error) {
    console.log(error.message);
  }
}

const insertUser = async (req, res) => {
  try {
    const { name, mobile, email, password } = req.body;

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      const errorMessage = 'Email already exists. Please choose a different email.';
      return res.render('registeration', { errorMessage });
    }

    const spassword = await securePassword(password);
    const user = new User({
      name,
      mobile,
      email,
      password: spassword,
      is_admin: 0,
    });

    const userData = await user.save();


    sendOTPverificationEmail(userData, res);

  } catch (error) {
    console.log(error.message);
  }
};

// otp verificaton 

const sendOTPverificationEmail = async ({ email }, res) => {
  try {
    let transporter = nodemailer.createTransport({
      service: 'gmail',
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: {
        user: 'prasadkrishna1189@gmail.com',
        pass: 'vglm kbwh kqpt zbdg'
      }
    });
    otp = `${Math.floor(1000 + Math.random() * 9000)
      }`

    // mail options
    const mailOptions = {
      from: 'prasadkrishna1189@gmail.com',
      to: email,
      subject: "Verify Your email",
      html: `Your OTP is: ${otp}`
    };

    // hash the otp
    const saltRounds = 10;
    const hashedOTP = await bcrypt.hash(otp, saltRounds);

    const newOtpVerification = await new userOtpVerification({ email: email, otp: hashedOTP });
    console.log(newOtpVerification)
    // save otp record
    await newOtpVerification.save();
    await transporter.sendMail(mailOptions);

    res.redirect(`/otp?email=${email}`);

  } catch (error) {
    console.log(error.message);
  }
}

//otp load

const loadotp = async (req, res) => {
  try {
    const email = req.query.email
    console.log(email);
    res.render("otp", { email })
  } catch (error) {
    console.log(error.message)
  }
}

const verifyOtp = async (req, res) => {
  try {
    const email = req.body.email;
    console.log('email', req.body.email);
    const otp = req.body.Otp;

    const userVerification = await userOtpVerification.findOne({ email: req.body.email });
    console.log('userVerification:', userVerification);

    if (!userVerification) {
      console.log("otp expired");
      res.redirect('/register');
      return;
    }

    const { otp: hashedOtp } = userVerification;
    console.log('hashedOtp:', hashedOtp);

    const validOtp = await bcrypt.compare(otp, hashedOtp);
    console.log('validOtp:', validOtp);

    if (validOtp) {
      const userData = await User.findOne({ email });
      if (userData) {
        await User.findByIdAndUpdate(userData._id, {
          $set: {
            is_verified:1
          }
        });
      }

      // delete the OTP record
      await userOtpVerification.deleteOne({ email });


      res.redirect('/register?success=Registration successful!');
    } else {
      res.redirect('/register?failed=Registration failed. Please try again.');
    }
  } catch (error) {
    console.log(error);
    res.status(500).send('Internal Server Error');
  }
};

// login page

const loginLoad = async (req, res) => {
  try {
    res.render('login');
  } catch (error) {
    console.log(error.message);
  }
}


const verifyLogin = async (req, res) => {
  try {
    const email = req.body.email;
    const password = req.body.password;
    const userData = await User.findOne({ email: email });

    if (userData) {
      const passwordMatch = await bcrypt.compare(password, userData.password);

      if (passwordMatch) {
        if (userData.status === 'Active' && userData.is_verified == 1) {
          // User is active, allow login
          if (req.session) {
            req.session.user_id = userData.name;
            return res.redirect('/');
          } else {
            console.error('req.session is undefined');
            return res.status(500).send('Internal Server Error');
          }
        } else {
          // User is blocked
          return res.render('login', { message: 'User account is blocked' });
        }
      } else {
        // Incorrect password
        return res.render('login', { message: 'Email and password are incorrect' });
      }
    } else {
      // User not found
      return res.render('login', { message2: '' });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).send('Internal Server Error');
  }
};

const loadHome = async (req, res) => {
  const username = req.session.user_id;
  try {
    if (req.session.user_id) {
      res.render("home", { username });
    } else {
      res.render("home")
    }
  } catch (error) {
    console.log(error.message);
  }
}

//  Product list

const loadProduct = (req, res) => {
  try {
    res.render("allproduct")
  } catch (error) {
    console.log(error.message)
  }
}

// const listProduct=async(req,res)=>{
//   try {
//     const product=await Products.find({is_listed:true})
//     const 
//   } catch (error) {
    
//   }
// }

const userLogout = async (req, res) => {
  try {
    req.session.destroy()
    res.redirect("/")
  } catch (error) {
    console.log(error.message);
  }
}

module.exports = {
  loadRegister,
  insertUser,
  loadotp,
  verifyOtp,
  loginLoad,
  verifyLogin,
  loadHome,
  loadProduct,
  userLogout
}
