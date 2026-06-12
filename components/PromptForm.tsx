"use client";

import { useState } from 'react';
import { useGenerate } from '../lib/hooks/useGenerate';
import ImageUploader from './ImageUploader';
import { Wand2, Settings2 } from 'lucide-react';

interface PromptFormProps {
  onJobStarted: (jobId: string) => void;
}

export default function PromptForm({ onJobStarted }: PromptFormProps) {
  const [prompt, setPrompt] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [initImageUrl, setInitImageUrl] = useState<string | null>(null);
  
  // Advanced settings
  const [negativePrompt, setNegativePrompt] = useState('');
  const [duration, setDuration] = useState(4.0);
  const [resolution, setResolution] = useState('832x480'); // Wan2 typical wide res
  const [aspectRatio, setAspectRatio] = useState('16:9');
  
  const { mutate: generate, isPending } = useGenerate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    generate({
      prompt,
      negative_prompt: negativePrompt || undefined,
      duration,
      resolution,
      aspect_ratio: aspectRatio,
      init_image_url: initImageUrl || undefined,
    }, {
      onSuccess: (data) => {
        onJobStarted(data.job_id);
        setPrompt('');
        setInitImageUrl(null);
      },
      onError: (err) => {
        alert('Failed to start generation. Please try again.');
        console.error(err);
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="glass-panel rounded-2xl p-6 relative overflow-hidden">
      {/* Decorative gradient blur */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-brand-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
      
      <div className="relative z-10 space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            What do you want to create?
          </label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            required
            className="w-full input-field min-h-[120px] resize-none text-lg bg-surface-900/60"
            placeholder="A cinematic drone shot of a futuristic neon city at night, rain falling, reflections on the wet asphalt, cyberpunk aesthetic, 8k, highly detailed..."
          />
        </div>

        <ImageUploader onImageUploaded={setInitImageUrl} />

        <div className="border-t border-surface-600/50 pt-4">
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center gap-2 text-sm text-gray-400 hover:text-brand-400 transition-colors"
          >
            <Settings2 className="h-4 w-4" />
            {showAdvanced ? 'Hide Advanced Settings' : 'Show Advanced Settings'}
          </button>
          
          {showAdvanced && (
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-4 duration-300">
              <div className="md:col-span-2">
                <label className="block text-xs text-gray-400 mb-1">Negative Prompt</label>
                <input
                  type="text"
                  value={negativePrompt}
                  onChange={(e) => setNegativePrompt(e.target.value)}
                  className="w-full input-field text-sm"
                  placeholder="blurry, low quality, distorted, artifacts..."
                />
              </div>
              
              <div>
                <label className="block text-xs text-gray-400 mb-1">Duration (seconds)</label>
                <select
                  value={duration}
                  onChange={(e) => setDuration(parseFloat(e.target.value))}
                  className="w-full input-field text-sm"
                >
                  <option value={2.0}>2.0s</option>
                  <option value={4.0}>4.0s (Default)</option>
                  <option value={8.0}>8.0s</option>
                </select>
              </div>

              <div>
                <label className="block text-xs text-gray-400 mb-1">Resolution & Aspect Ratio</label>
                <select
                  value={`${resolution}|${aspectRatio}`}
                  onChange={(e) => {
                    const [res, ar] = e.target.value.split('|');
                    setResolution(res);
                    setAspectRatio(ar);
                  }}
                  className="w-full input-field text-sm"
                >
                  <option value="832x480|16:9">832x480 (16:9)</option>
                  <option value="480x832|9:16">480x832 (9:16)</option>
                  <option value="512x512|1:1">512x512 (1:1)</option>
                </select>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={isPending || !prompt.trim()}
            className="btn-primary py-3 px-8 flex items-center gap-2 group"
          >
            {isPending ? (
              <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              <>
                <Wand2 className="h-5 w-5 group-hover:scale-110 transition-transform" />
                Generate Video
              </>
            )}
          </button>
        </div>
      </div>
    </form>
  );
}
