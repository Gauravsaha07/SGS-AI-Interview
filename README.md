# SGS - AI Powered Interview Practice Platform

> A full-stack, production-ready MERN web application engineered for intelligent job interview simulations, real-time credit purchases, speech recognition dictation, and natural-language admin analytics.

**Creator & Author**: **SGS**

---

## Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
- [Tech Stack](#tech-stack)
- [Project Folder Structure](#project-folder-structure)
- [Setup & Installation Instructions](#setup--installation-instructions)
  - [Prerequisites](#prerequisites)
  - [Environment Variables](#environment-variables)
  - [Installation Steps](#installation-steps)
  - [Running the Development Servers](#running-the-development-servers)
- [Admin User Setup](#admin-user-setup)
- [API Route Summary](#api-route-summary)
- [Screenshots & Visuals](#screenshots--visuals)
- [License & Footer](#license--footer)

---

## Overview

**SGS - AI Powered Interview Practice Platform** is a modern MERN stack application designed to help job seekers practice realistic technical, behavioral, and domain-specific interviews. Created and authored by **SGS**, the platform leverages Google's Gemini AI to dynamically generate tailor-made interview questions based on the candidate's exact target role, experience level, interview setting, and educational background. The application features browser-based voice dictation, per-question AI feedback, composite scoring out of 100 with full word-for-word transcript histories, a real-time Socket.io credit purchase and support chat workflow, and an Admin AI Assistant capable of answering platform analytics queries using live MongoDB data.

---

## Key Features

- **Role-Based Authentication**:
  - Unified single-input login accepting either an **Email Address** or a **10-digit Phone Number**.
  - Candidate registration collecting name, email, phone, password, location, and qualification.
  - Automatically awards **5 free credits** to new candidate accounts upon signup.
  - Enforces strict role separation (`candidate` vs `admin`) with no client-facing signup endpoint to claim admin privileges.
  - Persistent login surviving browser refresh via JWT tokens and auto-authentication endpoints.

- **AI-Powered Adaptive Interviews**:
  - 5-step structured configuration (Job Field, Role/Title, Experience, Difficulty, Setting/Type).
  - Generates a **minimum of 8 tailored questions** using candidate's educational qualification as contextual grounding.
  - One-by-one sequential question presentation.
  - Integrated **Web Speech API (`SpeechRecognition`)** for hands-free voice dictation into the answer input.
  - Per-question AI evaluations providing Strengths, Gaps, Better Way to Answer, and Question Score.
  - Smooth transition lines between questions (*"Okay, let's move to the next question"*).
  - Composite score calculation out of 100 upon completion with full transcript preservation.

- **Interview History & Word-for-Word Transcripts**:
  - Searchable log of past interviews detailing field, title, difficulty, setting, date, and composite score.
  - Expandable word-for-word transcript viewer formatted explicitly with `AI Generated Question XX`, `Candidate Answer XX`, and `AI Review on Candidate Answer XX`.

- **Credit System & Real-Time Socket.io Support Chat**:
  - Purchase fixed packages: 1 Credit (₹99), 3 Credits (₹249), 5 Credits (₹399), 10 Credits (₹849).
  - **Constrained Candidate Chat**: Candidates interact with support using structured actions (upload payment screenshot, ask *"Why is my credit request still pending?"*, or ask *"Why was my credit request rejected? I had done the payment"*).
  - **Admin Chat & Instant Verification**: Admin can send payment QR code images, free-text replies, and trigger one-click **Approve** or **Reject** decisions.
  - Real-time credit balance updates pushed via Socket.io directly to candidate sockets without requiring page refreshes.

- **Admin Dashboard & Live AI Assistant**:
  - Real-time MongoDB metrics cards (Users, Candidates, Admins, Interviews Conducted, Completed/In-Progress counts, Credit Requests Approved/Rejected/Pending, Total Credits Distributed).
  - Credit request queue with live chat drawers and candidate interview inspection tools.
  - **Admin AI Assistant**: Unlimited chat powered by Google Gemini AI with live database context (e.g. asking natural-language questions like *"how many active users right now"*).

---

## Tech Stack

- **Backend**: Node.js, Express.js, MongoDB, Mongoose ORM, Socket.io (real-time chat & balance updates), JWT (`jsonwebtoken`), `bcryptjs` (password hashing), `@google/generative-ai` (Google Gemini API).
- **Frontend**: React (JavaScript, Vite build tool), React Router v7, Tailwind CSS (utility classes), Socket.io Client, Lucide React Icons.
- **State Management**: React Context (`AuthContext` for authentication & credit state, `SocketContext` for Socket.io connection).

---

## Project Folder Structure

```
SGS-AI-Interview-Backend/
├── .env                      # Server environment configuration
├── .env.example              # Sample environment variable template
├── package.json              # Root backend package configuration & scripts
├── README.md                 # Project documentation
├── server/
│   ├── server.js             # Express entry point & Socket.io initialization
│   ├── config/
│   │   └── dbConfig.js       # Mongoose MongoDB connection module
│   ├── controllers/
│   │   ├── adminController.js     # Admin dashboard stats, chat & approvals
│   │   ├── authController.js      # Register, login & me endpoints
│   │   ├── creditController.js    # Credit packages, requests & candidate chat
│   │   └── interviewController.js # Interview setup, Gemini AI Q&A, scoring
│   ├── middleware/
│   │   └── authMiddleware.js      # JWT token verification & admin route guard
│   ├── model/
│   │   ├── CreditRequest.js  # Schema for purchase requests & chat messages
│   │   ├── Interview.js      # Schema for interview sessions & transcripts
│   │   └── User.js           # Schema for user profiles & credit balances
│   ├── routes/
│   │   ├── adminRoutes.js    # Admin API endpoints
│   │   ├── authRoutes.js     # Authentication API endpoints
│   │   ├── creditRoutes.js   # Credit purchase API endpoints
│   │   └── interviewRoutes.js# Interview session API endpoints
│   └── utils/
│       └── geminiService.js  # Google Gemini API helper service
└── client/                   # Vite React frontend application
    ├── index.html            # Entry HTML template
    ├── package.json          # Client dependencies & Vite scripts
    ├── postcss.config.js     # PostCSS Tailwind plugin configuration
    ├── tailwind.config.js    # Tailwind CSS theme extension
    ├── vite.config.js        # Vite configuration & API proxy setup
    └── src/
        ├── App.jsx           # Main React App routing & guards
        ├── index.css         # Tailwind base directives
        ├── main.jsx          # React DOM root renderer
        ├── components/
        │   ├── Footer.jsx    # SGS credit footer component
        │   ├── Navbar.jsx    # Responsive header & credit badge counter
        │   └── VoiceInput.jsx# Web Speech API speech-to-text dictation
        ├── context/
        │   ├── AuthContext.jsx   # Global user state & credit updater
        │   └── SocketContext.jsx # Socket.io connection provider
        └── pages/
            ├── AdminAiChatPage.jsx    # Admin Gemini AI Assistant with live DB context
            ├── AdminDashboard.jsx     # Admin analytics dashboard & approval queue
            ├── BuyCreditsPage.jsx     # Credit purchase package cards
            ├── CandidateDashboard.jsx # Candidate welcome center & practice CTAs
            ├── CreditHistoryPage.jsx  # Credit request history & constrained chat
            ├── InterviewHistoryPage.jsx# Word-for-word transcript archives
            ├── InterviewSessionPage.jsx# Live AI interview session & evaluation
            ├── InterviewSetupPage.jsx # 5-step interview setup configuration
            ├── LandingPage.jsx        # Public product landing page
            ├── LoginPage.jsx          # Unified email/phone sign-in page
            └── RegisterPage.jsx       # Candidate registration page (5 free credits)
```

---

## Setup & Installation Instructions

### Prerequisites

- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher
- **MongoDB**: A running MongoDB instance (Local or MongoDB Atlas)

### Environment Variables

Create or configure the `.env` file in the root directory (and/or inside `/server/.env`):

```env
PORT=5511
MONGO_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/SGS-AI-Interview-Practice
JWT_SECRET=your_jwt_secret_key_here
GEMINI_API_KEY=your_google_gemini_api_key_here
CLIENT_URL=http://localhost:5173
```

#### Explanation of Variables:
- `PORT`: The port number on which the backend Express server and Socket.io run (default: `5511`).
- `MONGO_URI`: The MongoDB connection string for database access.
- `JWT_SECRET`: Secret key used to sign and verify JSON Web Tokens.
- `GEMINI_API_KEY`: API Key obtained from Google AI Studio for Gemini API integration.
- `CLIENT_URL`: The origin URL of the React frontend app allowed by CORS policies (default: `http://localhost:5173`).

### Installation Steps

1. **Clone the Repository**:
   ```bash
   git clone https://github.com/your-repo/SGS-AI-Interview-Platform.git
   cd SGS-AI-Interview-Platform
   ```

2. **Install Server Dependencies**:
   ```bash
   npm install
   ```

3. **Install Client Dependencies**:
   ```bash
   cd client
   npm install
   cd ..
   ```

### Running the Development Servers

You can launch both the backend server and frontend client concurrently with a single command from the root directory:

```bash
npm run dev
```

Or run them individually in separate terminal windows:

- **Start Backend Server Only**:
  ```bash
  npm run server
  ```
  *(Server runs at `http://localhost:5511`)*

- **Start Frontend Client Only**:
  ```bash
  npm run client
  ```
  *(Client runs at `http://localhost:5173`)*

---

## Admin User Setup

By design, no client-facing signup endpoint permits users to register as an admin. All public registrations create candidate accounts.

To promote a candidate user to an **Admin**, modify the target user document directly inside your MongoDB database (e.g. using MongoDB Compass or Mongo Shell):

```json
{
  "userType": "admin"
}
```

Upon signing in with an updated user document, the platform automatically recognizes the `admin` role and redirects the user to the `/admin/dashboard` panel.

---

## API Route Summary

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :---: |
| **POST** | `/api/auth/register` | Register a new candidate user (gives 5 credits) | No |
| **POST** | `/api/auth/login` | Login with Email or 10-digit Phone Number | No |
| **GET** | `/api/auth/me` | Auto-authenticate user and return profile | Yes |
| **POST** | `/api/interviews/start` | Start interview session (deducts 1 credit, generates questions via Gemini) | Yes |
| **POST** | `/api/interviews/:id/answer` | Submit answer to a question and get instant AI review | Yes |
| **GET** | `/api/interviews/history` | Get candidate's past interview session summary | Yes |
| **GET** | `/api/interviews/:id` | Get full word-for-word transcript for an interview | Yes |
| **GET** | `/api/credits/packages` | List available fixed credit purchase packages | No |
| **POST** | `/api/credits/request` | Create a new credit purchase request | Yes |
| **GET** | `/api/credits/history` | Get user's credit request history | Yes |
| **GET** | `/api/credits/request/:id` | Get credit request details and chat messages | Yes |
| **POST** | `/api/credits/request/:id/message` | Send constrained candidate message/screenshot | Yes |
| **GET** | `/api/admin/stats` | Fetch live platform metrics from MongoDB | Yes (Admin) |
| **GET** | `/api/admin/credit-requests` | Fetch pending or filtered credit purchase queue | Yes (Admin) |
| **POST** | `/api/admin/credit-requests/:id/status` | Approve or Reject credit request & add credits | Yes (Admin) |
| **POST** | `/api/admin/credit-requests/:id/message` | Send admin chat reply or payment QR code | Yes (Admin) |
| **POST** | `/api/admin/chat` | Admin AI Assistant query with live DB metrics | Yes (Admin) |
| **GET** | `/api/admin/users/:userId/interviews` | Read-only inspection of candidate interview history | Yes (Admin) |

---

## Screenshots & Visuals

<!-- Drop your application screenshots here -->
<!-- ![Candidate Dashboard](./docs/screenshots/dashboard.png) -->
<!-- ![Interview Practice Session](./docs/screenshots/interview.png) -->
<!-- ![Credit History & Live Chat](./docs/screenshots/credits_chat.png) -->
<!-- ![Admin Analytics Panel](./docs/screenshots/admin_dashboard.png) -->

---

## License & Footer

This project is licensed under the [MIT License](LICENSE).

---

<div align="center">
  <sub>Built with ❤️ by <strong>SGS</strong></sub>
</div>
