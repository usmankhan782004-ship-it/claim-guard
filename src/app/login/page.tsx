"use client";

import { useState, useEffect, Suspense } from "react";
import { createClient } from "@/lib/supabase/client";
import { motion } from "framer-motion";
import { Shield, Mail, ArrowRight, Lock, CheckCircle2 } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

function LoginForm() {
    const [email, setEmail] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();
    const searchParams = useSearchParams();
    const redirectTo = searchParams.get("redirect") || "/app";

    useEffect(() => {
        // If they are already logged in, push them directly to their redirect
        const checkAuth = async () => {
            const supabase = createClient();
            const { data } = await supabase.auth.getUser();
            if (data?.user) {
                router.push(redirectTo);
            }
        };
        checkAuth();
    }, [router, redirectTo]);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        const supabase = createClient();

        // Use magic link sign in
        const { error } = await supabase.auth.signInWithOtp({
            email,
            options: {
                emailRedirectTo: `${window.location.origin}/api/auth/callback?redirect=${encodeURIComponent(redirectTo)}`,
            },
        });

        if (error) {
            setError(error.message);
            setIsLoading(false);
        } else {
            setIsSuccess(true);
            setIsLoading(false);
        }
    };

    if (isSuccess) {
        return (
            <div className="text-center py-8">
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 200 }}
                    className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-4"
                >
                    <CheckCircle2 className="w-8 h-8 text-emerald-400" />
                </motion.div>
                <h2 className="text-xl font-bold text-white mb-2">Check your email</h2>
                <p className="text-sm text-gray-400 mb-6 px-4">
                    We sent a secure magic link to <span className="text-white font-medium">{email}</span>. Click it to complete your sign-in.
                </p>
            </div>
        );
    }

    return (
        <form onSubmit={handleLogin} className="space-y-4">
            <div>
                <label className="text-xs font-medium text-gray-300 mb-1.5 block">
                    Email Address
                </label>
                <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Mail className="h-4 w-4 text-gray-500" />
                    </div>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        placeholder="you@example.com"
                        className="w-full pl-10 pr-4 py-3 bg-white/[0.03] border border-white/10 rounded-xl text-sm text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500/40 focus:ring-1 focus:ring-emerald-500/40 transition-all font-mono"
                    />
                </div>
            </div>

            {error && (
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-xs text-red-400 text-center">
                    {error}
                </div>
            )}

            <button
                type="submit"
                disabled={isLoading || !email}
                className="w-full btn-primary py-3 text-sm flex items-center justify-center gap-2 mt-2"
            >
                {isLoading ? (
                    <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    >
                        <Shield className="w-4 h-4" />
                    </motion.div>
                ) : (
                    <>
                        <Lock className="w-4 h-4" />
                        <span>Continue with Email</span>
                        <ArrowRight className="w-4 h-4" />
                    </>
                )}
            </button>

            <p className="text-[10px] text-gray-600 text-center mt-4">
                By continuing, you agree to our Terms of Service and Privacy Policy.
                Secure, passwordless login powered by Supabase.
            </p>
        </form>
    );
}

export default function LoginPage() {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden">
            {/* Background Effects */}
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-[100px] pointer-events-none" />
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-[100px] pointer-events-none" />

            <div className="w-full max-w-md z-10">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="mb-8 text-center"
                >
                    <Link href="/" className="inline-flex items-center justify-center gap-2 mb-6">
                        <img src="/favicon.svg" alt="ClaimGuard" className="w-10 h-10 rounded-xl" />
                        <span className="text-2xl font-bold text-white tracking-tight">
                            Claim<span className="text-emerald-400">Guard</span>
                        </span>
                    </Link>
                    <h1 className="text-2xl font-bold text-white mb-2">Secure Your Account</h1>
                    <p className="text-sm text-gray-400">
                        Sign in to save your analysis and securely process payments.
                    </p>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.1, duration: 0.5 }}
                    className="glass-card"
                >
                    <Suspense fallback={<div className="text-center text-sm text-gray-500 p-8">Loading secure portal...</div>}>
                        <LoginForm />
                    </Suspense>
                </motion.div>
            </div>
        </div>
    );
}
