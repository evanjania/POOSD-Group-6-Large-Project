import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff } from "lucide-react";
import { useLocation } from "wouter";

import bgCharacters from "../assets/bg-characters.png";
import logoIcon from "../assets/logo-icon.png";
import logo from "../assets/logo.png";

const BG = "#F4F3F1";
const BLUE = "#1149A8";

const loginSchema = z.object({
  username: z.string().min(1, "Please enter your username"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const registerSchema = z
  .object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    username: z
      .string()
      .min(3, "Username must be at least 3 characters")
      .regex(/^[a-z0-9_]+$/, "Only lowercase letters, numbers, and underscores"),
    email: z.string().email("Please enter a valid email"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type LoginForm = z.infer<typeof loginSchema>;
type RegisterForm = z.infer<typeof registerSchema>;

function Field({
  id,
  label,
  error,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-base font-semibold mb-2 text-white/80">
        {label}
      </label>
      {children}
      {error && <p className="mt-1.5 text-sm text-red-300">{error}</p>}
    </div>
  );
}

const inputClass = (hasError?: boolean) =>
  `w-full px-5 py-3.5 rounded-xl border text-base bg-stone-50 text-stone-800 placeholder-stone-400 outline-none transition focus:ring-2 focus:bg-white ${
    hasError
      ? "border-red-400 focus:ring-red-200 focus:border-red-400"
      : "border-stone-200 focus:ring-blue-200 focus:border-blue-500"
  }`;

function LoginForm({ blue }: { blue: string }) {
  const [showPassword, setShowPassword] = useState(false);
  const [, navigate] = useLocation();
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({ resolver: zodResolver(loginSchema) });

  const onSubmit = async (data: LoginForm) => {
    try {
      const response = await fetch("https://ugotta.space/api/login", {
        method: "POST",
        body: JSON.stringify({ username: data.username, password: data.password }),
        headers: { "Content-Type": "application/json" },
      });

      const res = await response.json();

      if (res.error) {
        setError("username", { message: res.error });
      } else {
        localStorage.setItem("userId", String(res.id));
        navigate("/dashboard");
      }
    } catch (error: any) {
      setError("username", { message: "Could not reach server. Please try again." });
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <Field id="login-username" label="Username" error={errors.username?.message}>
        <input
          id="login-username"
          type="text"
          autoComplete="username"
          placeholder="your_username"
          className={inputClass(!!errors.username)}
          {...register("username")}
        />
      </Field>

      <Field id="login-password" label="Password" error={errors.password?.message}>
        <div className="relative">
          <input
            id="login-password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            placeholder="••••••••"
            className={inputClass(!!errors.password) + " pr-11"}
            {...register("password")}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 transition"
          >
            {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
          </button>
        </div>
      </Field>

      <div className="flex items-center justify-end pt-0.5">
        <a href="#" className="text-base font-semibold hover:underline text-white/90">
          Forgot password?
        </a>
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full py-4 rounded-xl font-bold text-base tracking-wide transition hover:opacity-90 shadow-sm disabled:opacity-60 mt-1"
        style={{ backgroundColor: "#ffffff", color: blue }}
      >
        {isSubmitting ? "Signing in…" : "Sign In"}
      </button>
    </form>
  );
}

function RegisterForm({ blue }: { blue: string }) {
  const [message, setMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [, navigate] = useLocation();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterForm>({ resolver: zodResolver(registerSchema) });

  const onSubmit = async (data: RegisterForm) => {
    setMessage("");

    const info = {
      fullname: data.name,
      username: data.username,
      email: data.email,
      password: data.password,
    };

    try {
      const response = await fetch("htttps://ugotta.space/api/register", {
        method: "POST",
        body: JSON.stringify(info),
        headers: { "Content-Type": "application/json" },
      });

      const res = await response.json();

      if (res.error) {
        setMessage(res.error);
      } else {
        localStorage.setItem("userId", String(res.id));
        navigate("/dashboard");
      }
    } catch (error: any) {
      setMessage("Could not reach server. Please try again.");
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-3.5">
      <div className="grid grid-cols-2 gap-3">
        <Field id="reg-name" label="Full Name" error={errors.name?.message}>
          <input
            id="reg-name"
            type="text"
            autoComplete="name"
            placeholder="Jane Smith"
            className={inputClass(!!errors.name)}
            {...register("name")}
          />
        </Field>
        <Field id="reg-username" label="Username" error={errors.username?.message}>
          <input
            id="reg-username"
            type="text"
            autoComplete="username"
            placeholder="jane_s"
            className={inputClass(!!errors.username)}
            {...register("username")}
          />
        </Field>
      </div>

      <Field id="reg-email" label="Email" error={errors.email?.message}>
        <input
          id="reg-email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          className={inputClass(!!errors.email)}
          {...register("email")}
        />
      </Field>

      <Field id="reg-password" label="Password" error={errors.password?.message}>
        <div className="relative">
          <input
            id="reg-password"
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            placeholder="••••••••"
            className={inputClass(!!errors.password) + " pr-11"}
            {...register("password")}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 transition"
          >
            {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
          </button>
        </div>
      </Field>

      <Field id="reg-confirm" label="Confirm Password" error={errors.confirmPassword?.message}>
        <div className="relative">
          <input
            id="reg-confirm"
            type={showConfirm ? "text" : "password"}
            autoComplete="new-password"
            placeholder="••••••••"
            className={inputClass(!!errors.confirmPassword) + " pr-11"}
            {...register("confirmPassword")}
          />
          <button
            type="button"
            onClick={() => setShowConfirm(!showConfirm)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 transition"
          >
            {showConfirm ? <EyeOff size={17} /> : <Eye size={17} />}
          </button>
        </div>
      </Field>

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full py-4 rounded-xl font-bold text-base tracking-wide transition hover:opacity-90 shadow-sm disabled:opacity-60 mt-1"
        style={{ backgroundColor: "#ffffff", color: blue }}
      >
        {isSubmitting ? "Creating account…" : "Create Account"}
      </button>
      {message && <p className="text-center mt-3 text-sm font-bold text-white">{message}</p>}
    </form>
  );
}

export default function AuthPage() {
  const [mode, setMode] = useState<"login" | "register">("login");

  return (
    <div className="h-screen w-full flex overflow-hidden" style={{ backgroundColor: BG }}>

      {/* ── LEFT — logo panel with transparent character bg ── */}
      <div className="hidden lg:flex lg:w-3/5 relative items-center justify-center p-12" style={{ backgroundColor: BG }}>
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `url(${bgCharacters})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            opacity: 0.2,
          }}
        />
        <img
          src={logo}
          alt="Ugotta"
          className="relative z-10 w-full max-w-md object-contain select-none"
          draggable={false}
        />
      </div>

      {/* ── RIGHT — blue panel ── */}
      <div
        className="flex-1 lg:w-2/5 flex flex-col overflow-y-auto px-10 py-10"
        style={{ backgroundColor: BLUE }}
      >
        {/* White icon logo at the top */}
        <div className="flex justify-center items-center py-6 mb-2">
          <img
            src={logoIcon}
            alt="Ugotta"
            className="h-28 w-auto object-contain select-none"
            style={{ filter: "brightness(0) invert(1)" }}
            draggable={false}
          />
        </div>

        <div className="w-full flex flex-col gap-7">

          {/* Tab switcher */}
          <div className="flex rounded-2xl p-1.5 gap-1" style={{ backgroundColor: "rgba(255,255,255,0.15)" }}>
            <button
              onClick={() => setMode("login")}
              className="flex-1 py-3.5 text-base font-bold rounded-xl transition"
              style={
                mode === "login"
                  ? { backgroundColor: "#ffffff", color: BLUE, boxShadow: "0 1px 4px rgba(0,0,0,0.15)" }
                  : { color: "rgba(255,255,255,0.6)" }
              }
            >
              Sign In
            </button>
            <button
              onClick={() => setMode("register")}
              className="flex-1 py-3.5 text-base font-bold rounded-xl transition"
              style={
                mode === "register"
                  ? { backgroundColor: "#ffffff", color: BLUE, boxShadow: "0 1px 4px rgba(0,0,0,0.15)" }
                  : { color: "rgba(255,255,255,0.6)" }
              }
            >
              Sign Up
            </button>
          </div>

          {/* Heading */}
          <div>
            <h2 className="text-3xl font-bold text-white">
              {mode === "login" ? "Got something you need to tell your friends about?" : "Tired of forgetting recommendations?"}
            </h2>
            <p className="text-base mt-2" style={{ color: "rgba(255,255,255,0.65)" }}>
              {mode === "login"
                ? "Sign in to document it!"
                : "Sign up and start tracking recommendations together"}
            </p>
          </div>

          {/* Form */}
          {mode === "login" ? <LoginForm blue={BLUE} /> : <RegisterForm blue={BLUE} />}

          {/* Credits */}
          <p className="text-xs text-center" style={{ color: "rgba(255,255,255,0.35)" }}>
            Large Project by Erkan A, Logan E, Kevin E, Evan J, Benjamin Q, and Siddanth R
          </p>

        </div>
      </div>
    </div>
  );
}
