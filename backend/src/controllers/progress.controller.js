import quizresultModel from "../models/quizresult.model.js"; 

// making the functi/on to get the progress 
export const getProgessControllerDashboard = async (req, res) => {
    try {
        const userId = req.user?._id;
        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized access",
                data: {}
            });
        }

        const results = await quizresultModel.find({ user: userId }).sort({ createdAt: 1 });

        if (!results || results.length === 0) {
            return res.status(200).json({
                success: true,
                message: "No result data found",
                data: {
                    totalQuiz: 0,
                    averageScore: 0,
                    highestscore: 0,
                    lowestscore: 0,
                    overallPercentage: 0,
                    trend: []
                }
            });
        }

        const totalQuizzes = results.length;
        let totalScoreSum = 0;
        let totalQuestionsSum = 0;
        let highest = -Infinity;
        let lowest = Infinity;

        const trend = results.map((r) => {
            const percentage = r.percentage || (r.score / r.totalQuestions) * 100;
            totalScoreSum += r.score;
            totalQuestionsSum += r.totalQuestions;

            if (percentage > highest) highest = percentage;
            if (percentage < lowest) lowest = percentage;

            return {
                date: r.createdAt,
                score: r.score,
                percentage: parseFloat(percentage.toFixed(2)),
                role: r.role,
                company: r.company
            };
        });

        const overallPercentage = (totalScoreSum / totalQuestionsSum) * 100;
        const averageScore = overallPercentage; // Average is same as overall percentage in this context

        return res.status(200).json({
            success: true,
            message: "Progress calculated successfully",
            data: {
                totalQuiz: totalQuizzes,
                averageScore: parseFloat(averageScore.toFixed(2)),
                highestscore: parseFloat(highest.toFixed(2)),
                lowestscore: parseFloat(lowest.toFixed(2)),
                overallPercentage: parseFloat(overallPercentage.toFixed(2)),
                trend: trend,
            },
        });

    } catch (error) {
        console.error("Progress dashboard error:", error);
        return res.status(500).json({
            success: false,
            message: "Error in fetching the details",
            data: {}
        });
    }
}
