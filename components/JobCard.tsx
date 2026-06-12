"use client";

import { useJobPoller } from '../lib/hooks/useJobPoller';
import VideoPlayer from './VideoPlayer';
import { Loader2, AlertCircle, Clock, CheckCircle2 } from 'lucide-react';

interface JobCardProps {
  jobId: string;
}

export default function JobCard({ jobId }: JobCardProps) {
  const { data: job, isLoading, isError } = useJobPoller(jobId);

  if (isLoading) {
    return (
      <div className="glass-panel rounded-2xl p-6 h-64 flex flex-col items-center justify-center">
        <Loader2 className="h-8 w-8 text-brand-500 animate-spin mb-4" />
        <p className="text-gray-400">Loading job status...</p>
      </div>
    );
  }

  if (isError || !job) {
    return (
      <div className="glass-panel rounded-2xl p-6 h-64 flex flex-col items-center justify-center border-red-500/30">
        <AlertCircle className="h-8 w-8 text-red-500 mb-4" />
        <p className="text-red-400 text-center">Failed to load job status.<br/>The job might have been cancelled or deleted.</p>
      </div>
    );
  }

  const isComplete = job.status === 'completed';
  const isFailed = job.status === 'failed';
  const isProcessing = job.status === 'processing';
  const isQueued = job.status === 'queued';

  return (
    <div className="glass-panel rounded-2xl overflow-hidden shadow-2xl animate-in slide-in-from-bottom-8 duration-500">
      <div className="p-4 border-b border-surface-600/50 bg-surface-800/80 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {isComplete && <CheckCircle2 className="h-5 w-5 text-green-500" />}
          {isProcessing && <Loader2 className="h-5 w-5 text-brand-400 animate-spin" />}
          {isQueued && <Clock className="h-5 w-5 text-yellow-500" />}
          {isFailed && <AlertCircle className="h-5 w-5 text-red-500" />}
          
          <h3 className="font-medium text-gray-200 capitalize">
            {job.status}
          </h3>
        </div>
        <div className="text-xs text-gray-500 font-mono">
          ID: {job.job_id.split('-')[0]}
        </div>
      </div>

      <div className="p-6">
        <div className="mb-6">
          <p className="text-gray-300 italic border-l-2 border-brand-500/50 pl-4 py-1 text-sm">
            "{job.prompt}"
          </p>
        </div>

        {isComplete && job.video_url ? (
          <div className="mt-4 rounded-xl overflow-hidden border border-surface-600 bg-black shadow-lg">
            <VideoPlayer src={job.video_url} poster={job.thumbnail_url} />
          </div>
        ) : isFailed ? (
          <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm mt-4">
            <strong>Error:</strong> {job.error_msg || 'Generation failed'}
          </div>
        ) : (
          <div className="mt-6">
            <div className="flex justify-between text-xs text-gray-400 mb-2">
              <span>Progress</span>
              <span>{job.progress}%</span>
            </div>
            <div className="h-2 w-full bg-surface-700 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-brand transition-all duration-1000 ease-out relative"
                style={{ width: `${job.progress}%` }}
              >
                <div className="absolute top-0 right-0 bottom-0 left-0 bg-white/20 animate-pulse"></div>
              </div>
            </div>
            {isQueued && (
              <p className="text-center text-sm text-gray-400 mt-4 animate-pulse">
                Waiting in queue...
              </p>
            )}
            {isProcessing && (
              <p className="text-center text-sm text-brand-400 mt-4 animate-pulse">
                Generating video frames...
              </p>
            )}
          </div>
        )}

        <div className="mt-6 flex flex-wrap gap-2 text-xs text-gray-500">
          <span className="bg-surface-700/50 px-2 py-1 rounded">Res: {job.resolution}</span>
          <span className="bg-surface-700/50 px-2 py-1 rounded">AR: {job.aspect_ratio}</span>
          <span className="bg-surface-700/50 px-2 py-1 rounded">{job.duration}s @ {job.fps}fps</span>
        </div>
      </div>
    </div>
  );
}
