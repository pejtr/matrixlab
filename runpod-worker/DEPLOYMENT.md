# RunPod Deployment Guide - Face Swap Worker

This guide explains how to deploy the face swap worker to RunPod Serverless.

## Prerequisites

- RunPod account (sign up at https://www.runpod.io/)
- Docker Hub account (or other container registry)
- Credit card for RunPod billing

## Cost Estimate

**GPU**: RTX 4090 (~$0.00044/second)

| Video Length | Processing Time | Cost per Video |
|--------------|-----------------|----------------|
| 5-10 seconds | ~60-120s | $0.026-$0.053 |
| 15-30 seconds | ~180-360s | $0.079-$0.158 |

**Monthly estimates:**
- 100 videos/month: ~$3-5
- 1000 videos/month: ~$30-50

## Step 1: Build and Push Docker Image

```bash
# Navigate to runpod-worker directory
cd /home/ubuntu/faceswap-web/runpod-worker

# Build Docker image
docker build -t your-dockerhub-username/faceswap-worker:latest .

# Push to Docker Hub
docker login
docker push your-dockerhub-username/faceswap-worker:latest
```

## Step 2: Create RunPod Serverless Endpoint

1. Go to https://www.runpod.io/console/serverless
2. Click "New Endpoint"
3. Configure:
   - **Name**: faceswap-worker
   - **GPU**: RTX 4090 (recommended) or A100
   - **Container Image**: `your-dockerhub-username/faceswap-worker:latest`
   - **Container Disk**: 20 GB
   - **Min Workers**: 0 (auto-scale)
   - **Max Workers**: 3 (adjust based on expected load)
   - **Idle Timeout**: 5 seconds
   - **Execution Timeout**: 900 seconds (15 minutes for 30s videos)

4. Click "Deploy"

## Step 3: Get API Key and Endpoint ID

After deployment:
1. Copy your **Endpoint ID** (e.g., `abc123def456`)
2. Go to Settings → API Keys
3. Create new API key and copy it

## Step 4: Configure Your Application

Add these environment variables to your FaceSwap application:

```bash
RUNPOD_API_KEY=your-api-key-here
RUNPOD_ENDPOINT_ID=your-endpoint-id-here
```

In Manus dashboard:
1. Go to Settings → Secrets
2. Add:
   - Key: `RUNPOD_API_KEY`, Value: your API key
   - Key: `RUNPOD_ENDPOINT_ID`, Value: your endpoint ID

## Step 5: Test the Endpoint

Test with curl:

```bash
curl -X POST "https://api.runpod.ai/v2/YOUR_ENDPOINT_ID/runsync" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "input": {
      "source_image_url": "https://example.com/source.jpg",
      "target_media_url": "https://example.com/target.jpg",
      "media_type": "image"
    }
  }'
```

## API Usage

### Request Format

**Endpoint**: `https://api.runpod.ai/v2/{ENDPOINT_ID}/runsync`

**Headers**:
```
Authorization: Bearer {API_KEY}
Content-Type: application/json
```

**Body**:
```json
{
  "input": {
    "source_image_url": "https://...",
    "target_media_url": "https://...",
    "media_type": "image" | "video"
  }
}
```

### Response Format

**Success**:
```json
{
  "status": "COMPLETED",
  "output": {
    "status": "success",
    "output": {
      "type": "base64",
      "data": "base64-encoded-result",
      "mime_type": "image/jpeg" | "video/mp4"
    },
    "message": "Face swap completed successfully"
  }
}
```

**Error**:
```json
{
  "status": "FAILED",
  "error": "Error message"
}
```

## Monitoring

1. Go to RunPod Console → Serverless → Your Endpoint
2. View:
   - **Requests**: Total requests processed
   - **Errors**: Failed requests
   - **Execution Time**: Average processing time
   - **Cost**: Total spending

## Scaling

- **Auto-scaling**: Workers automatically scale 0→N based on demand
- **Cold start**: First request may take 10-20s (model loading)
- **Warm workers**: Subsequent requests are faster (~60-360s)

## Troubleshooting

### Issue: "No face detected in source image"
- Ensure source image contains a clear, front-facing face
- Face should be well-lit and not obscured

### Issue: "Video duration exceeds maximum"
- Maximum video length: 30 seconds
- Check video duration before upload

### Issue: "Timeout"
- Increase Execution Timeout in RunPod settings
- Check video length (longer videos = longer processing)

### Issue: "Out of memory"
- Use smaller video resolution
- Increase Container Disk size in RunPod settings

## Cost Optimization

1. **Use Min Workers = 0**: Only pay when processing
2. **Set Idle Timeout = 5s**: Workers shut down quickly
3. **Limit Max Workers**: Prevent unexpected costs
4. **Monitor usage**: Set up billing alerts in RunPod

## Security

- **Never commit API keys** to git
- Store keys in environment variables only
- Rotate API keys regularly
- Use HTTPS for all requests

## Support

- RunPod Documentation: https://docs.runpod.io/
- RunPod Discord: https://discord.gg/runpod
- GitHub Issues: Report bugs in your repository
