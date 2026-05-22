"use client";

import React from "react";
import { 
  LayoutDashboard, 
  Tv, 
  History, 
  Settings, 
  Sparkles, 
  LogOut, 
  User, 
  Video 
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  credits: number;
}

export function Sidebar({ activeTab, setActiveTab, credits }: SidebarProps) {
  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "generate", label: "Generate", icon: Tv },
    { id: "history", label: "History", icon: History },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  return (
    <aside className="w-64 border-r border-white/5 bg-[#0b0b14]/70 backdrop-blur-xl flex flex-col h-screen sticky top-0">
      {/* Brand Logo */}
      <div className="p-6 border-b border-white/5 flex items-center gap-3">
        <div className="h-9 w-9 rounded-lg bg-gradient-to-tr from-purple-600 to-blue-500 flex items-center justify-center shadow-lg shadow-purple-500/20">
          <Video className="h-5 w-5 text-white animate-pulse" />
        </div>
        <div>
          <h1 className="font-bold text-lg leading-tight tracking-tight bg-gradient-to-r from-white via-zinc-200 to-zinc-400 bg-clip-text text-transparent">
            VisionForge <span className="text-purple-400 font-semibold">AI</span>
          </h1>
          <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-mono">Video Studio</p>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 px-4 py-6 space-y-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 relative group",
                isActive 
                  ? "text-white" 
                  : "text-zinc-400 hover:text-zinc-200 hover:bg-white/5"
              )}
            >
              {isActive && (
                <motion.div
                  layoutId="active-nav"
                  className="absolute inset-0 bg-gradient-to-r from-purple-900/40 to-blue-900/40 border-l-2 border-purple-500 rounded-xl"
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}
              <Icon className={cn("h-4 w-4 relative z-10", isActive ? "text-purple-400" : "text-zinc-400 group-hover:text-zinc-200")} />
              <span className="relative z-10">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Credits Card */}
      <div className="p-4 border-t border-white/5">
        <div className="relative overflow-hidden rounded-xl border border-purple-500/20 bg-purple-950/20 p-4">
          <div className="absolute top-0 right-0 h-16 w-16 -mr-4 -mt-4 rounded-full bg-purple-500/10 blur-xl" />
          <div className="flex items-center gap-2 text-purple-400 text-xs font-semibold uppercase tracking-wider mb-2">
            <Sparkles className="h-3 w-3" />
            <span>Credits Remaining</span>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-bold text-white font-mono">{credits}</span>
            <span className="text-zinc-500 text-xs font-medium">/ 1000 sec</span>
          </div>
          {/* Progress bar */}
          <div className="w-full bg-zinc-800 h-1.5 rounded-full mt-3 overflow-hidden">
            <div 
              className="bg-gradient-to-r from-purple-500 to-blue-500 h-full rounded-full transition-all duration-500" 
              style={{ width: `${(credits / 1000) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* User Profile */}
      <div className="p-4 border-t border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-full bg-zinc-800 border border-white/10 flex items-center justify-center text-zinc-300 font-semibold font-mono">
            CR
          </div>
          <div>
            <h4 className="text-xs font-semibold text-white">Creator Account</h4>
            <p className="text-[10px] text-zinc-500">creator@visionforge.ai</p>
          </div>
        </div>
        <button 
          title="Sign Out (Disabled)"
          className="text-zinc-500 hover:text-zinc-300 transition-colors p-1.5 rounded-lg hover:bg-white/5"
          disabled
        >
          <LogOut className="h-4 w-4" />
        </button>
      </div>
    </aside>
  );
}
