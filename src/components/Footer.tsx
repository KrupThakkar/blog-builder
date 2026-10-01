import React from "react";
import Link from "next/link";
import { Sparkles, Heart } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-gray-200 dark:border-gray-800 bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-600 to-cyan-400 flex items-center justify-center text-white">
                <Sparkles className="w-4 h-4" />
              </div>
              <span className="font-extrabold text-lg text-gray-900 dark:text-white">
                AnalyticsLiv <span className="text-indigo-600 dark:text-indigo-400">Editorial</span>
              </span>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 max-w-sm leading-relaxed">
              An enterprise-grade internal content management and engineering publication platform. Built with Next.js, MongoDB, and TipTap.
            </p>
            <div className="flex flex-wrap gap-2 pt-2">
              <span className="text-xs px-2.5 py-1 rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-medium border border-indigo-200/50 dark:border-indigo-800/50">
                Next.js App Router
              </span>
              <span className="text-xs px-2.5 py-1 rounded-md bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-medium border border-emerald-200/50 dark:border-emerald-800/50">
                MongoDB Mongoose
              </span>
              <span className="text-xs px-2.5 py-1 rounded-md bg-cyan-50 dark:bg-cyan-950/60 text-cyan-700 dark:text-cyan-300 font-medium border border-cyan-200/50 dark:border-cyan-800/50">
                JWT Auth
              </span>
              <span className="text-xs px-2.5 py-1 rounded-md bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 font-medium border border-amber-200/50 dark:border-amber-800/50">
                TipTap WYSIWYG
              </span>
            </div>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-4">
              Explore
            </h4>
            <ul className="space-y-2.5 text-sm text-gray-600 dark:text-gray-400">
              <li>
                <Link href="/" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                  Latest Articles
                </Link>
              </li>
              <li>
                <Link href="/#categories" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                  Data & Analytics
                </Link>
              </li>
              <li>
                <Link href="/#categories" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                  Careers & Tech
                </Link>
              </li>
              <li>
                <Link href="/#categories" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                  Productivity
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-4">
              Portal Access
            </h4>
            <ul className="space-y-2.5 text-sm text-gray-600 dark:text-gray-400">
              <li>
                <Link href="/login" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                  Employee Login
                </Link>
              </li>
              <li>
                <Link href="/dashboard" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                  Admin Dashboard
                </Link>
              </li>
              <li>
                <Link href="/editor" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                  Story Editor
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-gray-100 dark:border-gray-800/60 flex flex-col sm:flex-row items-center justify-between text-xs text-gray-500 dark:text-gray-400 gap-4">
          <p>© {new Date().getFullYear()} AnalyticsLiv Full-Stack Blog Platform. All rights reserved.</p>
          <p className="flex items-center gap-1">
            Engineered with <Heart className="w-3.5 h-3.5 text-red-500 fill-red-500" /> by AnalyticsLiv Engineering Team
          </p>
        </div>
      </div>
    </footer>
  );
}
