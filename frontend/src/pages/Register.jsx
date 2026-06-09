import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { Sparkles, Sun, Moon, ArrowRight, CheckCircle2 } from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";
import { useTheme } from "../context/ThemeContext.jsx";

export default function Register() {
  const { user, register, sendOtp, verifyOtp } = useAuth();
  const { theme, toggle } = useTheme();
  const navigate = useNavigate();

  // Wizard state
  const [step, setStep] = useState(1); // 1: Email, 2: OTP, 3: Password
  const [form, setForm] = useState({ name: "", email: "", otp: "", password: "" });
  
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  if (user) return <Navigate to="/dashboard" replace />;

  const set = (k) => (e) => {
    setForm({ ...form, [k]: e.target.value });
    setErr("");
  };

  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim()) {
      setErr("Name and email are required");
      return;
    }
    setErr("");
    setLoading(true);
    try {
      await sendOtp(form.email);
      setStep(2);
    } catch (e) {
      setErr(e.response?.data?.message || "Failed to send verification code");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (!form.otp.trim()) {
      setErr("Verification code is required");
      return;
    }
    setErr("");
    setLoading(true);
    try {
      await verifyOtp(form.email, form.otp);
      setStep(3);
    } catch (e) {
      setErr(e.response?.data?.message || "Invalid or expired code");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (form.password.length < 8) {
      setErr("Password must be at least 8 characters");
      return;
    }
    setErr("");
    setLoading(true);
    try {
      await register(form.name, form.email, form.password, form.otp);
      navigate("/dashboard", { replace: true });
    } catch (e) {
      setErr(e.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
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
        <Link to="/" className="flex items-center justify-center gap-2 mb-6">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 text-white flex items-center justify-center shadow-lg shadow-brand-500/30">
            <Sparkles size={18} />
          </div>
          <span className="font-semibold text-lg">HabitIQ</span>
        </Link>

        <div className="card p-7 overflow-hidden relative">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-semibold">Create account</h1>
              <p className="text-sm text-muted mt-1">
                {step === 1 && "Step 1 of 3: Basic Info"}
                {step === 2 && "Step 2 of 3: Verification"}
                {step === 3 && "Step 3 of 3: Secure Password"}
              </p>
            </div>
            
            {/* Step Indicators */}
            <div className="flex gap-1">
              {[1, 2, 3].map((i) => (
                <div 
                  key={i} 
                  className={`h-2 rounded-full transition-all duration-500 ${
                    step >= i ? "w-6 bg-brand-500" : "w-2 bg-[var(--surface-hover)]"
                  }`} 
                />
              ))}
            </div>
          </div>

          {/* STEP 1: Basic Info */}
          {step === 1 && (
            <form onSubmit={handleSendOtp} className="space-y-4 animate-fade-in">
              <div>
                <label className="label">Name</label>
                <input
                  className="input"
                  value={form.name}
                  onChange={set("name")}
                  placeholder="Your full name"
                  required
                  autoFocus
                />
              </div>
              <div>
                <label className="label">Email address</label>
                <input
                  className="input"
                  type="email"
                  value={form.email}
                  onChange={set("email")}
                  placeholder="you@example.com"
                  required
                />
              </div>
              
              {err && (
                <div className="text-sm text-rose-500 bg-rose-500/10 border border-rose-500/20 rounded-lg px-3 py-2">
                  {err}
                </div>
              )}
              
              <button
                type="submit"
                className="btn-primary w-full py-3 mt-2 flex items-center justify-center gap-2"
                disabled={loading}
              >
                {loading ? "Sending..." : "Send Verification Code"}
                {!loading && <ArrowRight size={18} />}
              </button>
            </form>
          )}

          {/* STEP 2: Verification */}
          {step === 2 && (
            <form onSubmit={handleVerifyOtp} className="space-y-4 animate-slide-up">
              <div className="p-4 rounded-xl bg-[var(--surface-hover)] border border-[var(--surface-border)]">
                <p className="text-sm text-center mb-1">We've sent a 6-digit code to</p>
                <p className="font-semibold text-center text-[var(--text-main)]">{form.email}</p>
                <button 
                  type="button" 
                  onClick={() => setStep(1)}
                  className="text-xs text-brand-600 block mx-auto mt-2 hover:underline"
                >
                  Change email
                </button>
              </div>

              <div>
                <label className="label text-center">Verification Code</label>
                <input
                  className="input text-center text-2xl tracking-widest font-mono py-3"
                  value={form.otp}
                  onChange={set("otp")}
                  placeholder="------"
                  maxLength={6}
                  required
                  autoFocus
                />
              </div>

              {err && (
                <div className="text-sm text-rose-500 bg-rose-500/10 border border-rose-500/20 rounded-lg px-3 py-2">
                  {err}
                </div>
              )}

              <button
                type="submit"
                className="btn-primary w-full py-3 mt-2 flex items-center justify-center gap-2"
                disabled={loading || form.otp.length < 6}
              >
                {loading ? "Verifying..." : "Verify Code"}
              </button>
            </form>
          )}

          {/* STEP 3: Password */}
          {step === 3 && (
            <form onSubmit={handleRegister} className="space-y-4 animate-slide-up">
              <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 size={18} />
                <p className="text-sm font-medium">Email verified successfully!</p>
              </div>

              <div>
                <label className="label">Create a secure password</label>
                <input
                  className="input"
                  type="password"
                  value={form.password}
                  onChange={set("password")}
                  placeholder="At least 8 characters"
                  required
                  autoFocus
                />
              </div>

              {err && (
                <div className="text-sm text-rose-500 bg-rose-500/10 border border-rose-500/20 rounded-lg px-3 py-2">
                  {err}
                </div>
              )}

              <button
                type="submit"
                className="btn-primary w-full py-3 mt-2"
                disabled={loading || form.password.length < 8}
              >
                {loading ? "Creating account..." : "Complete Registration"}
              </button>
            </form>
          )}

          {step === 1 && (
            <div className="text-center mt-6 text-sm text-soft border-t border-[var(--surface-border)] pt-5">
              Already have an account?{" "}
              <Link to="/login" className="text-brand-600 dark:text-brand-300 font-medium hover:underline">
                Log in
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
