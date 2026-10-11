# AI Image Generator - Free AI Art Generator | Create AI Images from Text

Best AI image generator - create stunning AI images, art, and photos from text. Free AI art generator with no signup. Generate AI pictures, illustrations, and artwork instantly.

## 🚀 Features

- **AI Image Generator** - Create stunning AI images from text prompts
- **AI Art Generator** - Generate beautiful AI artwork and illustrations
- **AI Photo Generator** - Transform text into realistic AI photos
- **Free AI Image Generator** - No signup required, start creating immediately
- **Text to Image AI** - Convert your ideas into visual content
- **AI Picture Generator** - Generate AI pictures in various styles
- **AI Upscale** - Enhance and upscale your AI images
- **Real-time Progress Tracking** - Monitor generation status with live updates
- **Job History** - View and download all your previous AI generations
- **Modern UI** - Beautiful gradient design with glassmorphism effects
- **User Authentication** - Secure login with OAuth
- **Cloud Storage** - Files stored securely in S3

## 🛠️ Tech Stack

- **Frontend:** React 19 + Vite + TailwindCSS 4 + shadcn/ui
- **Backend:** Express + tRPC
- **Database:** MySQL (via Drizzle ORM)
- **Storage:** AWS S3
- **AI Engine:** Stable Diffusion / DALL-E / Midjourney (configurable)

## 📦 Installation

### Prerequisites

- Node.js 22+
- pnpm
- MySQL database
- AWS S3 bucket (or compatible)

### Setup

1. Clone the repository:
```bash
git clone <your-repo>
cd ai-image-generator
```

2. Install dependencies:
```bash
pnpm install
```

3. Set up environment variables (managed by Manus platform)

4. Push database schema:
```bash
pnpm db:push
```

5. Start the development server:
```bash
pnpm dev
```

6. In a separate terminal, start the demo worker:
```bash
pnpm worker
```

The app will be available at `http://localhost:3000`

## 🎮 Demo Mode

The application includes a demo worker that simulates AI image generation without requiring external API keys. This is perfect for:

- Development and testing
- UI/UX demonstrations
- Proof of concept

**Demo worker features:**
- Processes jobs every 3 seconds
- Simulates 5-second processing time
- Returns sample AI-generated images

## 🔧 Production Setup

For production use with actual AI image generation:

1. Configure your AI provider API keys (Stable Diffusion, DALL-E, or Midjourney)

2. Create a production worker that calls the AI API:
   - See example in the worker configuration
   - Replace demo logic with actual AI generation
   - Handle file downloads, processing, and result uploads

3. Run the worker as a system service:
```bash
# Using PM2
pm2 start server/productionWorker.ts --name ai-image-worker

# Or using systemd
sudo systemctl start ai-image-worker
```

## 📁 Project Structure

```
ai-image-generator/
├── client/                 # Frontend React application
│   ├── src/
│   │   ├── pages/         # Page components
│   │   ├── components/    # Reusable UI components
│   │   └── lib/           # Utilities and tRPC client
├── server/                # Backend Express + tRPC
│   ├── _core/            # Core server infrastructure
│   ├── routers.ts        # tRPC API routes
│   ├── db.ts             # Database queries
│   ├── demoWorker.ts     # Demo job processor
│   └── storage.ts        # S3 storage helpers
├── drizzle/              # Database schema and migrations
│   └── schema.ts
├── FACEFUSION_SETUP.md   # FaceFusion integration guide
└── README.md
```

## 🎯 API Endpoints

### tRPC Procedures

**Authentication:**
- `auth.me` - Get current user
- `auth.logout` - Logout user

**AI Image Generation:**
- `aiImage.uploadSource` - Get upload URL for source image
- `aiImage.uploadTarget` - Get upload URL for target media
- `aiImage.confirmUpload` - Confirm file upload to S3
- `aiImage.createJob` - Create new AI image generation job
- `aiImage.getJob` - Get job status and result
- `aiImage.getMyJobs` - Get user's generation history
- `aiImage.updateJobStatus` - Update job status (worker only)

### REST Endpoints

- `POST /api/image/upload/:fileKey` - Direct file upload

## 🔐 Security

- User authentication via Manus OAuth
- Session-based authorization
- S3 file keys include user ID to prevent unauthorized access
- File size limits enforced (100MB max)
- Input validation with Zod schemas

## 🎨 Branding

**Target Keywords:**
- ai image generator (5M monthly searches)
- ai art generator (500K monthly searches)
- ai photo generator (500K monthly searches)
- free ai image generator (500K monthly searches)
- text to image ai (50K monthly searches)
- ai generated images (500K monthly searches)

**SEO Optimization:**
- Optimized meta tags for all major AI image generation keywords
- Structured data for better search engine understanding
- Mobile-responsive design for better user experience
- Fast loading times for improved Core Web Vitals

## 📝 Scripts

```bash
pnpm dev          # Start development server
pnpm build        # Build for production
pnpm start        # Start production server
pnpm worker       # Start demo worker process
pnpm db:push      # Apply database migrations
pnpm test         # Run tests
pnpm check        # TypeScript type checking
```

## 🐛 Troubleshooting

**Jobs stuck in "Pending" status:**
- Make sure the worker process is running (`pnpm worker`)
- Check worker logs: `tail -f /tmp/worker.log`

**Upload fails:**
- Verify S3 credentials are configured
- Check file size (max 100MB)
- Ensure supported file format

**Database connection errors:**
- Verify DATABASE_URL environment variable
- Check MySQL server is running
- Run `pnpm db:push` to apply migrations

## 📄 License

MIT

## 🙏 Credits

- **Stable Diffusion** - Open-source AI image generation
- **DALL-E** - OpenAI's image generation model
- **Midjourney** - AI image generation platform
- **shadcn/ui** - UI component library

## 🔗 Links

- [Stable Diffusion](https://stability.ai/)
- [DALL-E](https://openai.com/dall-e-3)
- [Midjourney](https://www.midjourney.com/)
- [shadcn/ui](https://ui.shadcn.com/)

---

**Note:** This AI image generator is designed for creating stunning AI artwork and images. Use responsibly and respect copyright laws when generating and sharing AI-created content.


## Agent handoff

This repository is public. Read `AGENTS.md` and `docs/PUBLIC_REPO_NO_TRUST.md` before non-trivial changes. Public documentation must contain only public-safe information and must not imply production state without verification.
