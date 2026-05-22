"use client";

import React, { useState, useEffect } from "react";
import { Sidebar } from "@/components/Sidebar";
import { DashboardTab } from "@/components/DashboardTab";
import { GenerateTab } from "@/components/GenerateTab";
import { HistoryTab } from "@/components/HistoryTab";
import { SettingsTab } from "@/components/SettingsTab";

export interface VideoItem {
  id: string;
  prompt: string;
  duration: string;
  resolution: string;
  fps: number;
  style: string;
  motion: number;
  seed: string;
  videoUrl: string;
  createdAt: string;
}

// Visual style to matching public video URL mockups
const styleVideoMockups: Record<string, string> = {
  Cinematic: "https://assets.mixkit.co/videos/preview/mixkit-mysterious-foggy-forest-road-at-night-42861-large.mp4",
  Anime: "https://assets.mixkit.co/videos/preview/mixkit-stars-in-space-background-1611-large.mp4",
  Realistic: "https://assets.mixkit.co/videos/preview/mixkit-slow-motion-shot-of-splashing-water-in-neon-purple-light-42862-large.mp4",
  "Sci-Fi": "https://assets.mixkit.co/videos/preview/mixkit-futuristic-subway-station-with-neon-lights-44132-large.mp4",
};

const initialMockHistory: VideoItem[] = [
  {
    id: "hist-1",
    prompt: "A futuristic samurai walking in neon Tokyo during heavy rain",
    duration: "5",
    resolution: "1080p",
    fps: 30,
    style: "Sci-Fi",
    motion: 8,
    seed: "48201948",
    videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-futuristic-subway-station-with-neon-lights-44132-large.mp4",
    createdAt: "10 mins ago"
  },
  {
    id: "hist-2",
    prompt: "A mysterious foggy road in a deep forest at night, cinematic lighting",
    duration: "10",
    resolution: "1080p",
    fps: 24,
    style: "Cinematic",
    motion: 4,
    seed: "92810482",
    videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-mysterious-foggy-forest-road-at-night-42861-large.mp4",
    createdAt: "2 hours ago"
  },
  {
    id: "hist-3",
    prompt: "Flying through a neon digital grid cyber tunnel retrowave style",
    duration: "5",
    resolution: "720p",
    fps: 30,
    style: "Sci-Fi",
    motion: 9,
    seed: "10294827",
    videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-flying-through-a-futuristic-neon-tunnel-44131-large.mp4",
    createdAt: "1 day ago"
  }
];

export default function Home() {
  const [activeTab, setActiveTab] = useState<string>("dashboard");
  const [credits, setCredits] = useState<number>(840);
  const [history, setHistory] = useState<VideoItem[]>(initialMockHistory);
  
  // Generator workspace states
  const [prompt, setPrompt] = useState<string>("");
  const [style, setStyle] = useState<string>("Cinematic");
  const [duration, setDuration] = useState<string>("5");
  const [resolution, setResolution] = useState<string>("1080p");
  const [fps, setFps] = useState<string>("30");
  const [motion, setMotion] = useState<number>(5);
  const [seed, setSeed] = useState<string>("38291048");

  // Simulation status states
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [statusMessage, setStatusMessage] = useState<string>("");
  const [currentVideo, setCurrentVideo] = useState<VideoItem | null>(null);

  // Auto scroll top on tab changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [activeTab]);

  const handleSelectTemplate = (template: Partial<VideoItem>) => {
    if (template.prompt) setPrompt(template.prompt);
    if (template.style) setStyle(template.style);
    if (template.duration) setDuration(template.duration);
    if (template.resolution) setResolution(template.resolution);
    if (template.fps) setFps(template.fps.toString());
    if (template.motion) setMotion(template.motion);
    if (template.seed) setSeed(template.seed);
    
    // Switch to generate workspace
    setActiveTab("generate");

    // Clear output placeholder so user can generate it fresh
    setCurrentVideo(null);
  };

  const handlePreviewVideo = (video: VideoItem) => {
    setPrompt(video.prompt);
    setStyle(video.style);
    setDuration(video.duration);
    setResolution(video.resolution);
    setFps(video.fps.toString());
    setMotion(video.motion);
    setSeed(video.seed);
    
    // Highlight in player
    setCurrentVideo(video);
    setActiveTab("generate");
  };

  const handleDeleteHistoryItem = (id: string) => {
    setHistory((prev) => prev.filter((item) => item.id !== id));
    // If the active video is deleted, reset the current preview
    if (currentVideo && currentVideo.id === id) {
      setCurrentVideo(null);
    }
  };

  const handleGenerate = () => {
    if (!prompt.trim() || isGenerating) return;

    setIsGenerating(true);
    setProgress(0);
    setStatusMessage("Connecting to GPU cluster...");

    const intervalTime = 80; // ms
    let currentProgress = 0;

    const timer = setInterval(() => {
      currentProgress += Math.floor(Math.random() * 4) + 1;
      
      if (currentProgress >= 100) {
        currentProgress = 100;
        clearInterval(timer);
        
        // Finalize generation
        setIsGenerating(false);
        setCredits((prev) => Math.max(0, prev - 10)); // Deduct credits
        
        // Choose video link based on style (fallback to Sci-Fi if missing)
        const matchedVideoUrl = styleVideoMockups[style] || styleVideoMockups["Sci-Fi"];
        
        const newVideo: VideoItem = {
          id: `vid-${Date.now()}`,
          prompt,
          duration,
          resolution,
          fps: Number(fps),
          style,
          motion,
          seed: seed || Math.floor(Math.random() * 99999999).toString(),
          videoUrl: matchedVideoUrl,
          createdAt: "Just now",
        };

        setHistory((prev) => [newVideo, ...prev]);
        setCurrentVideo(newVideo);
      } else {
        setProgress(currentProgress);
        // Dynamic status updates based on progress steps
        if (currentProgress < 25) {
          setStatusMessage("Analyzing text prompt and optimizing embeddings...");
        } else if (currentProgress < 50) {
          setStatusMessage("Synthesizing latent frames (diffusion step 12/28)...");
        } else if (currentProgress < 75) {
          setStatusMessage("Applying temporal consistent weights...");
        } else if (currentProgress < 92) {
          setStatusMessage("Rendering frames to 3D convolutional space...");
        } else {
          setStatusMessage("Compiling H.264 stream for download...");
        }
      }
    }, intervalTime);
  };

  return (
    <div className="flex min-h-screen bg-[#050508] relative">
      {/* Background Soft Glow Effects */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] rounded-full bg-purple-600/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-[600px] h-[600px] rounded-full bg-blue-500/5 blur-[150px] pointer-events-none" />
      
      {/* Sidebar Navigation */}
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        credits={credits} 
      />

      {/* Main Studio Viewport */}
      <main className="flex-1 min-h-screen flex flex-col grid-bg">
        <header className="h-16 border-b border-white/5 px-8 flex items-center justify-between bg-[#050508]/40 backdrop-blur-md sticky top-0 z-30">
          <div className="flex items-center gap-2">
            <span className="text-xs text-zinc-500 font-mono">VISIONFORGE STUDIO</span>
            <span className="h-3 w-[1px] bg-white/10" />
            <span className="text-xs font-semibold text-purple-400 font-mono uppercase">{activeTab}</span>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] text-zinc-400 font-mono font-medium tracking-wide">NODE: CUDA-US-EAST-01</span>
          </div>
        </header>

        {/* Tab View Switcher container */}
        <div className="flex-1 p-8 max-w-7xl w-full mx-auto">
          {activeTab === "dashboard" && (
            <DashboardTab 
              onNavigateToGenerate={() => setActiveTab("generate")}
              onSelectTemplate={handleSelectTemplate}
              recentVideos={history.slice(0, 3)}
              onPreviewVideo={handlePreviewVideo}
            />
          )}

          {activeTab === "generate" && (
            <GenerateTab 
              prompt={prompt}
              setPrompt={setPrompt}
              style={style}
              setStyle={setStyle}
              duration={duration}
              setDuration={setDuration}
              resolution={resolution}
              setResolution={setResolution}
              fps={fps}
              setFps={setFps}
              motion={motion}
              setMotion={setMotion}
              seed={seed}
              setSeed={setSeed}
              isGenerating={isGenerating}
              progress={progress}
              statusMessage={statusMessage}
              onGenerate={handleGenerate}
              currentVideo={currentVideo}
            />
          )}

          {activeTab === "history" && (
            <HistoryTab 
              history={history}
              onDeleteHistoryItem={handleDeleteHistoryItem}
              onPreviewVideo={handlePreviewVideo}
            />
          )}

          {activeTab === "settings" && (
            <SettingsTab />
          )}
        </div>
      </main>
    </div>
  );
}
