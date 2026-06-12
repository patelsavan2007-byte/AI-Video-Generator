"use client";

import { useVideos } from '../lib/hooks/useVideos';
import VideoPlayer from './VideoPlayer';
import { Loader2, LayoutGrid, AlertCircle, Clock, CheckCircle2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export default function Gallery() {
  const { data: videos, isLoading, isError } = useVideos();

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="h-10 w-10 text-brand-500 animate-spin mb-4" />
        <p className="text-gray-400">Loading your creations...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-red-400 border border-red-500/30 rounded-xl bg-red-500/5">
        <AlertCircle className="h-10 w-10 mb-4" />
        <p>Failed to load gallery. Please try again.</p>
      </div>
    );
  }

  if (!videos || videos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 border border-surface-600 border-dashed rounded-2xl bg-surface-800/30">
        <LayoutGrid className="h-12 w-12 text-gray-500 mb-4" />
        <h3 className="text-lg font-medium text-gray-300">No videos yet</h3>
        <p className="text-gray-500 max-w-sm text-center mt-2">
          Your generated videos will appear here. Go to the dashboard to create your first masterpiece.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {videos.map((video) => (
        <div key={video.id} className="glass-card rounded-xl overflow-hidden flex flex-col">
          <div className="aspect-video w-full bg-surface-900 relative">
            {video.status === 'completed' && video.video_url ? (
              <VideoPlayer src={video.video_url} poster={video.thumbnail_url} className="h-full" />
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-surface-800/80">
                {video.status === 'processing' ? (
                  <Loader2 className="h-8 w-8 text-brand-500 animate-spin mb-2" />
                ) : video.status === 'queued' ? (
                  <Clock className="h-8 w-8 text-yellow-500 mb-2" />
                ) : (
                  <AlertCircle className="h-8 w-8 text-red-500 mb-2" />
                )}
                <span className="text-sm font-medium capitalize text-gray-300">{video.status}</span>
              </div>
            )}
          </div>
          
          <div className="p-4 flex-grow flex flex-col">
            <p className="text-sm text-gray-200 line-clamp-2 mb-3 flex-grow" title={video.prompt}>
              {video.prompt}
            </p>
            
            <div className="flex items-center justify-between text-xs text-gray-500 mt-auto pt-3 border-t border-surface-600/50">
              <div className="flex items-center gap-1">
                {video.status === 'completed' && <CheckCircle2 className="h-3 w-3 text-green-500" />}
                <span>{formatDistanceToNow(new Date(video.created_at), { addSuffix: true })}</span>
              </div>
              <div className="flex gap-2">
                <span className="bg-surface-700 px-1.5 py-0.5 rounded text-[10px]">{video.resolution}</span>
                <span className="bg-surface-700 px-1.5 py-0.5 rounded text-[10px]">{video.duration}s</span>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
