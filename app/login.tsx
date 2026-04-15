import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff } from "lucide-react";
// Import the shared UI components from your auth file
import { Field, inputClass } from "../pages/auth"; 
import { useLocation } from "wouter";

const loginSchema = z.object({
  username: z.string().min(1, "Please enter your username"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type LoginForm = z.infer<typeof loginSchema>;

interface LoginFormProps {
  blue: string;
  onForgotClick: () => void;
}

export default function LoginForm({ blue, onForgotClick}: LoginFormProps) {
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
      const response = await fetch("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ username: data.username, password: data.password }),
        headers: { "Content-Type": "application/json" },
      });

      const res = await response.json();

      if (res.error) {
        setError("username", { message: res.error });
      } else {
        localStorage.setItem("userId", String(res.id));
	      localStorage.setItem("username", String(res.username));
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
        <button type="button" onClick={onForgotClick} className="text-base font-semibold hover:underline text-white/90">
          Forgot password?
        </button>
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
