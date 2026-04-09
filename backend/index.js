import dotenv from "dotenv/config"
import {app} from "./app.js"
import { connectDb } from "./src/config/db.js"

const PORT = process.env.PORT || 5000;

// lets call the connectdb connection
// if connection is successfull then start the server 
connectDb()
.then(() => {
    app.listen(PORT,() => {
        console.log(`server is running on ${PORT}`);
        console.log(`cors allowed origin : ${process.env.FRONTEND_URL || 'http://localhost:5173'}`);
    })
})
.catch((error) => {
    console.log("error in connecting the database" , error);
    process.exit(1);
})