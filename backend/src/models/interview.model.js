import mongoose from "mongoose";

// creating the question schema 
const questionSchema = new mongoose.Schema({
    question: {
        type:String,
        required: true
    },
    idealAnswer: {
        type:String,
    },
    userAnswer: {
        type:String,
        default: ""
    },
    feedback: {
        type:String,
        default: ""
    },
    score: {
        type:Number,
        default: 0
    }
}) 

// creating the interview schema 
const interviewSchema = new mongoose.Schema({
    user: {
        type:mongoose.Schema.Types.ObjectId,
        ref: "User",
        required:true,
    },
    role: {
        type:String,
        required:true,
    },
    company: {
        type:String,
    },
    level: {
        type:String,
        enum: ["beginner","intermediate","advanced"],
        required:true
    },
    // adding the question shcmea so that each of the interivew set contains the 
    // entire questions and answer helping the user to fetch all the details easily
    questions: [questionSchema],
    currentQuestionIndex: {
        type:Number,
        default: 0,
    },
    status: {
        type:String,
        enum: ["in-progress","completed"],
        default: "in-progress"
    },
},
{
    timestamps:true
}) 

export default mongoose.model("interview",interviewSchema);
