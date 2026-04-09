import jwt from "jsonwebtoken";
import User from "../models/user.model.js";

// creating a method to verify the jwy 
const verifyJWT = async (req , res , next) => {
    try{
         const authHeader = req.headers.authorization;
         if(!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({
                success:false,
                message: "unauthorized access",
                data: {}
            })
         } 
          
         // the token conssist for bearer and the token
         // so removing the bearer and keeping only the token part 
         const token = authHeader.split(" ")[1];
         // verify the token with the verify method of the jwt 
         const decodedToken = jwt.verify(token,process.env.ACCESS_TOKEN_SECRET);
         const user  = await User.findById(decodedToken?._id).select("-password");
         if(!user) {
            return res.status(401).json({
                success:false,
                message: "unauthorized access",
                data: {}
            })
         }

         req.user = user;
         next();
    }
    catch(error) {
        return res.status(401).json({
            success:false,
            message: error.message,
            data: {}
        })
    }
} 

export {verifyJWT}