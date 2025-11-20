# FaceSwap RunPod Worker

Self-hosted face swap worker for RunPod Serverless using Inswapper (roop).

## Features

- ✅ **Image face swap** - Fast, high-quality face swapping for photos
- ✅ **Video face swap** - Process videos up to 30 seconds
- ✅ **GPU accelerated** - Runs on NVIDIA GPUs (RTX 4090, A100)
- ✅ **Serverless** - Auto-scales from 0 to N workers
- ✅ **Cost effective** - ~$0.03-0.15 per video (vs $0.10+ on Replicate)

## Architecture

```
┌─────────────────┐
│  FaceSwap Web   │  (Your Manus application)
└────────┬────────┘
         │
         │ HTTPS POST
         ▼
┌─────────────────┐
│  RunPod API     │  (api.runpod.ai)
└────────┬────────┘
         │
         │ Container execution
         ▼
┌─────────────────┐
│  Docker Worker  │  (This image)
│  - Inswapper    │
│  - Face detect  │
│  - Video proc   │
└─────────────────┘
```

## Files

- `Dockerfile` - Container image definition
- `handler.py` - RunPod serverless handler
- `face_swap.py` - Core face swap logic with Inswapper
- `requirements.txt` - Python dependencies
- `DEPLOYMENT.md` - Deployment guide
- `README.md` - This file

## Quick Start

See [DEPLOYMENT.md](./DEPLOYMENT.md) for full deployment instructions.

### 1. Build Docker Image

```bash
docker build -t your-username/faceswap-worker:latest .
docker push your-username/faceswap-worker:latest
```

### 2. Deploy to RunPod

1. Go to https://www.runpod.io/console/serverless
2. Create new endpoint with your Docker image
3. Copy API key and endpoint ID

### 3. Configure Application

Add to Manus Secrets:
- `RUNPOD_API_KEY` - Your RunPod API key
- `RUNPOD_ENDPOINT_ID` - Your endpoint ID

## API

### Request

```json
{
  "input": {
    "source_image_url": "https://...",
    "target_media_url": "https://...",
    "media_type": "image" | "video"
  }
}
```

### Response

```json
{
  "status": "success",
  "output": {
    "type": "base64",
    "data": "...",
    "mime_type": "image/jpeg" | "video/mp4"
  }
}
```

## Models Used

- **Inswapper** (inswapper_128.onnx) - Face swapping model
- **Buffalo_L** - Face detection and analysis
- **ONNX Runtime** - GPU-accelerated inference

## Performance

| Media Type | Duration | Processing Time | Cost (RTX 4090) |
|------------|----------|-----------------|-----------------|
| Image | - | ~10-20s | ~$0.004-0.009 |
| Video (10s) | 10s | ~60-120s | ~$0.026-0.053 |
| Video (30s) | 30s | ~180-360s | ~$0.079-0.158 |

## Limitations

- **Maximum video length**: 30 seconds
- **GPU required**: CUDA-capable GPU (RTX 4090 recommended)
- **Face detection**: Source and target must contain clear faces
- **Resolution**: Higher resolution = longer processing time

## Troubleshooting

### "No face detected"
- Ensure images contain clear, front-facing faces
- Face should be well-lit and not obscured
- Try different source image

### "Video too long"
- Maximum 30 seconds
- Trim video before upload
- Frontend validates before submission

### "Out of memory"
- Reduce video resolution
- Use smaller GPU (RTX 4090 recommended over A100 for cost)
- Increase container disk size

## Development

### Local Testing

```bash
# Install dependencies
pip install -r requirements.txt

# Download models (run once)
python -c "from face_swap import get_swapper; get_swapper()"

# Test face swap
python face_swap.py
```

### Docker Testing

```bash
# Build
docker build -t faceswap-test .

# Run locally
docker run --gpus all -p 8000:8000 faceswap-test
```

## License

This project uses:
- Inswapper (InsightFace) - Check license at https://github.com/deepinsight/insightface
- Roop - MIT License

## Credits

- Based on [runpod-worker-inswapper](https://github.com/ashleykleynhans/runpod-worker-inswapper)
- Uses [Inswapper](https://github.com/deepinsight/insightface) by InsightFace
- Inspired by [Roop](https://github.com/s0md3v/roop)
