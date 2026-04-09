import mongoose from "mongoose"
import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"

// creating the schema
const userSchema = new mongoose.Schema(
      {
        name: {
            type:String,
            required:true
        },
        email: {
            type:String,
            required:true,
            unique:true
        },
        password: {
            type:String,
            required:true
        }
      },{
        timestamps:true
      }
   )  

// before storing the password we should hash the password
userSchema.pre("save", async function () {
     if (!this.isModified("password")) {
         return;
     }
     this.password = await bcrypt.hash(this.password, 10);
}) 

// creating function to match the password
userSchema.methods.isPasswordMatched = async function (password){
    return bcrypt.compare(password,this.password);
} 

// method to generate the access token once the user is login 
userSchema.methods.generateAccessToken = async function () {
    return jwt.sign({
        _id: this._id,
        name: this.name,
        email: this.email
    },process.env.ACCESS_TOKEN_SECRET);
}

// creating the model
const User = mongoose.model("User",userSchema);

export default User;