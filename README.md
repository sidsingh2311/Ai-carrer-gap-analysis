🎯 AI-Powered Career Gap Analysis & Interview Preparation Platform

An AI-powered platform that helps students and job seekers identify skill gaps, improve their resumes, prepare for technical interviews, and track their career progress.

Users can upload their resumes, select a target job role, analyze missing skills, generate personalized learning roadmaps, practice with AI-powered quizzes and mock interviews, and interact with Tess, an AI career companion that provides personalized guidance using conversational memory.

⸻

📌 Table of Contents

* About the Project
* Key Features
* Tess — AI Career Companion
* Technology Stack
* Project Structure
* Getting Started
* Environment Variables
* Deployment
* Limitations
* Future Enhancements
* Contributors
* Acknowledgements

⸻

📖 About the Project

Choosing a career path and preparing for a job can be challenging. Students often struggle to identify the skills required for a particular role, understand what is missing from their resumes, and prepare effectively for interviews.

This project addresses these challenges by bringing career analysis and interview preparation tools together in a single platform.

The application analyzes a user’s resume against a target role, identifies existing and missing skills, and generates a personalized learning roadmap. It also provides job description matching, adaptive quizzes, AI-powered mock interviews, application tracking, and an AI career companion.

The goal is to make career preparation more structured, personalized, and accessible.

⸻

✨ Key Features

📄 1. AI-Powered Resume Analysis

* Upload a PDF resume for analysis.
* Evaluate resume relevance to a target job role.
* Identify existing skills and missing skills.
* Generate a personalized learning roadmap.
* Receive AI-generated recommendations for career improvement.

🎯 2. Job Description Matching

* Compare your resume with a specific job description.
* Identify matching and missing keywords.
* Understand the skills employers are looking for.
* Get suggestions to improve resume bullet points.

🧠 3. Adaptive Quiz Generation

* Generate multiple-choice questions based on your target role and skills.
* Practice relevant technical concepts.
* Review previous quiz attempts and track your preparation.

🎤 4. AI-Powered Mock Interviews

Practice interviews through different modes:

* Technical Interview: Practice technical questions related to your target role.
* Behavioural Interview: Prepare answers using the STAR method.
* System Design Interview: Practice system design concepts.
* Rapid-Fire Interview: Test your knowledge with quick questions.

The platform generates questions and model answers tailored to the user’s role, skills, and experience level.

🤖 5. Tess — AI Career Companion

Tess is an AI-powered career companion designed to provide personalized career guidance.

Key capabilities include:

* Context-aware conversations.
* Retrieval-augmented generation (RAG).
* Personalized guidance based on relevant user history.
* Retrieval of relevant information from a career knowledge base.
* Conversational memory for more contextual responses.

Tess was developed collaboratively by Siddharth Singh and Rohit Kumar.

📊 6. Application and Progress Tracking

* Track job applications.
* Monitor interview preparation activities.
* Review progress through a centralized dashboard.
* Organize career preparation in one place.

🔐 7. Authentication and Data Management

* User registration and login.
* JWT-based authentication.
* Password hashing using bcrypt.
* User-specific data management.

⸻

🤖 Tess — AI Career Companion

Tess uses a Retrieval-Augmented Generation (RAG) approach to provide more personalized responses.

Instead of treating every conversation as completely independent, the system retrieves relevant context from available user history and career-related information.

How Tess Works

1. User Input: The user asks a career-related question.
2. Context Retrieval: Relevant information is retrieved from available user history and the career knowledge base.
3. Prompt Construction: The retrieved context is combined with the user’s question.
4. AI Response: The language model generates a contextual response.
5. Memory Update: The conversation is saved for future context retrieval.

This approach helps Tess provide guidance that is more relevant to the user’s career goals and previous interactions.

⸻

🛠️ Technology Stack

Frontend

* React
* Vite
* Tailwind CSS
* Framer Motion
* React Router DOM
* Axios
* Recharts
* Lucide React

Backend

* Node.js
* Express.js
* Mongoose
* JSON Web Tokens (JWT)
* bcryptjs
* Multer
* dotenv
* CORS

Database

* MongoDB
* MongoDB Atlas

AI and Generative AI

* Groq API
* Google Gemini API
* Retrieval-Augmented Generation (RAG)
* Text embeddings for contextual retrieval

Resume Processing

* pdf-parse
* pdfjs-dist

Development and Deployment

* Git and GitHub
* Postman
* npm
* Vercel
* MongoDB Atlas

⸻

📁 Project Structure

Ai-carrer-gap-analysis/
├── backend/
│   ├── controllers/
│   ├── routes/
│   ├── models/
│   ├── middlewares/
│   ├── index.js
│   └── ...
├── frontend/
│   └── aicarrer/
│       ├── src/
│       ├── public/
│       ├── package.json
│       └── ...
├── .gitignore
└── README.md

Note: Update the directory tree to match the actual files and folders in your repository.

⸻

🚀 Getting Started

Follow these steps to run the project locally.

Prerequisites

Make sure you have the following installed:

* Node.js 18 or newer
* npm
* MongoDB Atlas account or a local MongoDB instance
* Groq API key
* Google Gemini API key

1. Clone the Repository

git clone https://github.com/sidsingh2311/Ai-carrer-gap-analysis.git
cd Ai-carrer-gap-analysis

2. Set Up the Backend

cd backend
npm install

Create a .env file inside the backend directory and configure the required environment variables.

Start the backend using the script configured in your package.json. For example:

npm run dev

If your project uses a different script, use the appropriate command.

3. Set Up the Frontend

Open another terminal and run:

cd frontend/aicarrer
npm install
npm run dev

Vite will display the local development URL, usually:

http://localhost:5173

4. Configure the Environment

Ensure that the frontend is connected to the correct backend URL and that the backend has valid database credentials and AI API keys.

⸻

🔑 Environment Variables

Create a .env file inside the backend directory.

Example configuration:

PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
GROQ_API_KEY=your_groq_api_key
GEMINI_API_KEY=your_gemini_api_key
CLIENT_URL=http://localhost:5173

For the frontend, configure the backend API URL if your application uses this variable:

VITE_API_URL=http://localhost:5000

Important:

* Replace the placeholder values with your actual configuration.
* Never commit API keys, database credentials, or JWT secrets to GitHub.
* Check the environment variable names used in your source code and adjust this example accordingly.

⸻

☁️ Deployment

The application uses the following deployment technologies:

Component	Technology
Frontend	Vercel
Backend	Node.js-compatible hosting platform
Database	MongoDB Atlas
AI Services	Groq API and Google Gemini API

Configure the required environment variables on your hosting platforms before deploying.

The frontend must point to the deployed backend API rather than the local development URL.

Live Demo: AI Career Gap Analysis

⸻

⚠️ Limitations

* AI-generated recommendations and answers may occasionally be inaccurate.
* Resume processing currently focuses on text-based PDF files.
* Scanned or image-only resumes may not be supported.
* Mock interviews are text-based.
* The platform primarily focuses on software engineering and computer science career preparation.
* Direct integration with job boards may not be available.

⸻

🔮 Future Enhancements

Potential improvements include:

* Voice-based AI mock interviews.
* OCR support for scanned resumes.
* Integration with job boards and live job descriptions.
* Expanded question banks for additional professional domains.
* More advanced career recommendations.
* A mobile-friendly application experience.

⸻

👥 Contributors

This project was developed collaboratively, with contributions across its platform features.

Contributor	Contribution
Siddharth Singh	Project development and integration
Rohit Kumar	Collaborative development of Tess, the AI career companion

Tess was developed collaboratively by Siddharth Singh and Rohit Kumar as part of this project.

⸻

🙏 Acknowledgements

* Prof. Vimal Gupta, Department of Computer Science and Engineering, JSS Academy of Technical Education, Noida.
* Groq for its language model API.
* Google Gemini for its generative AI capabilities.
* MongoDB Atlas for database hosting.
* Vercel for frontend deployment.
* The open-source community for the tools and libraries used in this project.

⸻

📄 License

A license has not yet been specified for this repository.

If you intend to make the project open source, consider adding a suitable LICENSE file and updating this section.

⸻

<div align="center">

⭐ If you find this project useful, consider giving it a star!

Built to make career preparation smarter, more personalized, and more accessible.

</div>
