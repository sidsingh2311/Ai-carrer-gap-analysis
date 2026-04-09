import User from "../models/user.model.js";


// creating function for registering the user 
const register  = async (req,res,next) => {
      try{
           // in the user schema there are three files
           // name email and password which the user will pass to the backend 
           const {name,email,password} = req.body;
            // checking if any of the fields are empty or missing
            if(!name || !email || !password || [name, email, password].some((field) => field?.trim() === "")) {
               return res.status(400).json({
                 success:false,
                 message: "All fields are required",
                 data: {}
               })
            } 

           const normalemail = email?.trim()?.toLowerCase();
           // checking if the email exists in the databse
           const emailfound = await User.findOne({email : normalemail});
           if(emailfound) {
              return res.status(400).json({
                success:false,
                message: "user with this email already exists",
                data: {}
              })
           } 

           // if the email is not found in the databse then create and store 
           const user = await User.create({
             email:  normalemail,
             name,
             password
           }) 
           
           // select the user and dont take its password ans then send the respone to the frontend
           const newUser = await User.findById(user._id).select("-password");
           return res.status(200).json({
            success:true,
            message: "user registered successfully",
            data: newUser
           })
      }
      catch(error) {
        console.error("REGISTER ERROR:", error);
        return res.status(500).json({
            success:false,
            message: error.message || "An error occurred during registration",
            data: {}
        })
      }
} 

// creating the fucntion for login users
const login = async (req,res,next) => {
  try{
        // frontend will send the email and password 
        // validating the email and password 
        const {email,password} = req.body;
        if([email,password].some((field) => field?.trim() === "")) {
            return res.status(400).json({
               success:false,
               message: "all fields are required",
               data: {}
            })
        }  

        const normalemail = email?.trim()?.toLowerCase();
        const user = await User.findOne({email:normalemail});
        if(!user) {
           return res.status(400).json({
              success:false,
              message: "Invalid credentials",
              data:{}
           })
        } 
         
        // now if the user is present then match the password 
        const isPasswordMatched = await user.isPasswordMatched(password);

        if(!isPasswordMatched) {
            return res.status(400).json({
              success:false,
              message: "Password not matching",
              data: {}
            })
        } 
         
        // if the password is matching then generate the token 
        const accessToken = await user.generateAccessToken();

        return res.status(200).json({
             success:true,
             message: "",
             data: {
              accessToken: accessToken
             }
        })

  }
  catch(error) {
     return res.status(500).json({
        success:false,
        message: error.message,
        data: {}
     })
  }
}

export {register,login};