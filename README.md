# 🌟 HabitIQ

[![Status](https://img.shields.io/badge/Status-Active-brightgreen.svg)]()
[![License](https://img.shields.io/badge/License-ISC-blue.svg)]()
[![React](https://img.shields.io/badge/React-19-blue.svg)]()
[![Node.js](https://img.shields.io/badge/Node.js-Backend-success.svg)]()
[![MongoDB](https://img.shields.io/badge/MongoDB-Database-brightgreen.svg)]()
[![Gemini](https://img.shields.io/badge/Google%20Gemini-AI%20Powered-orange.svg)]()

> **HabitIQ** is an intelligent, full-stack habit-tracking application designed to help users build sustainable positive routines. Powered by the MERN stack and Google Gemini AI, HabitIQ transcends traditional tracking by offering personalized, actionable insights based on user behavior and consistency.

---

## 📖 Table of Contents
- [Architecture Overview](#-architecture-overview)
- [Key Features](#-key-features)
- [Technology Stack](#-technology-stack)
- [Project Structure](#-project-structure)
- [Security & Integrity](#-security--integrity)
- [Getting Started](#-getting-started)
- [Environment Variables](#-environment-variables)
- [License](#-license)

---

## 🏛️ Architecture Overview

HabitIQ follows a modern client-server architecture, ensuring clear separation of concerns, scalability, and maintainability:

- **Client Layer (Frontend):** A Single Page Application (SPA) built with React 19 and Vite. State is managed via React Context, and navigation is handled by React Router. The UI is highly responsive and styled with Tailwind CSS, utilizing `Recharts` for data visualization.
- **API Layer (Backend):** A robust RESTful API built on Node.js and Express. It features dedicated controllers, middleware for rate-limiting and JWT authentication, and structured routing.
- **Data Layer:** MongoDB handles persistence via Mongoose ODM. Data schemas are heavily normalized for users, habits, and execution logs to allow for complex queries and aggregations.
- **AI Integration:** Google Gemini (`@google/genai`) is seamlessly integrated to periodically analyze user habit logs, streak data, and completion rates to deliver personalized behavioral insights.

---

## ✨ Key Features

- **Secure Authentication:** JWT-based stateless authentication with hashed passwords (bcrypt) and robust rate-limiting to prevent brute-force attacks.
- **Email Verification (OTP):** Secure one-time password (OTP) verification for registration and password resets, ensuring account integrity.
- **Comprehensive Habit Management:** Full CRUD capabilities with drag-and-drop interface for ordering habits.
- **Interactive Dashboards:** Weekly tracking views and real-time statistics, including streak calculations and completion heatmaps.
- **Generative AI Insights:** Analyzes user data through Google Gemini to generate encouraging feedback, routine optimization tips, and habit correlation insights.
- **Responsive & Accessible UI:** Mobile-first design principles ensure the application looks and performs beautifully across all device sizes.

---

## 💻 Technology Stack

### Frontend Ecosystem
- **Core:** React 19, Vite
- **Styling:** Tailwind CSS
- **Routing:** React Router DOM
- **Data Visualization:** Recharts
- **UX Enhancements:** Lucide React (Icons), `@dnd-kit/core` (Drag & Drop)

### Backend Ecosystem
- **Core:** Node.js, Express.js
- **Database:** MongoDB, Mongoose ODM
- **Security:** JSON Web Tokens (JWT), bcryptjs, Helmet, express-mongo-sanitize
- **Services:** Nodemailer (Email/OTP routing), `@google/genai` (AI Integrations)
- **Task Scheduling:** node-cron (for periodic AI analysis and reminders)

---

## 📁 Project Structure

```text
HabitIQ/
├── backend/                  # RESTful API Service
│   ├── config/               # Database connections and constants
│   ├── controllers/          # Business logic and request handling
│   ├── middleware/           # Auth, logging, and error handling
│   ├── models/               # Mongoose schemas (User, Habit, Otp, etc.)
│   ├── repositories/         # Data access layer abstraction
│   ├── routes/               # API endpoint definitions
│   ├── services/             # External service integrations (Email, AI)
│   ├── utils/                # Helper functions and loggers
│   └── server.js             # Application entry point
│
└── frontend/                 # React SPA
    ├── public/               # Static assets
    ├── src/
    │   ├── api/              # Axios instances and interceptors
    │   ├── components/       # Reusable UI components
    │   ├── context/          # Global state management
    │   ├── pages/            # View components (Dashboard, Login, etc.)
    │   └── App.jsx           # Root component and router
    └── vite.config.js        # Build configuration
```

---

## 🛡️ Security & Integrity

HabitIQ is designed with security best practices in mind to protect user data:
- **Environment Variables:** All sensitive credentials, API keys, and database URIs are strictly managed via `.env` files and are **never** committed to version control.
- **Data Sanitization:** Implements `express-mongo-sanitize` to prevent NoSQL injection attacks.
- **Rate Limiting:** `express-rate-limit` is used on critical endpoints (login, registration, OTP generation) to mitigate DDoS and brute-force attempts.
- **HTTP Headers:** Uses `Helmet` to secure Express apps by setting various HTTP headers.
- **Secure Password Storage:** Passwords are never stored in plaintext. They are hashed and salted using `bcryptjs`.

---

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher)
- [MongoDB](https://www.mongodb.com/) (Local instance or MongoDB Atlas)
- Google Gemini API Key

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/rohitt08/HabitIQ.git
   cd HabitIQ
   ```

2. **Setup the Backend**
   ```bash
   cd backend
   npm install
   ```
   Create your `.env` file (see [Environment Variables](#-environment-variables)), then start the development server:
   ```bash
   npm run dev
   ```

3. **Setup the Frontend**
   ```bash
   cd ../frontend
   npm install
   ```
   Create your frontend `.env` file, then start the Vite development server:
   ```bash
   npm run dev
   ```

4. **Access the Application**
   Open `http://localhost:5173` in your browser.



## 📜 License

This project is licensed under the [ISC License](LICENSE).

---
*Designed with ❤️ for building better habits.*
