"use client";

import React, { useState } from "react";
import { 
  Play, 
  Sparkles, 
  Film, 
  Layers, 
  TrendingUp, 
  ArrowRight,
  Clock,
  Video
} from "lucide-react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";

export interface VideoItem {
  id: string;
  prompt: string;
  videoUrl: string;
  style: string;
  duration: string;
  resolution: string;
  fps: number;
  createdAt: string;
}

export default function Dashboard() {
  const router = useRouter();
  
  // Dummy recent videos
  const [recentVideos] = useState<VideoItem[]>([]);

  const templates = [
    {
      title: "Neon Cyber Samurai",
      prompt: "A futuristic samurai walking in neon Tokyo during heavy rain, high details, retro cyberpunk vibe",
      style: "Sci-Fi",
      duration: "5",
      resolution: "1080p",
      fps: 30,
      motion: 8,
      seed: "12849204",
      bgClass: "from-purple-900/40 via-fuchsia-950/20 to-zinc-950",
      borderClass: "border-purple-500/20",
      textClass: "text-purple-400"
    },
    {
      title: "Misty Gothic Forest",
      prompt: "A mysterious foggy road in a deep gothic forest at night, volumetric lighting, realistic rendering",
      style: "Realistic",
      duration: "10",
      resolution: "1080p",
      fps: 24,
      motion: 4,
      seed: "88291048",
      bgClass: "from-blue-900/40 via-teal-950/20 to-zinc-950",
      borderClass: "border-blue-500/20",
      textClass: "text-blue-400"
    },
    {
      title: "Space Portal Odyssey",
      prompt: "An astronaut floating towards a swirling cosmic portal, stars swirling in space, cinematic sci-fi",
      style: "Cinematic",
      duration: "5",
      resolution: "4k",
      fps: 30,
      motion: 7,
      seed: "90192837",
      bgClass: "from-indigo-900/40 via-violet-950/20 to-zinc-950",
      borderClass: "border-indigo-500/20",
      textClass: "text-indigo-400"
    }
  ];

  const handleNavigateToGenerate = () => {
    router.push("/dashboard/generate");
  };

  const handleSelectTemplate = (template: any) => {
    // Navigate with query params to prefill the prompt
    const params = new URLSearchParams({
      prompt: template.prompt,
      style: template.style,
      duration: template.duration
    });
    router.push(`/dashboard/generate?${params.toString()}`);
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { duration: 0.4 } }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-8"
      >
        {/* Banner */}
        <motion.div 
          variants={itemVariants}
          className="relative overflow-hidden rounded-2xl border border-white/5 bg-gradient-to-r from-purple-950/20 via-blue-950/25 to-[#0b0b14]/90 p-8 shadow-2xl"
        >
          <div className="absolute top-0 right-0 -mr-16 -mt-16 h-64 w-64 rounded-full bg-gradient-to-tr from-purple-500 to-blue-500 opacity-10 blur-3xl" />
          <div className="absolute -bottom-8 left-1/3 h-48 w-48 rounded-full bg-purple-500/5 blur-3xl" />
          
          <div className="max-w-2xl relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-semibold uppercase tracking-wider mb-4">
              <Sparkles className="h-3 w-3 animate-spin" style={{ animationDuration: '6s' }} />
              <span>Next-Gen Video Synthesis</span>
            </div>
            <h2 className="text-3xl font-bold tracking-tight text-white mb-3">
              Transform Text to Cinematic Masterpieces
            </h2>
            <p className="text-zinc-400 text-sm leading-relaxed mb-6">
              Harness the power of temporal-consistent diffusion models to create ultra-realistic, anime, sci-fi, or cinematic videos in seconds. Just type your vision and watch it come alive.
            </p>
            <button
              onClick={handleNavigateToGenerate}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-600 to-blue-500 hover:from-purple-500 hover:to-blue-400 text-white font-semibold text-sm px-5 py-3 rounded-xl shadow-lg shadow-purple-500/20 hover:shadow-purple-500/30 transition-all duration-300 transform hover:-translate-y-0.5 active:translate-y-0"
            >
              <span>Start Generating</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </motion.div>

        {/* Stats Grid */}
        <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {[
            { label: "Total Generations", value: "48", icon: Film, desc: "Videos created in this studio" },
            { label: "Generation Success Rate", value: "99.8%", icon: TrendingUp, desc: "High-performance nodes" },
            { label: "Active Pipelines", value: "0", icon: Layers, desc: "Idle - ready for prompt" }
          ].map((stat, i) => {
            const Icon = stat.icon;
            return (
              <div key={i} className="glass-card rounded-xl p-5 border border-white/5 relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-purple-500 to-blue-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-zinc-500 text-xs font-medium uppercase tracking-wider">{stat.label}</p>
                    <h3 className="text-2xl font-bold text-white mt-1 font-mono">{stat.value}</h3>
                    <p className="text-zinc-500 text-[10px] mt-1">{stat.desc}</p>
                  </div>
                  <div className="h-10 w-10 rounded-lg bg-white/5 flex items-center justify-center border border-white/10 text-zinc-400 group-hover:text-purple-400 transition-colors">
                    <Icon className="h-5 w-5" />
                  </div>
                </div>
              </div>
            );
          })}
        </motion.div>

        {/* Templates Row */}
        <motion.div variants={itemVariants} className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-white">Inspiration & Quick Templates</h3>
              <p className="text-zinc-500 text-xs">Click any card to load pre-configured high-quality styles.</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {templates.map((tpl, i) => (
              <div
                key={i}
                onClick={() => handleSelectTemplate(tpl)}
                className={`rounded-xl border ${tpl.borderClass} bg-gradient-to-br ${tpl.bgClass} p-5 flex flex-col justify-between cursor-pointer hover:scale-[1.02] hover:border-purple-500/40 transition-all duration-300 group`}
              >
                <div>
                  <span className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/5 border border-white/10 ${tpl.textClass}`}>
                    {tpl.style}
                  </span>
                  <h4 className="text-sm font-bold text-white mt-3 group-hover:text-purple-300 transition-colors">
                    {tpl.title}
                  </h4>
                  <p className="text-zinc-400 text-xs line-clamp-3 mt-2 font-normal leading-relaxed">
                    "{tpl.prompt}"
                  </p>
                </div>
                
                <div className="flex items-center justify-between mt-6 pt-3 border-t border-white/5 text-[10px] text-zinc-500">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" /> {tpl.duration}s
                  </span>
                  <span className="flex items-center gap-1 group-hover:text-white transition-colors">
                    Load Template <ArrowRight className="h-3 w-3" />
                  </span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Recent Generations */}
        <motion.div variants={itemVariants} className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-white">Recent Generations</h3>
          </div>

          {recentVideos.length === 0 ? (
            <div className="glass-card rounded-xl p-8 text-center border border-white/5 text-zinc-500 text-sm">
              No recent videos. Go to the Generate tab to create one!
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
              {recentVideos.map((video) => (
                <div 
                  key={video.id} 
                  className="glass-card rounded-xl border border-white/5 overflow-hidden group hover:border-purple-500/20 transition-all duration-300 flex flex-col"
                >
                  <div className="relative aspect-video bg-zinc-950 flex items-center justify-center overflow-hidden cursor-pointer">
                    <video 
                      src={video.videoUrl} 
                      className="w-full h-full object-cover opacity-70 group-hover:scale-105 transition-transform duration-500" 
                      muted 
                      playsInline 
                      loop
                    />
                    <div className="absolute inset-0 bg-black/35 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="h-10 w-10 rounded-full bg-purple-600 text-white flex items-center justify-center shadow-lg transform scale-90 group-hover:scale-100 transition-transform">
                        <Play className="h-5 w-5 fill-current ml-0.5" />
                      </div>
                    </div>
                    <span className="absolute bottom-2 right-2 px-1.5 py-0.5 text-[9px] rounded-md bg-black/60 font-mono text-zinc-300 font-semibold border border-white/5">
                      {video.duration}
                    </span>
                    <span className="absolute top-2 left-2 px-2 py-0.5 text-[9px] rounded-full bg-purple-500/80 font-semibold text-white border border-white/5 uppercase tracking-wider">
                      {video.style}
                    </span>
                  </div>

                  <div className="p-4 flex-1 flex flex-col justify-between">
                    <div>
                      <p className="text-xs text-zinc-300 line-clamp-2 italic font-normal leading-relaxed">
                        "{video.prompt}"
                      </p>
                    </div>
                    <div className="flex items-center justify-between mt-4 pt-3 border-t border-white/5 text-[10px] text-zinc-500">
                      <span className="font-mono">{video.resolution} • {video.fps} FPS</span>
                      <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {video.createdAt}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </motion.div>
    </div>
  );
}
