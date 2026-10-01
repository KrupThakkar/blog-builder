"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import {
  PenSquare,
  Sun,
  Moon,
  LayoutDashboard,
  LogOut,
  Menu,
  X,
  Sparkles,
} from "lucide-react";

export function Navbar() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const pathname = usePathname();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-gray-200 dark:border-gray-800 glass transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 flex items-center justify-center text-white shadow-md shadow-indigo-500/20 group-hover:scale-105 transition-transform">
              <Sparkles className="w-5 h-5" />
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                Analytics<span className="text-indigo-600 dark:text-indigo-400">Liv</span>
              </span>
              <span className="text-[10px] uppercase tracking-wider text-gray-500 dark:text-gray-400 font-semibold -mt-1">
                Editorial Platform
              </span>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-1 text-sm font-medium">
            <Link
              href="/"
              className={`px-3 py-2 rounded-lg transition-colors ${
                pathname === "/"
                  ? "text-indigo-600 dark:text-indigo-400 bg-indigo-50/60 dark:bg-indigo-950/40"
                  : "text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800/60"
              }`}
            >
              Stories
            </Link>
            <Link
              href="/#categories"
              className="px-3 py-2 rounded-lg text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800/60 transition-colors"
            >
              Categories
            </Link>
            {user && (
              <Link
                href="/dashboard"
                className={`px-3 py-2 rounded-lg transition-colors flex items-center gap-1.5 ${
                  pathname.startsWith("/dashboard")
                    ? "text-indigo-600 dark:text-indigo-400 bg-indigo-50/60 dark:bg-indigo-950/40"
                    : "text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800/60"
                }`}
              >
                <LayoutDashboard className="w-4 h-4" />
                Dashboard
                {user.role === "admin" && (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                    Admin
                  </span>
                )}
              </Link>
            )}
          </nav>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-3">
          {/* Dark Mode Toggle */}
          <button
            onClick={toggleTheme}
            aria-label="Toggle color theme"
            className="p-2 rounded-xl text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            {theme === "dark" ? (
              <Sun className="w-5 h-5 text-amber-400 animate-spin-once" />
            ) : (
              <Moon className="w-5 h-5 text-gray-600" />
            )}
          </button>

          {/* Write Post Button */}
          <Link
            href="/editor"
            className="hidden sm:inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-semibold text-gray-700 dark:text-gray-200 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/30 transition-all border border-gray-200 dark:border-gray-800"
          >
            <PenSquare className="w-4 h-4 text-indigo-500" />
            Write
          </Link>

          {user ? (
            /* User Dropdown */
            <div className="relative">
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors border border-transparent hover:border-gray-200 dark:hover:border-gray-700"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={
                    user.avatar ||
                    `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(
                      user.name
                    )}`
                  }
                  alt={user.name}
                  className="w-8 h-8 rounded-full object-cover ring-2 ring-indigo-500/30"
                />
                <span className="hidden lg:inline text-sm font-medium text-gray-800 dark:text-gray-200">
                  {user.name}
                </span>
              </button>

              {dropdownOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setDropdownOpen(false)}
                  />
                  <div className="absolute right-0 mt-2 w-60 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-xl shadow-black/10 dark:shadow-black/40 py-2 z-50 animate-in fade-in zoom-in-95">
                    <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800">
                      <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                        {user.name}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                        {user.email}
                      </p>
                      <div className="mt-1.5">
                        <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full capitalize bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-200/50 dark:border-indigo-800/50">
                          {user.role} Account
                        </span>
                      </div>
                    </div>

                    <div className="py-1">
                      <Link
                        href="/dashboard"
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/60 transition-colors"
                      >
                        <LayoutDashboard className="w-4 h-4 text-gray-400" />
                        Dashboard
                      </Link>
                      <Link
                        href="/editor"
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/60 transition-colors"
                      >
                        <PenSquare className="w-4 h-4 text-gray-400" />
                        New Story
                      </Link>
                    </div>

                    <div className="border-t border-gray-100 dark:border-gray-800 pt-1">
                      <button
                        onClick={() => {
                          setDropdownOpen(false);
                          logout();
                        }}
                        className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        Sign Out
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          ) : (
            /* Auth Buttons */
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="px-3.5 py-2 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                Sign In
              </Link>
              <Link
                href="/register"
                className="px-4 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 rounded-xl shadow-sm hover:shadow transition-all"
              >
                Get Started
              </Link>
            </div>
          )}

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-xl text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-gray-200 dark:border-gray-800 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md px-4 pt-2 pb-6 space-y-3">
          <Link
            href="/"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-lg text-base font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            Stories
          </Link>
          <Link
            href="/#categories"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-lg text-base font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            Categories
          </Link>
          {user && (
            <Link
              href="/dashboard"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-lg text-base font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              Dashboard ({user.role})
            </Link>
          )}
          <Link
            href="/editor"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-base font-medium text-indigo-600 dark:text-indigo-400"
          >
            <PenSquare className="w-5 h-5" />
            Write a New Story
          </Link>
        </div>
      )}
    </header>
  );
}
