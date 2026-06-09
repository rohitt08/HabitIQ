import { Suspense, lazy } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import AppLayout from "./components/AppLayout.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import LoadingSpinner from "./components/LoadingSpinner.jsx";

const Landing = lazy(() => import("./pages/Landing.jsx"));
const Login = lazy(() => import("./pages/Login.jsx"));
const Register = lazy(() => import("./pages/Register.jsx"));
const Dashboard = lazy(() => import("./pages/Dashboard.jsx"));
const Habits = lazy(() => import("./pages/Habits.jsx"));
const Weekly = lazy(() => import("./pages/Weekly.jsx"));
const Insights = lazy(() => import("./pages/Insights.jsx"));

export default function App() {
  return (
    <Suspense fallback={<div className="h-screen w-full flex items-center justify-center"><LoadingSpinner /></div>}>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/habits" element={<Habits />} />
          <Route path="/weekly" element={<Weekly />} />
          <Route path="/insights" element={<Insights />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}
