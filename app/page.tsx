"use client";

import Link from 'next/link';
import { useAuthStore } from '../store/authStore';
import { Sparkles, Zap, Video, CheckCircle } from 'lucide-react';
import { useEffect } from 'react';

export default function Home() {
  const { isAuthenticated, init } = useAuthStore();

  useEffect(() => {
    init();
  }, [init]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] text-center px-4">
      {/* Hero Section */}
      <div className="relative w-full max-w-5xl mx-auto py-20">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-brand-600/20 rounded-full blur-[100px] pointer-events-none" />
        
        <div className="relative z-10 animate-in fade-in slide-in-from-bottom-8 duration-700">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/10 border border-brand-500/30 text-brand-400 text-sm font-medium mb-8">
            <Sparkles className="h-4 w-4" />
            <span>Powered by Wan2.x Diffusion</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-8">
            Transform Text into <br className="hidden md:block" />
            <span className="text-gradient animate-glow">Stunning Videos</span>
          </h1>
          
          <p className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            VisionForge brings your imagination to life. Generate high-quality, cinematic videos from simple text prompts in minutes.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            {isAuthenticated ? (
              <Link href="/dashboard" className="btn-primary text-lg px-8 py-4 w-full sm:w-auto">
                Go to Dashboard
              </Link>
            ) : (
              <>
                <Link href="/register" className="btn-primary text-lg px-8 py-4 w-full sm:w-auto flex items-center justify-center gap-2">
                  Start Creating Free
                  <Zap className="h-5 w-5" />
                </Link>
                <Link href="/login" className="btn-secondary text-lg px-8 py-4 w-full sm:w-auto">
                  Sign In
                </Link>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Features Grid */}
      <div className="w-full max-w-6xl mx-auto py-20 border-t border-surface-600/30">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="glass-card p-8 rounded-2xl text-left">
            <div className="h-12 w-12 rounded-xl bg-brand-500/20 flex items-center justify-center mb-6">
              <Video className="h-6 w-6 text-brand-400" />
            </div>
            <h3 className="text-xl font-bold mb-3">State of the Art</h3>
            <p className="text-gray-400">Powered by the latest Wan2.x architecture for unparalleled generation quality and temporal consistency.</p>
          </div>
          
          <div className="glass-card p-8 rounded-2xl text-left">
            <div className="h-12 w-12 rounded-xl bg-accent-500/20 flex items-center justify-center mb-6">
              <Zap className="h-6 w-6 text-accent-400" />
            </div>
            <h3 className="text-xl font-bold mb-3">Lightning Fast</h3>
            <p className="text-gray-400">Distributed GPU processing ensures your videos render quickly, so you spend more time creating.</p>
          </div>
          
          <div className="glass-card p-8 rounded-2xl text-left">
            <div className="h-12 w-12 rounded-xl bg-green-500/20 flex items-center justify-center mb-6">
              <CheckCircle className="h-6 w-6 text-green-400" />
            </div>
            <h3 className="text-xl font-bold mb-3">Complete Control</h3>
            <p className="text-gray-400">Fine-tune aspect ratios, resolution, duration, and use initial images to guide the generation.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
