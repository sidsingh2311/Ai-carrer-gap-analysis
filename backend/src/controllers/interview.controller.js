import Interview from "../models/interview.model.js";
import {
  generateQuestions,
  evaluateAnswer,
} from "../services/interview.service.js"; 
 
// creating the function of starting the interview 
export const startInterview = async (req , res) => {
    try{
          const {role,skills,level,company} = req.body;
          // calling the generate question services from the groq ai
          const questions = await generateQuestions(role,skills,level);
          const interview = await Interview.create({
             user: req.user._id,
             role,
             company,
             skills,
             level,
             questions,
          }) 

          return res.status(200).json({
            succes:true,
            message: "started the interview",
            data: interview
          })
    }
    catch(error) {
        console.log(error.message);
        return res.status(500).json({
            success:false,
            message: "error in starting the interview",
            data: {}
        })
    }
}  

// creating the function to submit the answer
export const submitAnswer = async (req , res) => {
    try{
          const {interviewId,userAnswer} = req.body;
          // finding the interview by the interview Id
          const interview = await Interview.findById(interviewId);
          const index = interview.currentQuestionIndex;
          const currentQuestion = interview.questions[index];
           
          // sending the current question response to the ai to eveluate
          const evaluation = await evaluateAnswer(
            currentQuestion.question,
            currentQuestion.answer,
            userAnswer    
        ) 

        // saving the data to the databse
        currentQuestion.userAnswer = userAnswer;
        currentQuestion.feedback = evaluation.feedback;
        currentQuestion.score = evaluation.score;

        // once this question processing is completed moving on the the next quesiont 
        interview.currentQuestionIndex=interview.currentQuestionIndex+1;
        // checking if all the quesiton have been finished
        if(interview.currentQuestionIndex>=interview.questions.length) {
            interview.status = "completed"
            // savking the current interview state in the databse 
            await interview.save();
            return res.status(200).json({
                completed:true,
                message: "interview completed",
                interview
            })
        }  

        // if the interview is not finsished still save the interview in the dagtabse 
        await interview.save();
        // returning the next question and updated interview in the response
        return res.status(200).json({
            completed:false,
            interview,
            nextQuestion: interview.questions[interview.currentQuestionIndex]
        })

    }
    catch(error) {
        return res.status(500).json({
            success:false,
            message: "error in submitting the answer",
            data: {}
        })
    }
}


