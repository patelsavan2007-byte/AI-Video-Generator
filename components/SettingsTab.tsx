"use client";

import React, { useState } from "react";
import { 
  Settings, 
  Cpu, 
  Database, 
  Sliders, 
  ShieldAlert, 
  Save, 
  HelpCircle,
  CreditCard,
  Zap,
  Info
} from "lucide-react";
import { SelectCustom } from "@/components/ui/select-custom";
import { SliderCustom } from "@/components/ui/slider-custom";

export function SettingsTab() {
  const [modelVersion, setModelVersion] = useState("vf-2.5");
  const [hardwareNode, setHardwareNode] = useState("us-east-cuda");
  const [guidanceScale, setGuidanceScale] = useState(7.5);
  const [samplingSteps, setSamplingSteps] = useState(30);
  const [negativePrompt, setNegativePrompt] = useState("blurry, low quality, distorted, extra limbs, bad anatomy, text, watermark, signature, flickering");
  const [saveSuccess, setSaveSuccess] = useState(false);

  const modelOptions = [
    { value: "vf-2.5", label: "VisionForge v2.5 (Default Cinematic)" },
    { value: "vf-3.0-alpha", label: "VisionForge v3.0 (Alpha - Ultra Temporal)" },
    { value: "tcd-1.5", label: "Temporal Consistent Diffusion v1.5" }
  ];

  const nodeOptions = [
    { value: "us-east-cuda", label: "US-East CUDA Cluster (Auto-scale)" },
    { value: "eu-west-h100", label: "EU-West H100 GPU Pool (Low Latency)" },
    { value: "simulation-cpu", label: "Local Simulation Node (Mock-render)" }
  ];

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
    }, 3000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-white tracking-tight">Studio Settings</h2>
        <p className="text-zinc-500 text-sm mt-1">Configure your AI synthesis parameters, default settings, and hardware limits.</p>
      </div>

      <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left column - 7 cols */}
        <div className="lg:col-span-8 space-y-6">
          {/* Model selection */}
          <div className="glass-card rounded-2xl p-5 border border-white/5 space-y-4">
            <h3 className="text-xs font-semibold text-zinc-300 uppercase tracking-wider flex items-center gap-2">
              <Cpu className="h-4 w-4 text-purple-400" />
              Diffusion Engine Settings
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-2">
                <label className="text-xs text-zinc-400 font-medium">Model Pipeline</label>
                <SelectCustom
                  options={modelOptions}
                  value={modelVersion}
                  onChange={setModelVersion}
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs text-zinc-400 font-medium">Render Node Cluster</label>
                <SelectCustom
                  options={nodeOptions}
                  value={hardwareNode}
                  onChange={setHardwareNode}
                />
              </div>
            </div>
          </div>

          {/* Inference settings */}
          <div className="glass-card rounded-2xl p-5 border border-white/5 space-y-6">
            <h3 className="text-xs font-semibold text-zinc-300 uppercase tracking-wider flex items-center gap-2">
              <Sliders className="h-4 w-4 text-purple-400" />
              Inference Hyperparameters
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
              <div className="space-y-3">
                <div className="flex justify-between items-center text-xs">
                  <label className="text-zinc-400 font-medium">Guidance Scale (CFG)</label>
                  <span className="text-purple-400 font-bold font-mono">{guidanceScale.toFixed(1)}</span>
                </div>
                <SliderCustom
                  min={1}
                  max={15}
                  step={0.5}
                  value={guidanceScale}
                  onChange={setGuidanceScale}
                />
                <p className="text-[10px] text-zinc-500 leading-normal">
                  Higher scale matches your prompt more strictly but may degrade colors or visual quality.
                </p>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center text-xs">
                  <label className="text-zinc-400 font-medium">Sampling Steps</label>
                  <span className="text-purple-400 font-bold font-mono">{samplingSteps}</span>
                </div>
                <SliderCustom
                  min={10}
                  max={50}
                  step={1}
                  value={samplingSteps}
                  onChange={setSamplingSteps}
                />
                <p className="text-[10px] text-zinc-500 leading-normal">
                  More steps lead to finer detail and realism but take longer to generate.
                </p>
              </div>
            </div>

            <div className="space-y-2 pt-2 border-t border-white/5">
              <label htmlFor="neg-prompt" className="text-xs text-zinc-400 font-medium">Negative Prompt</label>
              <textarea
                id="neg-prompt"
                value={negativePrompt}
                onChange={(e) => setNegativePrompt(e.target.value)}
                placeholder="What to exclude from the video..."
                className="w-full h-24 bg-white/5 rounded-xl border border-white/10 p-3 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-purple-500/50 resize-none leading-relaxed"
              />
              <p className="text-[10px] text-zinc-500 leading-normal">
                Comma-separated attributes that the model will actively avoid generating (e.g. low-res, text).
              </p>
            </div>
          </div>

          {/* Action button */}
          <div className="flex items-center justify-between">
            <div className="text-xs text-zinc-500 flex items-center gap-1.5">
              <Info className="h-3.5 w-3.5 text-zinc-400" />
              Settings apply to local sessions only.
            </div>
            
            <button
              type="submit"
              className="h-10 px-5 flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-blue-500 hover:from-purple-500 hover:to-blue-400 text-white font-semibold text-sm rounded-xl shadow-lg shadow-purple-500/10 hover:shadow-purple-500/20 transition-all duration-300"
            >
              <Save className="h-4 w-4" />
              Save Configurations
            </button>
          </div>
          
          {saveSuccess && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-xs font-semibold flex items-center gap-2 animate-fade-in">
              <Zap className="h-4 w-4" />
              Successfully saved all engine hyperparameters!
            </div>
          )}
        </div>

        {/* Right column - Billing / Plan - 4 cols */}
        <div className="lg:col-span-4 space-y-6">
          <div className="glass-card rounded-2xl p-5 border border-white/5 space-y-5">
            <h3 className="text-xs font-semibold text-zinc-300 uppercase tracking-wider flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-purple-400" />
              Studio License
            </h3>

            {/* Plan Info */}
            <div className="p-4 rounded-xl bg-purple-950/20 border border-purple-500/15 relative overflow-hidden">
              <div className="absolute top-0 right-0 h-16 w-16 -mr-4 -mt-4 rounded-full bg-purple-500/10 blur-xl" />
              <p className="text-[10px] text-purple-400 font-bold uppercase tracking-wider">Active Subscription</p>
              <h4 className="text-lg font-bold text-white mt-1">Creator Pro Enterprise</h4>
              <p className="text-xs text-zinc-400 mt-2 font-normal">Renewal date: <span className="text-zinc-200 font-semibold font-mono">2026-06-22</span></p>
            </div>

            {/* Quota details */}
            <div className="space-y-4 pt-2 text-xs">
              <div className="flex justify-between items-center py-2 border-b border-white/5 text-zinc-400">
                <span>Monthly Credits Allocation</span>
                <span className="text-zinc-200 font-semibold font-mono">10,000 sec</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-white/5 text-zinc-400">
                <span>Concurrency Node Cap</span>
                <span className="text-zinc-200 font-semibold">4 Tasks</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-white/5 text-zinc-400">
                <span>Maximum Resolution Allowed</span>
                <span className="text-zinc-200 font-semibold">4K UHD Enabled</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-white/5 text-zinc-400">
                <span>Dedicated GPU Node Priority</span>
                <span className="text-emerald-400 font-bold">VIP High Priority</span>
              </div>
            </div>
          </div>

          {/* System status node */}
          <div className="glass-card rounded-2xl p-5 border border-white/5 space-y-4">
            <h3 className="text-xs font-semibold text-zinc-300 uppercase tracking-wider flex items-center gap-2">
              <Database className="h-4 w-4 text-purple-400" />
              Node Infrastructure
            </h3>
            
            <div className="space-y-3.5 text-xs">
              <div className="flex items-center gap-3">
                <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <div className="flex-1">
                  <p className="text-zinc-300 font-medium">Model Cache Cluster</p>
                  <p className="text-[10px] text-zinc-500">Node ONLINE - cache hits 98%</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <div className="flex-1">
                  <p className="text-zinc-300 font-medium">Temporal Consistency Weights</p>
                  <p className="text-[10px] text-zinc-500">Loaded v1.5 weights (fp16 Precision)</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="h-2 w-2 rounded-full bg-yellow-500 animate-pulse" />
                <div className="flex-1">
                  <p className="text-zinc-300 font-medium">VRAM Allocation</p>
                  <p className="text-[10px] text-zinc-500">Peak VRAM 78.4 GB / 80 GB</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
