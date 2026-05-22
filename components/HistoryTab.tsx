"use client";

import React, { useState } from "react";
import { 
  Play, 
  Download, 
  Trash2, 
  X, 
  Clock, 
  Video, 
  Info,
  Layers,
  Sparkles,
  ExternalLink
} from "lucide-react";
import { VideoItem } from "@/app/page";
import { AnimatePresence, motion } from "framer-motion";

interface HistoryTabProps {
  history: VideoItem[];
  onDeleteHistoryItem: (id: string) => void;
  onPreviewVideo: (video: VideoItem) => void;
}

export function HistoryTab({ 
  history, 
  onDeleteHistoryItem, 
  onPreviewVideo 
}: HistoryTabProps) {
  const [selectedVideo, setSelectedVideo] = useState<VideoItem | null>(null);

  const downloadVideo = (url: string, style: string) => {
    const link = document.createElement("a");
    link.href = url;
    link.download = `visionforge_${style.toLowerCase()}_${Date.now()}.mp4`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-white tracking-tight">Generation History</h2>
        <p className="text-zinc-500 text-sm mt-1">Review, play, and download your previously generated AI videos.</p>
      </div>

      {history.length === 0 ? (
        <div className="glass-card rounded-2xl border border-white/5 p-12 text-center flex flex-col items-center justify-center space-y-4">
          <div className="h-12 w-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-zinc-500">
            <Video className="h-6 w-6" />
          </div>
          <div className="max-w-xs space-y-1">
            <h4 className="text-sm font-semibold text-zinc-300">History is Empty</h4>
            <p className="text-xs text-zinc-500">
              You haven't generated any videos yet. Head over to the Generate tab to create your first clip.
            </p>
          </div>
        </div>
      ) : (
        /* History Grid */
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {history.map((video) => (
            <motion.div
              layout
              key={video.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="glass-card rounded-2xl border border-white/5 overflow-hidden flex flex-col group hover:border-purple-500/20 transition-all duration-300"
            >
              {/* Aspect ratio container */}
              <div 
                onClick={() => setSelectedVideo(video)}
                className="relative aspect-video bg-zinc-950 flex items-center justify-center overflow-hidden cursor-pointer"
              >
                <video 
                  src={video.videoUrl} 
                  className="w-full h-full object-cover opacity-70 group-hover:scale-105 transition-transform duration-500" 
                  muted 
                  playsInline 
                  loop
                />
                
                {/* Hover Play Button Overlay */}
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="h-11 w-11 rounded-full bg-purple-600 text-white flex items-center justify-center shadow-lg transform scale-90 group-hover:scale-100 transition-transform">
                    <Play className="h-5 w-5 fill-current ml-0.5" />
                  </div>
                </div>

                {/* Duration Badge */}
                <span className="absolute bottom-2 right-2 px-1.5 py-0.5 text-[9px] rounded-md bg-black/70 font-mono text-zinc-300 font-bold border border-white/5">
                  {video.duration}s
                </span>
                
                {/* Style Badge */}
                <span className="absolute top-2 left-2 px-2.5 py-0.5 text-[9px] rounded-full bg-purple-500/85 font-semibold text-white border border-white/5 uppercase tracking-wider">
                  {video.style}
                </span>
              </div>

              {/* Text Context */}
              <div className="p-4 flex-1 flex flex-col justify-between space-y-4">
                <div className="space-y-1">
                  <p className="text-xs text-zinc-300 line-clamp-2 leading-relaxed italic">
                    "{video.prompt}"
                  </p>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-white/5">
                  <span className="text-[10px] font-mono text-zinc-500">
                    {video.resolution} • {video.fps}fps
                  </span>
                  
                  {/* Actions */}
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => downloadVideo(video.videoUrl, video.style)}
                      className="p-1.5 rounded-lg bg-white/5 border border-white/10 text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
                      title="Download Video"
                    >
                      <Download className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeleteHistoryItem(video.id)}
                      className="p-1.5 rounded-lg bg-red-950/20 border border-red-500/20 text-red-400 hover:text-red-300 hover:bg-red-950/40 transition-colors"
                      title="Delete from History"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Video Preview Modal overlay */}
      <AnimatePresence>
        {selectedVideo && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-4xl rounded-2xl border border-white/10 bg-zinc-950 overflow-hidden shadow-2xl flex flex-col"
            >
              {/* Modal Header */}
              <div className="p-4 border-b border-white/5 flex items-center justify-between bg-zinc-900/50">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-purple-400" />
                  <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">Preview Generation</span>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedVideo(null)}
                  className="h-8 w-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-zinc-400 hover:text-white transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Modal Content - Side by side layout */}
              <div className="grid grid-cols-1 md:grid-cols-12">
                {/* Player Column - 7/12 */}
                <div className="md:col-span-8 bg-black flex items-center justify-center aspect-video">
                  <video 
                    src={selectedVideo.videoUrl} 
                    className="w-full h-full object-contain"
                    controls 
                    autoPlay 
                    loop 
                    playsInline
                  />
                </div>

                {/* Details Column - 4/12 */}
                <div className="md:col-span-4 p-6 flex flex-col justify-between border-t md:border-t-0 md:border-l border-white/5 bg-zinc-900/20 max-h-[500px] overflow-auto">
                  <div className="space-y-5">
                    <div>
                      <h4 className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 mb-1 flex items-center gap-1">
                        <Info className="h-3 w-3" />
                        Prompt Text
                      </h4>
                      <p className="text-xs text-zinc-200 leading-relaxed italic">
                        "{selectedVideo.prompt}"
                      </p>
                    </div>

                    <div className="space-y-2">
                      <h4 className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 flex items-center gap-1">
                        <Layers className="h-3 w-3" />
                        Parameters
                      </h4>
                      <div className="grid grid-cols-2 gap-x-2 gap-y-3 text-[11px] font-mono text-zinc-400">
                        <div>
                          Style: <span className="text-zinc-200 font-sans">{selectedVideo.style}</span>
                        </div>
                        <div>
                          Duration: <span className="text-zinc-200 font-sans">{selectedVideo.duration}s</span>
                        </div>
                        <div>
                          Resolution: <span className="text-zinc-200">{selectedVideo.resolution}</span>
                        </div>
                        <div>
                          FPS: <span className="text-zinc-200">{selectedVideo.fps}</span>
                        </div>
                        <div>
                          Motion: <span className="text-zinc-200">{selectedVideo.motion}/10</span>
                        </div>
                        <div className="truncate">
                          Seed: <span className="text-zinc-200" title={selectedVideo.seed}>{selectedVideo.seed}</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 mb-1 flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        Generated
                      </h4>
                      <p className="text-xs text-zinc-300 font-medium">
                        {selectedVideo.createdAt}
                      </p>
                    </div>
                  </div>

                  <div className="pt-6 border-t border-white/5 flex gap-2">
                    <button
                      type="button"
                      onClick={() => downloadVideo(selectedVideo.videoUrl, selectedVideo.style)}
                      className="flex-1 h-9 flex items-center justify-center gap-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-xs font-semibold text-white transition-colors"
                    >
                      <Download className="h-3.5 w-3.5" />
                      Download MP4
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        onPreviewVideo(selectedVideo);
                        setSelectedVideo(null);
                      }}
                      className="h-9 px-3 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-xs font-semibold text-zinc-300 transition-colors flex items-center justify-center"
                      title="Load Settings back to Generate Tab"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
