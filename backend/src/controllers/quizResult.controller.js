import QuizResult from "../models/quizresult.model.js"

// creating the function to save the result 
export const saveQuizResultController = async (req , res) => {
    try{
         const userId = req.user?._id;
         const {score,totalQuestions,answers,role,company,skills,feedback} = req.body;

         if(!score && !totalQuestions) {
            return res.status(400).json({
                success:false,
                message: "score and total questions are required",
                data: {}
            })
         } 
         const percentage = (score / totalQuestions) * 100;
         const result = await QuizResult.create({
            user:userId,
            score,
            totalQuestions,
            answers,
            role,
            company,
            skills,
            feedback
         }) 

         return res.status(200).json({
            success:true,
            message: "data saved successfully",
            data: {}
         })
    }
    catch(error) {
        console.log(error);
        return res.status(500).json({
            success:false,
            message: "error in saving the data",
            data: {}
        })
    }
} 

// creating the function to get the result from the databse 
export const getUserQuizResultController = async (req,res) => {
    try{
          const userId = req.user?._id;
          const results = await QuizResult.find({user: userId}).sort({createdAt:-1}); 

          return res.status(200).json({
               success:true,
               message: "quiz result got successfully from the databse",
               data: results
          })

    }
    catch(error) {
        return res.status(500).json({
            success:false,
            message: "error in getting the result from database",
            data: {}
        })
    }
} 

// creating the function to get the single result of the user 
export const getSingleQuizResultController = async (req,res) => {
      try{
            const {id }=req.params;
            const userId = req.user?._id;
 
            const result = await QuizResult.findOne({
                _id:id,
                user: userId,
            }) 

            if(!result) {
                return res.status(400).json({
                    success:false,
                    message: "result not found",
                    data: {}
                })
            } 

            return res.status(200).json({
                success:true,
                message: "get the rresult",
                data: result
            })

      }
      catch(error) {
        return res.status(500).json({
            success:false,
            message: "error in fetching the result",
            data: {}
        })
      }
}
