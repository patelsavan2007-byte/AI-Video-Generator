"use client";

import Link from 'next/link';
import { useAuthStore } from '../store/authStore';
import { useRouter } from 'next/navigation';
import { Film, User, LogOut, LayoutDashboard } from 'lucide-react';

export default function Navbar() {
  const { isAuthenticated, logout, email } = useAuthStore();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass-panel border-b-0 border-t-0">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex-shrink-0">
            <Link href="/" className="flex items-center gap-2">
              <Film className="h-8 w-8 text-brand-500" />
              <span className="font-bold text-xl tracking-tight">
                Vision<span className="text-brand-500">Forge</span>
              </span>
            </Link>
          </div>
          <div className="flex items-center gap-4">
            {isAuthenticated ? (
              <>
                <Link href="/dashboard/gallery" className="text-sm font-medium text-gray-300 hover:text-white transition-colors">
                  Gallery
                </Link>
                <Link href="/dashboard" className="flex items-center gap-2 btn-secondary">
                  <LayoutDashboard className="h-4 w-4" />
                  <span>Dashboard</span>
                </Link>
                <div className="relative group">
                  <button className="flex items-center gap-2 text-gray-300 hover:text-white focus:outline-none">
                    <div className="h-8 w-8 rounded-full bg-brand-500/20 border border-brand-500/50 flex items-center justify-center">
                      <User className="h-4 w-4 text-brand-400" />
                    </div>
                  </button>
                  <div className="absolute right-0 mt-2 w-48 py-2 bg-surface-800 rounded-lg shadow-xl border border-surface-600 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                    <div className="px-4 py-2 text-xs text-gray-400 border-b border-surface-600 truncate">
                      {email}
                    </div>
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-surface-700 flex items-center gap-2 transition-colors"
                    >
                      <LogOut className="h-4 w-4" />
                      Sign out
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <>
                <Link href="/login" className="text-sm font-medium text-gray-300 hover:text-white transition-colors">
                  Log in
                </Link>
                <Link href="/register" className="btn-primary text-sm">
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
