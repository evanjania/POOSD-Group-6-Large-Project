import {useState} from "react";
import {useForm} from "react-hook-form";
import { ArrowLeft, Mail, Loader2 } from "lucide-react";

type ForgorInput = {
    email: string;
};

interface ForgorFormProps {
  blue: string;
  onBack: () => void;
}

export default function ForgorForm({blue, onBack}: ForgorFormProps){
    const [message, setMessage] = useState('');
    const {
        register,
        handleSubmit,
        formState: {errors, isSubmitting},
    } = useForm<ForgorInput>();

    const onSubmit = async (data: ForgorInput) => {
        try{
            const response = await fetch("/api/forgot-pass", {
                method: "POST",
                body: JSON.stringify({email: data.email}),
                headers: {"Content-Type":"application/json"}
            })
            const res = await response.json();
            setMessage(res.message);
        }catch(error:any){
            setMessage("Failed to connect to server. Please try again later.")
        }
    };
    
    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Email Field */}
            <div className="space-y-2">
                <label htmlFor="forgor-email" className="block text-base font-semibold text-white/80">
                Email Address
                </label>
                <div className="relative">
                <input
                    {...register("email", { required: "Email is required" })}
                    id="forgor-email"
                    type="email"
                    placeholder="name@example.com"
                    className={`w-full px-5 py-3.5 pl-12 rounded-xl border text-base bg-stone-50 text-stone-800 
                        placeholder-stone-400 outline-none transition focus:ring-2 focus:bg-white 
                        ${errors.email ? "border-red-400 focus:ring-red-200" : "border-stone-200 focus:ring-blue-200"
                    }`}
                />
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" size={20} />
                </div>
                {errors.email && <p className="text-sm text-red-300 font-medium">{errors.email.message}</p>}
            </div>

            {/* Submit Button */}
            <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-4 rounded-xl font-bold text-base tracking-wide transition hover:opacity-90 shadow-sm disabled:opacity-60 flex items-center justify-center gap-2"
                style={{ backgroundColor: "#ffffff", color: blue }}
            >
                {isSubmitting ? (
                <>
                    <Loader2 className="animate-spin" size={20} />
                    Sending...
                </>
                ) : (
                "Send Reset Link"
                )}
            </button>

            {/* Back to Login Action */}
            <div className="flex justify-center border-t border-white/10 pt-4">
                <button
                type="button"
                onClick={onBack}
                className="flex items-center gap-2 text-sm font-semibold text-white/70 hover:text-white transition group"
                >
                <ArrowLeft size={16} className="transition-transform group-hover:-translate-x-1" />
                Back to Sign In
                </button>
            </div>
            {message && <p className="text-center mt-3 text-sm font-bold text-white">{message}</p>}
        </form>
    );
}