# VisionForge AI — Tech Stack & Architecture

> **AI-powered cinematic text-to-video generation platform.**

---

## 🎨 Frontend Tech Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| **Next.js** | 16.x | React framework with App Router, SSR/SSG, file-based routing |
| **React** | 19.x | UI component library with hooks and concurrent features |
| **TypeScript** | 5.x | Static type checking across the entire frontend |
| **Tailwind CSS** | 4.x | Utility-first CSS framework with PostCSS integration |
| **Framer Motion** | 12.x | Declarative animations, layout transitions, gesture support |
| **Lucide React** | 1.x | Modern icon library (tree-shakable SVG icons) |
| **Google Identity Services** | GSI | Client-side Google OAuth 2.0 authentication |
| **class-variance-authority** | 0.7.x | Component variant management for design system primitives |
| **clsx + tailwind-merge** | Latest | Conditional class name composition without conflicts |

### Design System

- **Theme**: Dark mode with glassmorphism aesthetics
- **Colors**: Purple/blue gradient accent palette on near-black backgrounds (`#050508`)
- **Typography**: Geist Sans + Geist Mono (Vercel fonts)
- **Effects**: Backdrop blur, gradient glows, animated backgrounds, micro-interactions
- **Components**: Custom glass-card system, custom select/slider controls

---

## 🔐 Authentication

| Feature | Implementation |
|---------|---------------|
| **Email/Password Signup** | Client-side with localStorage persistence (demo) |
| **Email/Password Sign In** | Credential validation against stored accounts |
| **Google OAuth** | Google Identity Services (GSI) client-side library |
| **Session Management** | localStorage-based (swap to API when backend is ready) |
| **Auth UI** | Premium glassmorphism login/signup page with animated background |

> **Note**: Authentication currently uses localStorage for account storage. When the backend API is connected, replace `localStorage` calls in `lib/auth-context.tsx` with API calls to your backend auth endpoints.

---

## 🎬 Frontend Features (Video Generator)

### Core Video Generation UI
- **Prompt Workspace** — Full-featured text input for describing the video scene
- **Style Selector** — Choose from Cinematic, Anime, Realistic, Sci-Fi visual styles
- **Parameter Controls**:
  - Duration (5s, 10s, 15s, 30s)
  - Resolution (720p, 1080p, 4K)
  - FPS (24, 30, 60)
  - Motion Intensity (slider 1–10)
  - Seed for reproducibility
- **Real-time Generation Progress** — Animated progress bar with dynamic status messages
- **Video Preview Player** — Inline playback of generated results

### Dashboard
- **Stats Overview** — Total generations, success rate, active pipelines
- **Quick Templates** — Pre-configured prompt cards (Neon Cyber Samurai, Misty Gothic Forest, Space Portal Odyssey)
- **Recent Generations** — Video thumbnail cards with style badges and metadata

### History
- **Full Generation Log** — Browse all past generated videos
- **Delete & Re-preview** — Remove old entries or load them back into the generator
- **Metadata Display** — Resolution, FPS, style, creation time per video

### Settings
- **Model Pipeline Selection** — Choose between VisionForge v2.5, v3.0 Alpha, TCD v1.5
- **Render Node Cluster** — Select GPU cluster region
- **Inference Hyperparameters**:
  - Guidance Scale (CFG) with slider
  - Sampling Steps with slider
  - Negative Prompt text area
- **Studio License Info** — Plan details, credit allocation, concurrency limits
- **Node Infrastructure Status** — Real-time cluster health indicators

### Credits System
- **Visual Credit Tracker** — Sidebar progress bar showing remaining credits
- **Auto-deduction** — Credits deducted per generation

---

## 🖥️ Backend (Separate Branch)

The backend is managed on separate git branches and is **not** part of this frontend codebase.

| Branch | Purpose |
|--------|---------|
| `microservice/text-to-video-gen` | Core video generation microservice |
| `microservice-hf_ttv_provider` | HuggingFace text-to-video provider |

### Backend Tech Stack (Reference Only)
- **FastAPI** + **Uvicorn** — Python async web framework
- **PyTorch** — Deep learning runtime
- **Diffusers** (HuggingFace) — Diffusion model pipelines
- **Transformers** — Text embedding and encoding
- **Accelerate** — Multi-GPU training/inference
- **Pillow** — Image processing

---

## 📁 Project Structure

```
AI-Video-Generator/
├── app/
│   ├── api/                    # Next.js API routes (future use)
│   ├── globals.css             # Global styles + design tokens
│   ├── layout.tsx              # Root layout with AuthProvider
│   ├── page.tsx                # Main page (auth gate + studio)
│   └── favicon.ico
├── components/
│   ├── ui/
│   │   ├── select-custom.tsx   # Custom styled select dropdown
│   │   └── slider-custom.tsx   # Custom range slider
│   ├── AuthPage.tsx            # Login/Signup authentication page
│   ├── DashboardTab.tsx        # Dashboard overview view
│   ├── GenerateTab.tsx         # Video generation workspace
│   ├── HistoryTab.tsx          # Generation history browser
│   ├── SettingsTab.tsx         # AI model & studio settings
│   └── Sidebar.tsx             # Navigation sidebar with user info
├── lib/
│   ├── auth-context.tsx        # Authentication state management
│   └── utils.ts                # Shared utility functions (cn)
├── public/                     # Static assets
├── .gitignore
├── AGENTS.md                   # AI agent instructions
├── TECH_STACK.md               # This file
├── README.md                   # Project README
├── next.config.ts              # Next.js configuration
├── package.json                # Dependencies & scripts
├── postcss.config.mjs          # PostCSS config for Tailwind
├── eslint.config.mjs           # ESLint configuration
└── tsconfig.json               # TypeScript configuration
```

---

## 🚀 Getting Started

```bash
# Install dependencies
npm install

# Set up environment variables (optional — for Google OAuth)
# Create .env.local with: NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id

# Start development server
npm run dev

# Open http://localhost:3000
```

---

## 🔮 Future Integration Points

- [ ] Connect authentication to backend JWT-based auth API
- [ ] Replace localStorage accounts with database-backed user management
- [ ] Wire generation UI to FastAPI backend endpoints
- [ ] Add real video streaming from generation pipeline
- [ ] Implement server-side credit management
- [ ] Add password reset flow via email
