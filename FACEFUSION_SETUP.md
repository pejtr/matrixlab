# FaceFusion Integration Guide

This application is designed to work with FaceFusion, an open-source face swap engine. The web interface is complete, but you need to install and configure FaceFusion separately to process face swap jobs.

## Prerequisites

- Python 3.11+
- GPU with CUDA support (recommended) or CPU
- 8GB+ RAM (16GB recommended)
- 50GB+ free disk space

## Installing FaceFusion

### Option 1: Quick Start (Windows/macOS)

FaceFusion provides pre-built installers for easy setup:

1. Visit [https://facefusion.io/](https://facefusion.io/)
2. Download the installer for your platform
3. Run the installer and follow the instructions

### Option 2: Manual Installation (All Platforms)

```bash
# Clone FaceFusion repository
git clone https://github.com/facefusion/facefusion
cd facefusion

# Create virtual environment
python3.11 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Download AI models
python facefusion.py force-download
```

## Worker Process Integration

The web application creates jobs in the database, but you need a worker process to execute them using FaceFusion.

### Creating the Worker Script

Create a file `worker.py` in the project root:

```python
import os
import time
import subprocess
from server.db import getDb, updateFaceSwapJobStatus
from server.storage import storagePut
from drizzle.schema import faceSwapJobs
from sqlalchemy import select

# Path to your FaceFusion installation
FACEFUSION_PATH = "/path/to/facefusion"
FACEFUSION_PYTHON = os.path.join(FACEFUSION_PATH, "venv/bin/python")
FACEFUSION_SCRIPT = os.path.join(FACEFUSION_PATH, "facefusion.py")

async def process_pending_jobs():
    """Process all pending face swap jobs"""
    db = await getDb()
    if not db:
        print("Database not available")
        return
    
    # Find pending jobs
    pending_jobs = await db.execute(
        select(faceSwapJobs).where(faceSwapJobs.status == "pending")
    )
    
    for job in pending_jobs:
        try:
            print(f"Processing job {job.id}...")
            
            # Update status to processing
            await updateFaceSwapJobStatus(job.id, "processing")
            
            # Download source and target files
            source_path = f"/tmp/source_{job.id}.jpg"
            target_path = f"/tmp/target_{job.id}.{get_extension(job.targetMediaUrl)}"
            output_path = f"/tmp/result_{job.id}.{get_extension(job.targetMediaUrl)}"
            
            download_file(job.sourceImageUrl, source_path)
            download_file(job.targetMediaUrl, target_path)
            
            # Run FaceFusion
            cmd = [
                FACEFUSION_PYTHON,
                FACEFUSION_SCRIPT,
                "headless-run",
                "--source", source_path,
                "--target", target_path,
                "--output", output_path,
                "--execution-provider", "cuda"  # or "cpu"
            ]
            
            result = subprocess.run(cmd, capture_output=True, text=True)
            
            if result.returncode == 0:
                # Upload result to S3
                with open(output_path, 'rb') as f:
                    result_key = f"user-{job.userId}/results/result_{job.id}.{get_extension(job.targetMediaUrl)}"
                    upload_result = await storagePut(
                        result_key,
                        f.read(),
                        get_mime_type(output_path)
                    )
                
                # Update job as completed
                await updateFaceSwapJobStatus(
                    job.id,
                    "completed",
                    {
                        "resultMediaKey": upload_result.key,
                        "resultMediaUrl": upload_result.url,
                        "completedAt": datetime.now()
                    }
                )
                print(f"Job {job.id} completed successfully")
            else:
                # Update job as failed
                await updateFaceSwapJobStatus(
                    job.id,
                    "failed",
                    {"errorMessage": result.stderr}
                )
                print(f"Job {job.id} failed: {result.stderr}")
            
            # Cleanup temp files
            for path in [source_path, target_path, output_path]:
                if os.path.exists(path):
                    os.remove(path)
                    
        except Exception as e:
            print(f"Error processing job {job.id}: {e}")
            await updateFaceSwapJobStatus(
                job.id,
                "failed",
                {"errorMessage": str(e)}
            )

def get_extension(url):
    """Extract file extension from URL"""
    return url.split('.')[-1].split('?')[0]

def get_mime_type(path):
    """Get MIME type from file extension"""
    ext = path.split('.')[-1].lower()
    mime_types = {
        'jpg': 'image/jpeg',
        'jpeg': 'image/jpeg',
        'png': 'image/png',
        'webp': 'image/webp',
        'mp4': 'video/mp4',
        'mov': 'video/quicktime',
        'webm': 'video/webm',
    }
    return mime_types.get(ext, 'application/octet-stream')

def download_file(url, path):
    """Download file from URL to local path"""
    import requests
    response = requests.get(url)
    with open(path, 'wb') as f:
        f.write(response.content)

if __name__ == "__main__":
    import asyncio
    
    print("Worker started. Polling for jobs...")
    while True:
        asyncio.run(process_pending_jobs())
        time.sleep(10)  # Check every 10 seconds
```

### Running the Worker

```bash
# Make sure you're in the project directory
cd /home/ubuntu/faceswap-web

# Run the worker
python worker.py
```

For production, you should run the worker as a system service (systemd on Linux) or use a process manager like PM2.

## Alternative: Redis Queue Integration

For better scalability, you can use Redis Queue (RQ) instead of polling:

```bash
# Install RQ
pip install rq redis

# Start Redis
redis-server

# Run worker
rq worker faceswap
```

Then modify the `createJob` procedure in `server/routers.ts` to enqueue jobs to Redis instead of just saving to the database.

## Testing

To test if FaceFusion is working:

```bash
cd /path/to/facefusion
python facefusion.py headless-run \
  --source test_source.jpg \
  --target test_target.jpg \
  --output result.jpg
```

## Troubleshooting

### GPU Not Detected

If CUDA is not working, fall back to CPU:
```bash
--execution-provider cpu
```

### Out of Memory

Reduce video resolution or process shorter clips:
```bash
--output-video-quality 80
```

### Model Download Fails

Manually download models from the FaceFusion repository and place them in the `models/` directory.

## Performance Tips

- Use GPU acceleration for 10-50x faster processing
- For videos, processing time is approximately 10-30 seconds per minute of video on a modern GPU
- Batch processing multiple jobs can be more efficient than processing one at a time

## Security Notes

- This is designed for private use only
- Always obtain consent before using someone's face
- Do not use for creating misleading or harmful content
- Consider adding watermarks to generated content
