import { useState } from "react";
/*import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff } from "lucide-react";
import { useLocation } from "wouter";*/

import bgCharacters from "../assets/bg-characters.png";
import logoIcon from "../assets/logo-icon.png";
import logo from "../assets/logo.png";

import RegisterForm from "../components/register";
import LoginForm from "../components/login";
import ForgorForm from "../components/forgor";

const BG = "#F4F3F1";
const BLUE = "#1149A8";

export function Field({
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

export const inputClass = (hasError?: boolean): string =>
  `w-full px-5 py-3.5 rounded-xl border text-base bg-stone-50 text-stone-800 placeholder-stone-400 outline-none transition focus:ring-2 focus:bg-white ${
    hasError
      ? "border-red-400 focus:ring-red-200 focus:border-red-400"
      : "border-stone-200 focus:ring-blue-200 focus:border-blue-500"
  }`;

export default function AuthPage() {
  const [mode, setMode] = useState<"login" | "register" | "forgor">("login");

  return (
    <div className="h-screen w-full flex overflow-hidden" style={{ backgroundColor: BG }}>

      {/* ── LEFT — logo panel with transparent character bg ── */}
      <div className="hidden lg:flex lg:w-3/5 relative items-center justify-center p-12" style={{ backgroundColor: BG }}>
        {/* Character illustration — very transparent */}
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `url(${bgCharacters})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            opacity: 0.2,
          }}
        />
        {/* Logo on top */}
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
          {mode !== "forgor" && (
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
          )}

          {/* Heading */}
          <div>
            <h2 className="text-3xl font-bold text-white">
              {mode === "login" && "Got something you need to tell your friends about?"}
              {mode === "register" && "Tired of forgetting recommendations?"}
              {mode === "forgor" && "Can't get in?"}
            </h2>
            <p className="text-base mt-2" style={{ color: "rgba(255,255,255,0.65)" }}>
              {mode === "login" && "Sign in to document it!"}
              {mode === "register" && "Sign up and start tracking recommendations together"}
              {mode === "forgor" && "Enter your email to reset your password."}
            </p>
          </div>

          {/* Form */}
          {mode === "login" && <LoginForm blue={BLUE} onForgotClick={()=>setMode("forgor")}/>} 
          {mode === "register" && <RegisterForm blue={BLUE} />}
          {mode === "forgor" && <ForgorForm blue={BLUE} onBack={()=>setMode("login")} />}

          {/* Credits */}
          <p className="text-xs text-center" style={{ color: "rgba(255,255,255,0.35)" }}>
            Large Project by Erkan A, Logan E, Kevin E, Evan J, Benjamin Q, and Siddanth R
          </p>

        </div>
      </div>
    </div>
  );
}

