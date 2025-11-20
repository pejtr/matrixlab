# FaceSwap AI - AI-Powered Face Swap Application

Modern web application for face swapping in videos and photos, powered by FaceFusion.

## 🚀 Features

- **Video Face Swap** - Swap faces in MP4, MOV, and WEBM videos
- **Photo Face Swap** - Transform faces in JPG, PNG, and WEBP images
- **Real-time Progress Tracking** - Monitor job status with live updates
- **Job History** - View and download all your previous face swaps
- **Modern UI** - Beautiful gradient design with glassmorphism effects
- **User Authentication** - Secure login with Manus OAuth
- **Cloud Storage** - Files stored securely in S3

## 🛠️ Tech Stack

- **Frontend:** React 19 + Vite + TailwindCSS 4 + shadcn/ui
- **Backend:** Express + tRPC
- **Database:** MySQL (via Drizzle ORM)
- **Storage:** AWS S3
- **Face Swap Engine:** FaceFusion (open-source)

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
cd faceswap-web
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

The application includes a demo worker that simulates face swap processing without requiring FaceFusion installation. This is perfect for:

- Development and testing
- UI/UX demonstrations
- Proof of concept

**Demo worker features:**
- Processes jobs every 3 seconds
- Simulates 5-second processing time
- Returns the target media as the result (no actual face swapping)

## 🔧 Production Setup

For production use with actual face swapping:

1. Install FaceFusion following the guide in `FACEFUSION_SETUP.md`

2. Create a production worker that calls FaceFusion CLI:
   - See example in `FACEFUSION_SETUP.md`
   - Replace demo logic with actual FaceFusion execution
   - Handle file downloads, processing, and result uploads

3. Run the worker as a system service:
```bash
# Using PM2
pm2 start server/productionWorker.ts --name faceswap-worker

# Or using systemd
sudo systemctl start faceswap-worker
```

## 📁 Project Structure

```
faceswap-web/
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

**Face Swap:**
- `faceSwap.uploadSource` - Get upload URL for source image
- `faceSwap.uploadTarget` - Get upload URL for target media
- `faceSwap.confirmUpload` - Confirm file upload to S3
- `faceSwap.createJob` - Create new face swap job
- `faceSwap.getJob` - Get job status and result
- `faceSwap.getMyJobs` - Get user's job history
- `faceSwap.updateJobStatus` - Update job status (worker only)

### REST Endpoints

- `POST /api/faceswap/upload/:fileKey` - Direct file upload

## 🔐 Security

- User authentication via Manus OAuth
- Session-based authorization
- S3 file keys include user ID to prevent unauthorized access
- File size limits enforced (100MB max)
- Input validation with Zod schemas

## 🎨 Branding

For optimal SEO and viral impact, consider these naming options:

**Recommended:** SwapAI (swapai.io)
- Leverages the +900% growth in "AI face swap" searches
- Short, memorable, modern
- International appeal

See `branding_analysis.md` for detailed keyword research and recommendations.

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

- **FaceFusion** - Open-source face swap engine
- **Manus Platform** - Hosting and infrastructure
- **shadcn/ui** - UI component library

## 🔗 Links

- [FaceFusion GitHub](https://github.com/facefusion/facefusion)
- [FaceFusion Website](https://facefusion.io/)
- [Manus Platform](https://manus.im/)

---

**Note:** This application is designed for private use only. Always obtain consent before using someone's face and respect privacy laws.
