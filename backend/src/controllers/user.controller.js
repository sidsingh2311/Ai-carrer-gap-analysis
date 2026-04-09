import User from "../models/user.model.js"

const getUser = async (req,res) => {
    try{
         const userId = req?.user?._id;
         if(!userId) {
              return res.status(400).json({
                success:false,
                message: "user id is blank",
                data: {}
              })
         } 
         
         // finding the user data from the databse 
         const userdata = await User.findById(userId).select("-password");
         if(!userdata) {
            return res.status(400).json({
                success:false,
                message: "userdata not present",
                data: {}
            })
         } 

         return res.status(200).json({
            success:true,
            message: "",
            data: {
                user:userdata
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

export {getUser};