import express from "express"
import cors from "cors"
import authRoutes from "./src/routes/auth.routes.js"
import userRoutes from "./src/routes/user.routes.js"
import analysisRoutes from "./src/routes/analysis.routes.js"
import quizRoutes from "./src/routes/quiz.routes.js"
import quizResultsRoutes from "./src/routes/quizResult.routes.js"
import progressRoutes from "./src/routes/progress.routes.js"
import interviewRoutes from "./src/routes/interview.routes.js"

// creating an instance of the express
const app = express();
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true
}))
app.use(express.json({limit:"200kb"}));
app.use(express.urlencoded({limit: "200kb", extended: true}));
app.use(express.static("public")); 

app.use("/api/auth",authRoutes);
app.use("/api/user",userRoutes);
app.use("/api/analysis",analysisRoutes);
app.use("/api/quiz",quizRoutes);
app.use("/api/quiz-result",quizResultsRoutes);
app.use("/api/progress",progressRoutes);
app.use("/api/interview",interviewRoutes);


export {app};