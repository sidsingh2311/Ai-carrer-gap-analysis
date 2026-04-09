import { generateQuizFromAI } from "../services/quiz.services.js";
import QuizResult from "../models/quizresult.model.js";

// making the functio to generate quiz
export const generateQuiz = async (req , res) => {
    try{
          const {role,company,skills} = req.body;
          if(!role && !company) {
             return res.status(400).json({
                success:false,
                message: "role and company are required",
                data: {}
             })
          } 
          const quiz = await generateQuizFromAI(role,company,skills);
          return res.status(200).json({
            success:true,
            message: "quiz returned success",
            data: quiz.questions
          })
    }
    catch(error) {
        console.log("quiz error : ",error);
        return res.status(500).json({
            success:false,
            message: "error in generating the quiz",
            data: {}
        })
    }
}  



export const evaluateQuizController = async (req , res) => {
     try{
           const {questions,userAnswers,role,company,skills} = req.body;
           if(!questions || !userAnswers) {
                return res.status(400).json({
                    success:false,
                    message: "questions and user answers are required",
                    data: {}
                })
           } 

           let score=0;
           const resultDetails=[];

           // calculating the score of the candidate 
           questions.forEach((q,index) => {
               const iscorrect = q.correctAnswer === userAnswers[index];

               if(iscorrect) score++;
               // now putting the each user response in to the answer
               resultDetails.push({
                question:q.question,
                selectedOption: q.options[userAnswers[index]],
                correctAnswer: q.options[q.correctAnswer],
                isCorrect: iscorrect,
               })
           }) 

           const percentage = ((score / questions.length) * 100).toFixed(2);

           // Saving to database
           await QuizResult.create({
               user: req.user._id,
               role: role || "",
               company: company || "",
               skills: skills || [],
               score,
               totalQuestions: questions.length,
               percentage: parseFloat(percentage),
               answers: resultDetails,
               feedback: `Assessment for ${role} completed with ${percentage}% score.`
           });

           // sending the response to th frontend
           return res.status(200).json({
               success:true,
               message: "quiz analyzed and saved successfully",
               data: {
                  totalQuestions: questions.length,
                  score,
                   percentage,
                   result: resultDetails.map(r => ({
                       ...r,
                       userAnswer: userAnswers[questions.findIndex(q => q.question === r.question)],
                       correctAnswer: questions.find(q => q.question === r.question).correctAnswer,
                       iscorrect: r.isCorrect
                   })),
               }
           })
     }
     catch(error) {
        console.log("evaluation error",error);
        return res.status(500).json({
            success:false,
            message: "error in evaluating the message",
            data: {}
        })
     }
} 

