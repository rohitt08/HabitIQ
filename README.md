# HabitIQ

![HabitIQ](https://img.shields.io/badge/Status-Active-brightgreen.svg)
![License](https://img.shields.io/badge/License-ISC-blue.svg)

HabitIQ is a full-stack, intelligent habit-tracking web application built using the MERN stack (MongoDB, Express.js, React, Node.js) and powered by AI. It helps users build positive routines, track their progress over time, and gain personalized, AI-driven insights (powered by Google Gemini) into their habits.

## 🚀 Features

- **User Authentication**: Secure signup and login using JWT and bcrypt.
- **Habit Management**: Create, view, update, and delete habits with ease.
- **Weekly Tracking & Logging**: Interactive weekly views for quick logging of daily habits.
- **Detailed Statistics**: Visual charts and graphs (via Recharts) displaying your progress, streaks, and completion rates.
- **AI-Powered Insights**: Get actionable, intelligent insights and recommendations on your habits powered by Google Gemini GenAI.
- **Responsive UI**: A modern, clean, and responsive user interface built with Tailwind CSS.

## 🛠️ Technology Stack

### Frontend
- **Framework**: React 19 + Vite
- **Styling**: Tailwind CSS
- **Routing**: React Router DOM
- **Charts/Graphs**: Recharts
- **Icons**: Lucide React & React Icons
- **Drag & Drop**: @dnd-kit/core

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose
- **Authentication**: JSON Web Tokens (JWT) & bcryptjs
- **AI Integration**: `@google/genai` (Google Gemini)

## 📁 Project Structure

```text
HabitIQ/
├── backend/               # Node.js / Express backend
│   ├── config/            # Database and environment configurations
│   ├── controllers/       # Route handlers containing business logic
│   ├── middleware/        # Custom middleware (e.g., authentication)
│   ├── models/            # Mongoose schemas (User, Habit, HabitLog, AIInsight)
│   ├── routes/            # Express API routes
│   ├── scripts/           # Database seeding and utility scripts
│   ├── utils/             # Helper functions
│   ├── server.js          # Entry point for the backend server
│   └── package.json       # Backend dependencies and scripts
│
└── frontend/              # React / Vite frontend
    ├── public/            # Static assets
    ├── src/
    │   ├── api/           # API integration and Axios configuration
    │   ├── assets/        # Images, fonts, etc.
    │   ├── components/    # Reusable React components (Layout, ProtectedRoute, etc.)
    │   ├── context/       # React Context providers for state management
    │   ├── pages/         # Top-level page components (Dashboard, Insights, Stats, etc.)
    │   ├── utils/         # Frontend helper functions
    │   ├── App.jsx        # Main application routing
    │   ├── main.jsx       # React application entry point
    │   └── index.css      # Global styles & Tailwind configuration
    ├── index.html         # Main HTML template
    ├── vite.config.js     # Vite configuration
    └── package.json       # Frontend dependencies and scripts
```

## 🏁 Getting Started

### Prerequisites

- Node.js (v18 or higher recommended)
- MongoDB (local or Atlas)
- Google Gemini API Key (for AI insights)

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/rohitt08/HabitIQ.git
   cd HabitIQ
   ```

2. **Setup the Backend:**
   ```bash
   cd backend
   npm install
   ```
   - Create a `.env` file in the `backend/` directory and add your environment variables (e.g., `PORT`, `MONGO_URI`, `JWT_SECRET`, `GEMINI_API_KEY`).
   - Run the server:
     ```bash
     npm run dev
     ```

3. **Setup the Frontend:**
   ```bash
   cd ../frontend
   npm install
   ```
   - Create a `.env` file in the `frontend/` directory for any required frontend variables (e.g., `VITE_API_URL`).
   - Run the development server:
     ```bash
     npm run dev
     ```

4. **Open in Browser:**
   Navigate to `http://localhost:5173` (or the port Vite provides) to start using HabitIQ!

## 📜 License

This project is licensed under the ISC License.
