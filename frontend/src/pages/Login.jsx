import { useState, useEffect } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { Sparkles, Sun, Moon, Eye, EyeOff, Timer } from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";
import { useTheme } from "../context/ThemeContext.jsx";
import api from "../api/axios.js";
import Modal from "../components/Modal.jsx";

export default function Login() {
  const { user, login } = useAuth();
  const { theme, toggle } = useTheme();
  const loc = useLocation();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  const [forgotOpen, setForgotOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotStep, setForgotStep] = useState(1);
  const [forgotOtp, setForgotOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [forgotErr, setForgotErr] = useState("");
  const [forgotMsg, setForgotMsg] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotTimeLeft, setForgotTimeLeft] = useState(300);
  const [rememberMe, setRememberMe] = useState(false);

  useEffect(() => {
    if (forgotStep !== 2 || forgotTimeLeft <= 0) return;
    const timerId = setInterval(() => {
      setForgotTimeLeft((t) => t - 1);
    }, 1000);
    return () => clearInterval(timerId);
  }, [forgotStep, forgotTimeLeft]);

  if (user) return <Navigate to="/dashboard" replace />;

  const submit = async (e) => {
    e.preventDefault();
    setErr("");
    setLoading(true);
    try {
      await login(email, password, rememberMe);
      navigate(loc.state?.from || "/dashboard", { replace: true });
    } catch (e) {
      setErr(e.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const handleForgotSendOtp = async (e) => {
    e.preventDefault();
    setForgotErr("");
    setForgotMsg("");
    setForgotLoading(true);
    try {
      const res = await api.post("/auth/forgot-password", { email: forgotEmail });
      setForgotMsg(res.data.message);
      setForgotStep(2);
      setForgotTimeLeft(300);
    } catch (e) {
      setForgotErr(e.response?.data?.message || "Failed to send code");
    } finally {
      setForgotLoading(false);
    }
  };

  const handleForgotReset = async (e) => {
    e.preventDefault();
    setForgotErr("");
    setForgotLoading(true);
    try {
      await api.post("/auth/reset-password", { 
        email: forgotEmail, 
        otp: forgotOtp, 
        newPassword 
      });
      setForgotOpen(false);
      setEmail(forgotEmail);
      setPassword(newPassword);
      await login(forgotEmail, newPassword);
      navigate(loc.state?.from || "/dashboard", { replace: true });
    } catch (e) {
      setForgotErr(e.response?.data?.message || "Failed to reset password");
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <button
        onClick={toggle}
        className="fixed top-4 right-4 p-2.5 rounded-xl glass"
        aria-label="Toggle theme"
      >
        {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
      </button>

      <div className="w-full max-w-md">
        <Link
          to="/"
          className="flex items-center justify-center gap-2 mb-6"
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 text-white flex items-center justify-center shadow-lg shadow-brand-500/30">
            <Sparkles size={18} />
          </div>
          <span className="font-semibold text-lg">HabitIQ</span>
        </Link>

        <div className="card p-7">
          <h1 className="text-2xl font-semibold">Welcome back</h1>
          <p className="text-sm text-muted mt-1">
            Log in to continue your streaks.
          </p>

          <form onSubmit={submit} className="mt-6 space-y-4">
            <div>
              <label className="label">Email</label>
              <input
                className="input"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                autoFocus
              />
            </div>
            <div>
              <label className="label">Password</label>
              <div className="relative">
                <input
                  className="input pr-10"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-[var(--text)] transition-colors"
                  tabIndex="-1"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between mt-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500"
                />
                <span className="text-sm text-soft">Remember me</span>
              </label>

              <button
                type="button"
                onClick={() => {
                  setForgotOpen(true);
                  setForgotStep(1);
                  setForgotEmail(email);
                  setForgotErr("");
                  setForgotMsg("");
                  setForgotOtp("");
                  setNewPassword("");
                }}
                className="text-xs font-medium text-brand-600 dark:text-brand-400 hover:underline"
              >
                Forgot password?
              </button>
            </div>
            {err && (
              <div className="text-sm text-rose-500 bg-rose-500/10 border border-rose-500/20 rounded-lg px-3 py-2">
                {err}
              </div>
            )}
            <button
              type="submit"
              className="btn-primary w-full py-3"
              disabled={loading}
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </form>

          <div className="text-center mt-5 text-sm text-soft">
            Don't have an account?{" "}
            <Link to="/register" className="text-brand-600 dark:text-brand-300 font-medium">
              Create one
            </Link>
          </div>
        </div>
      </div>

      <Modal open={forgotOpen} onClose={() => setForgotOpen(false)} title="Reset Password" maxWidth="max-w-sm">
        {forgotStep === 1 ? (
          <form onSubmit={handleForgotSendOtp} className="space-y-4">
            <p className="text-sm text-soft">
              Enter the email address associated with your account and we'll send you a 6-digit reset code.
            </p>
            <div>
              <label className="label">Email Address</label>
              <input
                className="input"
                type="email"
                value={forgotEmail}
                onChange={(e) => setForgotEmail(e.target.value)}
                placeholder="you@example.com"
                required
                autoFocus
              />
            </div>
            {forgotErr && (
              <div className="text-sm text-rose-500 bg-rose-500/10 border border-rose-500/20 rounded-lg px-3 py-2">
                {forgotErr}
              </div>
            )}
            <button
              type="submit"
              className="btn-primary w-full justify-center py-2.5"
              disabled={forgotLoading}
            >
              {forgotLoading ? "Sending..." : "Send Reset Code"}
            </button>
          </form>
        ) : (
          <form onSubmit={handleForgotReset} className="space-y-4">
            {forgotMsg && (
              <div className="text-sm text-brand-600 dark:text-brand-300 bg-brand-500/10 border border-brand-500/20 rounded-lg px-3 py-2">
                {forgotMsg}
              </div>
            )}
            <div>
              <label className="label">6-Digit Code</label>
              <input
                className="input tracking-[0.5em] font-mono text-center"
                type="text"
                maxLength="6"
                value={forgotOtp}
                onChange={(e) => setForgotOtp(e.target.value.replace(/\D/g, ''))}
                placeholder="••••••"
                required
                autoFocus
              />
            </div>
            <div>
              <label className="label">New Password</label>
              <input
                className="input"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="At least 8 characters"
                minLength="8"
                required
              />
            </div>
            {forgotErr && (
              <div className="text-sm text-rose-500 bg-rose-500/10 border border-rose-500/20 rounded-lg px-3 py-2">
                {forgotErr}
              </div>
            )}
            <button
              type="submit"
              className="btn-primary w-full justify-center py-2.5 mt-2"
              disabled={forgotLoading || forgotTimeLeft <= 0}
            >
              {forgotLoading ? "Resetting..." : "Reset Password & Login"}
            </button>
            <div className="text-center mt-6 pt-2 pb-4 text-sm">
              {forgotTimeLeft > 0 ? (
                <p className="flex items-center justify-center gap-1.5 text-soft">
                  <Timer size={14} /> Code expires in: <span className="font-mono font-medium text-amber-600 dark:text-amber-400">{Math.floor(forgotTimeLeft / 60)}:{(forgotTimeLeft % 60).toString().padStart(2, "0")}</span>
                </p>
              ) : (
                <div>
                  <p className="text-rose-500 mb-2">Code expired</p>
                  <button
                    type="button"
                    onClick={handleForgotSendOtp}
                    className="text-brand-600 dark:text-brand-400 font-medium hover:underline flex items-center justify-center gap-1.5 mx-auto"
                    disabled={forgotLoading}
                  >
                    {forgotLoading ? "Sending..." : "Resend Verification Code"}
                  </button>
                </div>
              )}
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
