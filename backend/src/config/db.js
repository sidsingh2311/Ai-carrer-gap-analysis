import mongoose from "mongoose"

// writing function to connect the mongodb
const connectDb = async () => {
    try{
          const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URI}`);
          console.log(`✅ MongoDB Connected: ${connectionInstance.connection.host}`);
          
    }
    catch(error) {
        console.log("something went wrong in the databse", error);
        process.exit(1);
    }
} 

export {connectDb}