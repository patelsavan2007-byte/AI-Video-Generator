"use client";

import React, { useState, useEffect } from "react";
import { 
  Sparkles, 
  Dices, 
  Download, 
  RefreshCw, 
  Film, 
  Layers, 
  Cpu, 
  Hash, 
  Maximize,
  Compass,
  Video
} from "lucide-react";
import { SelectCustom } from "@/components/ui/select-custom";
import { SliderCustom } from "@/components/ui/slider-custom";
import { useGenerate } from "@/lib/hooks/useGenerate";
import { useJobPoller } from "@/lib/hooks/useJobPoller";
import { useSearchParams } from "next/navigation";

const randomPrompts = [
  "A futuristic samurai walking in neon Tokyo during heavy rain, dramatic backlighting, cybernetic details",
  "A majestic dragon perched on top of a futuristic skyscrapers mountain peak under double moons",
  "Stunning cinematic anime of a girl standing near a railway track as a shooting star showers across the violet sky",
  "Hyper-realistic close-up of a cybernetic tiger with glowing orange stripes prowling through a digital rainforest",
  "Astronaut flying through a wormhole with swirling neon stardust and glowing galactic rings",
  "Epic sci-fi space battle showing motherships hovering near Saturn, glowing energy shields and laser beams"
];

const stylesList = [
  { value: "Cinematic", label: "Cinematic" },
  { value: "Anime", label: "Anime" },
  { value: "Realistic", label: "Realistic" },
  { value: "Sci-Fi", label: "Sci-Fi" }
];

const durationOptions = [
  { value: "5", label: "5 Seconds" },
  { value: "10", label: "10 Seconds" },
  { value: "15", label: "15 Seconds" }
];

const resolutionOptions = [
  { value: "1280x720", label: "720p (HD)" },
  { value: "1920x1080", label: "1080p (Full HD)" },
  { value: "3840x2160", label: "4K (Ultra HD)" }
];

const fpsOptions = [
  { value: "24", label: "24 FPS (Cinematic)" },
  { value: "30", label: "30 FPS (Standard)" },
  { value: "60", label: "60 FPS (Smooth)" }
];

export default function GeneratePage() {
  const searchParams = useSearchParams();
  
  const [prompt, setPrompt] = useState("");
  const [style, setStyle] = useState("Cinematic");
  const [duration, setDuration] = useState("5");
  const [resolution, setResolution] = useState("1920x1080");
  const [fps, setFps] = useState("30");
  const [motion, setMotion] = useState(5);
  const [seed, setSeed] = useState(Math.floor(Math.random() * 9999999).toString());
  
  const [jobId, setJobId] = useState<string | null>(null);

  // Auto-fill from search params
  useEffect(() => {
    if (searchParams) {
      if (searchParams.get("prompt")) setPrompt(searchParams.get("prompt")!);
      if (searchParams.get("style")) setStyle(searchParams.get("style")!);
      if (searchParams.get("duration")) setDuration(searchParams.get("duration")!);
    }
  }, [searchParams]);

  const { mutate: generate, isPending: isStartingGeneration } = useGenerate();
  const { data: jobData } = useJobPoller(jobId);

  const handleRandomize = () => {
    const randomIndex = Math.floor(Math.random() * randomPrompts.length);
    setPrompt(randomPrompts[randomIndex]);
    const randomStyle = stylesList[Math.floor(Math.random() * stylesList.length)].value;
    setStyle(randomStyle);
    setSeed(Math.floor(Math.random() * 99999999).toString());
  };

  const handleGenerate = () => {
    if (!prompt.trim()) return;
    
    // Construct actual prompt to backend optionally including style
    const fullPrompt = style ? `[Style: ${style}] ${prompt}` : prompt;

    generate({
      prompt: fullPrompt,
      duration: parseFloat(duration),
      fps: parseInt(fps),
      resolution: resolution,
      seed: parseInt(seed) || undefined,
      aspect_ratio: "16:9"
    }, {
      onSuccess: (res) => {
        setJobId(res.job_id);
      },
      onError: (err) => {
        alert("Failed to start generation.");
        console.error(err);
      }
    });
  };

  const downloadVideo = (url: string) => {
    const link = document.createElement("a");
    link.href = url;
    link.download = `visionforge_${style.toLowerCase()}_${Date.now()}.mp4`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const isGenerating = isStartingGeneration || (jobData && (jobData.status === 'queued' || jobData.status === 'processing'));
  const currentVideo = jobData?.status === 'completed' ? jobData : null;
  const progress = jobData?.progress || 0;
  const statusMessage = jobData?.status === 'queued' ? "Waiting for GPU allocation..." : "Processing video frames...";

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-white tracking-tight">AI Text-to-Video Generator</h2>
        <p className="text-zinc-500 text-sm mt-1">Generate cinematic AI videos using diffusion models.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Settings & Input - 7 columns */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Prompt input card */}
          <div className="glass-card rounded-2xl p-5 border border-white/5 space-y-4">
            <div className="flex justify-between items-center">
              <label htmlFor="prompt-input" className="text-xs font-semibold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
                <Compass className="h-4 w-4 text-purple-400" />
                Input Prompt
              </label>
              <button
                type="button"
                onClick={handleRandomize}
                className="flex items-center gap-1.5 text-xs text-purple-400 hover:text-purple-300 font-medium transition-colors bg-purple-500/10 border border-purple-500/20 px-2.5 py-1 rounded-lg"
              >
                <Dices className="h-3.5 w-3.5" />
                Randomize
              </button>
            </div>
            
            <div className="relative">
              <textarea
                id="prompt-input"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="A futuristic samurai walking in neon Tokyo during heavy rain..."
                className="w-full h-32 bg-white/5 rounded-xl border border-white/10 p-4 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/50 resize-none leading-relaxed transition-all"
              />
            </div>

            <button
              type="button"
              disabled={!!isGenerating || !prompt.trim()}
              onClick={handleGenerate}
              className="w-full h-12 flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-blue-500 hover:from-purple-500 hover:to-blue-400 text-white font-semibold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-purple-500/10 hover:shadow-purple-500/20 transition-all duration-300 transform active:scale-99"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span>Synthesizing Video...</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  <span>Generate Video</span>
                </>
              )}
            </button>
          </div>

          {/* Configuration Settings */}
          <div className="glass-card rounded-2xl p-5 border border-white/5 space-y-6">
            <h3 className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">Video Settings</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div className="space-y-2">
                <label className="text-xs text-zinc-400 font-medium">Duration</label>
                <SelectCustom
                  options={durationOptions}
                  value={duration}
                  onChange={setDuration}
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs text-zinc-400 font-medium">Resolution</label>
                <SelectCustom
                  options={resolutionOptions}
                  value={resolution}
                  onChange={setResolution}
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs text-zinc-400 font-medium">Framerate</label>
                <SelectCustom
                  options={fpsOptions}
                  value={fps}
                  onChange={setFps}
                />
              </div>
            </div>

            {/* Style Selector Chips */}
            <div className="space-y-3">
              <label className="text-xs text-zinc-400 font-medium block">Visual Style</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {stylesList.map((item) => (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() => setStyle(item.value)}
                    className={`h-10 rounded-xl text-xs font-semibold tracking-wide border transition-all duration-200 ${
                      style === item.value
                        ? "bg-purple-600/25 border-purple-500 text-white shadow-md shadow-purple-500/10"
                        : "bg-white/5 border-white/5 hover:border-white/10 text-zinc-400 hover:text-zinc-200"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Motion & Seed */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-end pt-2">
              <div className="md:col-span-7 space-y-3">
                <div className="flex justify-between items-center text-xs">
                  <label className="text-zinc-400 font-medium">Motion Strength</label>
                  <span className="text-purple-400 font-bold font-mono">{motion}</span>
                </div>
                <SliderCustom
                  min={1}
                  max={10}
                  step={1}
                  value={motion}
                  onChange={setMotion}
                />
              </div>

              <div className="md:col-span-5 space-y-2">
                <div className="flex justify-between items-center">
                  <label htmlFor="seed-input" className="text-xs text-zinc-400 font-medium">Seed</label>
                  <button
                    type="button"
                    onClick={() => setSeed(Math.floor(Math.random() * 99999999).toString())}
                    className="text-[10px] text-purple-400 hover:text-purple-300 font-semibold"
                  >
                    Random
                  </button>
                </div>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-zinc-500">
                    <Hash className="h-3.5 w-3.5" />
                  </span>
                  <input
                    id="seed-input"
                    type="text"
                    value={seed}
                    onChange={(e) => setSeed(e.target.value.replace(/\D/g, ''))}
                    placeholder="Enter seed number"
                    className="w-full h-10 bg-white/5 rounded-lg border border-white/10 pl-8 pr-3 text-sm text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/50 font-mono"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Preview Output - 5 columns */}
        <div className="lg:col-span-5 space-y-6">
          <div className="glass-card rounded-2xl border border-white/5 overflow-hidden flex flex-col min-h-[460px]">
            {/* Visual Header */}
            <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between">
              <h3 className="text-xs font-semibold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
                <Video className="h-4 w-4 text-purple-400" />
                Video Output
              </h3>
              {currentVideo && (
                <span className="text-[10px] bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider">
                  Ready
                </span>
              )}
            </div>

            {/* Content Area */}
            <div className="flex-1 p-5 flex flex-col justify-center items-center">
              {isGenerating ? (
                /* Progress Section */
                <div className="w-full space-y-6 px-4 py-8 text-center animate-fade-in">
                  <div className="mx-auto h-12 w-12 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 animate-pulse">
                    <Cpu className="h-6 w-6 animate-spin" style={{ animationDuration: '3s' }} />
                  </div>
                  
                  <div className="space-y-2">
                    <h4 className="text-sm font-semibold text-white">Synthesizing Prompt</h4>
                    <p className="text-xs text-zinc-400 min-h-[16px] transition-all">{statusMessage}</p>
                  </div>

                  {/* Progress Bar Container */}
                  <div className="space-y-1.5">
                    <div className="w-full bg-zinc-800/80 h-2.5 rounded-full overflow-hidden border border-white/5">
                      <div 
                        className="bg-gradient-to-r from-purple-500 via-fuchsia-500 to-blue-500 h-full rounded-full transition-all duration-300 shadow-md shadow-purple-500/20"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <div className="flex justify-between items-center text-[10px] font-mono text-zinc-500">
                      <span>diffusion steps</span>
                      <span className="font-bold text-zinc-300">{progress}%</span>
                    </div>
                  </div>
                </div>
              ) : currentVideo ? (
                /* Output Section - Render Video */
                <div className="w-full space-y-5 flex-1 flex flex-col justify-between">
                  <div className="relative aspect-video rounded-xl bg-black border border-white/10 overflow-hidden group/player">
                    <video
                      key={currentVideo.job_id}
                      src={currentVideo.video_url}
                      className="w-full h-full object-cover"
                      controls
                      autoPlay
                      loop
                      playsInline
                    />
                    <div className="absolute top-2 right-2 opacity-0 group-hover/player:opacity-100 transition-opacity">
                      <button 
                        type="button"
                        onClick={() => window.open(currentVideo.video_url, "_blank")}
                        className="h-8 w-8 rounded-lg bg-black/60 hover:bg-black/80 border border-white/10 flex items-center justify-center text-white"
                        title="Expand"
                      >
                        <Maximize className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => currentVideo.video_url && downloadVideo(currentVideo.video_url)}
                      className="h-10 flex items-center justify-center gap-1.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-xs font-semibold text-white transition-colors"
                    >
                      <Download className="h-4 w-4" />
                      Download MP4
                    </button>
                    <button
                      type="button"
                      onClick={handleGenerate}
                      className="h-10 flex items-center justify-center gap-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-xs font-semibold text-white transition-all shadow-md shadow-purple-500/10"
                    >
                      <RefreshCw className="h-4 w-4" />
                      Regenerate
                    </button>
                  </div>

                  {/* Metadata Card */}
                  <div className="rounded-xl border border-white/5 bg-white/5 p-4 space-y-3 text-xs">
                    <div className="flex items-center gap-1.5 text-zinc-400 font-semibold uppercase tracking-wider text-[10px]">
                      <Layers className="h-3.5 w-3.5" />
                      <span>Generation Parameters</span>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-zinc-400 font-mono">
                      <div>
                        Style: <span className="text-zinc-200 font-semibold font-sans">{style}</span>
                      </div>
                      <div>
                        Duration: <span className="text-zinc-200 font-semibold font-sans">{currentVideo.duration}s</span>
                      </div>
                      <div>
                        Resolution: <span className="text-zinc-200 font-semibold">{currentVideo.resolution}</span>
                      </div>
                      <div>
                        FPS: <span className="text-zinc-200 font-semibold">{currentVideo.fps}</span>
                      </div>
                      <div>
                        Motion: <span className="text-zinc-200 font-semibold">{motion}/10</span>
                      </div>
                      <div className="truncate">
                        Seed: <span className="text-zinc-200 font-semibold">{currentVideo.seed}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                /* Empty Placeholder */
                <div className="text-center py-12 px-4 space-y-4">
                  <div className="mx-auto h-12 w-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-zinc-400">
                    <Film className="h-5 w-5" />
                  </div>
                  <div className="space-y-1 max-w-[240px]">
                    <h4 className="text-sm font-semibold text-zinc-300">Ready to Synthesize</h4>
                    <p className="text-xs text-zinc-500 leading-normal">
                      Enter a visual description in the prompt box and adjust settings to render your AI video.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
