import mongoose from "mongoose"

const quizResultSchema = new mongoose.Schema({
    user:{
       type:mongoose.Schema.Types.ObjectId,
       ref: "User",
       required:true
    },
    role: {
        type:String,
        default: ""
    },
    company: {
        type:String,
        default: ""
    },
    skills: {
        type: [String],
        default: []
    },
    score: {
        type:Number,
        required:true,
    },
    totalQuestions: {
        type:Number,
        required:true
    },
    percentage: {
        type:Number
    },
    answers: [
        {
            question:String,
            selectedOption:String,
            correctAnswer:String,
            isCorrect:Boolean
        },
    ],
    feedback: {
        type:String,
        default: ""
    }
},
{
    timestamps:true
}) 

export default mongoose.model("QuizResult",quizResultSchema);