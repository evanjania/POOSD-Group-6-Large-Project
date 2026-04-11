import { useState } from "react";
import {useForm} from "react-hook-form";
import { useRoute, useLocation } from "wouter";
import { Lock, Eye, EyeOff, Loader2, CheckCircle2 } from "lucide-react";
import { inputClass } from "../pages/auth"; 

type ResetInput = {
    password: string;
    confirmPass: string;
};

export default function EditPass(){
    const [showPass, setShowPass] = useState(false);
    const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
    const [,navigate] = useLocation();

    const [, params] = useRoute("/reset-pass/:token");
    const token = params?.token;

    const {
        register,
        handleSubmit,
        watch,
        formState: {errors, isSubmitting},
    } = useForm<ResetInput>();

    const onSubmit = async (data: ResetInput) => {
        try{
            const response = await fetch("/api/reset-pass", {
                method: "POST",
                body: JSON.stringify({token: token, newPass: data.password}),
                headers: {"Content-Type": "application/json"}
            });

            if(response.ok){
                setStatus("success");
                setTimeout(() => navigate("/"), 3000);
            } else {
                setStatus("error");
            }
        }catch(error:any){
            setStatus("error");
        }
    };

    if (status === "success") {
        return (
        <div className="flex flex-col items-center justify-center space-y-4 text-center animate-in fade-in zoom-in">
            <CheckCircle2 className="text-green-400" size={64} />
            <h2 className="text-2xl font-bold text-white">Password Updated!</h2>
            <p className="text-white/60">Taking you back to the login screen...</p>
        </div>
        );
    }

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="space-y-2">
                <label className="block text-base font-semibold text-white/80">New Password</label>
                <div className="relative group">
                <input
                    {...register("password", { 
                        required: "Password is required",
                        minLength: { value: 6, message: "Min 6 characters" }
                    })}
                    type={showPass ? "text" : "password"}
                    placeholder="••••••••"
                    className={inputClass(!!errors.password)}
                />
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400 group-focus-within:text-blue-500" size={20} />
                <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
                >
                    {showPass ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
                </div>
                {errors.password && <p className="text-sm text-red-300">{errors.password.message}</p>}
            </div>

            <div className="space-y-2">
                <label className="block text-base font-semibold text-white/80">Confirm Password</label>
                <div className="relative group">
                <input
                    {...register("confirmPass", {
                        required: "Please confirm your password",
                        validate: (value) => value === watch("password") || "Passwords do not match",
                    })}
                    type={showPass ? "text" : "password"}
                    placeholder="••••••••"
                    className={inputClass(!!errors.confirmPass)}
                />
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400 group-focus-within:text-blue-500" size={20} />
                </div>
                {errors.confirmPass && <p className="text-sm text-red-300">{errors.confirmPass.message}</p>}
            </div>

            <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-4 rounded-xl font-bold text-base bg-white text-[#1149A8] transition hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
            >
                {isSubmitting ? <Loader2 className="animate-spin" /> : "Update Password"}
            </button>

            {status === "error" && (
                <p className="text-center text-red-300 font-bold">Link expired or invalid. Please try again.</p>
            )}
        </form>
    );
}
