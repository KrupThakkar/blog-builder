"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Sparkles, Lock, Mail, User, ArrowRight, AlertCircle } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuth();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [bio, setBio] = useState("");
  const [role, setRole] = useState<"employee" | "admin">("employee");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setLoading(true);

    const result = await register({
      name,
      email,
      password,
      bio,
      role,
    });

    setLoading(false);

    if (result.success) {
      router.push("/dashboard");
      router.refresh();
    } else {
      setError(result.error || "Registration failed");
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-cyan-400 flex items-center justify-center text-white mx-auto shadow-md shadow-indigo-500/20">
            <Sparkles className="w-6 h-6" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
            Create an Account
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
            Join the AnalyticsLiv internal editorial platform to write and publish articles.
          </p>
        </div>

        <div className="rounded-3xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 sm:p-8 shadow-xl shadow-indigo-950/5">
          {error && (
            <div className="mb-6 p-3.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 flex items-center gap-2.5 text-xs text-red-600 dark:text-red-400">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                Full Name
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  required
                  placeholder="e.g. Jordan Smith"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                Work Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
                <input
                  type="email"
                  required
                  placeholder="name@analyticsliv.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
                <input
                  type="password"
                  required
                  placeholder="Minimum 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                Role Assignment
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setRole("employee")}
                  className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all ${
                    role === "employee"
                      ? "bg-indigo-50 dark:bg-indigo-950/60 border-indigo-400 text-indigo-700 dark:text-indigo-300 ring-2 ring-indigo-500/20"
                      : "border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400"
                  }`}
                >
                  Employee
                </button>
                <button
                  type="button"
                  onClick={() => setRole("admin")}
                  className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all ${
                    role === "admin"
                      ? "bg-amber-50 dark:bg-amber-950/60 border-amber-400 text-amber-700 dark:text-amber-300 ring-2 ring-amber-500/20"
                      : "border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400"
                  }`}
                >
                  Admin
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                Bio / Specialization
              </label>
              <textarea
                rows={2}
                placeholder="Brief bio or engineering specialization..."
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="w-full px-3 py-2 rounded-xl text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 shadow-md shadow-indigo-500/20 transition-all disabled:opacity-50"
            >
              {loading ? (
                "Creating account..."
              ) : (
                <>
                  Register Account
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-gray-100 dark:border-gray-800 text-center">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Already registered?{" "}
              <Link
                href="/login"
                className="font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                Sign in to your account
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
