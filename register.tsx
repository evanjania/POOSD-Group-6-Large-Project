import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff } from "lucide-react";

import { Field, inputClass } from "../pages/auth"; 
import { useLocation } from "wouter";

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

type RegisterFormType = z.infer<typeof registerSchema>;

export default function RegisterForm({ blue }: { blue: string }) {
  const [message, setMessage] = useState(''); 
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [,navigate] = useLocation();
  
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormType>({ resolver: zodResolver(registerSchema) });

  // Explicitly returning Promise<void> for the async submit handler
  const onSubmit = async (data: RegisterFormType) => {
    setMessage('');

    const info = { 
        fullname: data.name, 
        username: data.username, 
        email: data.email, 
        password: data.password 
    };

    try {
        const response = await fetch('/api/register', {
            method: 'POST',
            body: JSON.stringify(info),
            headers: { 'Content-Type': 'application/json' }
        });

        const res = await response.json();

        if (res.error) {
            setMessage(res.error);
        } else {
            localStorage.setItem("userId", String(res.id));
            localStorage.setItem("username", String(res.username));
            setMessage("Registered Successfully!");
            navigate("/dashboard");
        }
    } catch (error: any) {
        setMessage(error.toString());
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
