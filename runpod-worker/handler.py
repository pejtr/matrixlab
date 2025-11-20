"""
RunPod Serverless Handler for Face Swap
Handles async requests from RunPod API
"""

import runpod
import os
import tempfile
import requests
import logging
from face_swap import get_swapper
import base64

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def download_file(url, output_path):
    """Download file from URL"""
    try:
        logger.info(f"Downloading: {url}")
        response = requests.get(url, timeout=60)
        response.raise_for_status()
        
        with open(output_path, 'wb') as f:
            f.write(response.content)
        
        logger.info(f"Downloaded to: {output_path}")
        return output_path
    except Exception as e:
        logger.error(f"Download failed: {str(e)}")
        return None


def upload_to_s3_or_base64(file_path):
    """
    Convert output file to base64 for return
    In production, you would upload to S3 and return URL
    """
    try:
        with open(file_path, 'rb') as f:
            file_data = f.read()
        
        # For now, return base64 (you can replace this with S3 upload)
        base64_data = base64.b64encode(file_data).decode('utf-8')
        
        # Get file extension
        ext = os.path.splitext(file_path)[1]
        mime_type = 'image/jpeg' if ext in ['.jpg', '.jpeg'] else 'image/png' if ext == '.png' else 'video/mp4'
        
        return {
            'type': 'base64',
            'data': base64_data,
            'mime_type': mime_type
        }
    except Exception as e:
        logger.error(f"Failed to encode file: {str(e)}")
        return None


def handler(event):
    """
    RunPod handler function
    
    Expected input:
    {
        "input": {
            "source_image_url": "https://...",
            "target_media_url": "https://...",
            "media_type": "image" | "video"
        }
    }
    
    Returns:
    {
        "output": {
            "result_url": "https://..." or base64 data,
            "status": "success" | "error",
            "message": "..."
        }
    }
    """
    try:
        logger.info("Handler started")
        logger.info(f"Event: {event}")
        
        # Get input parameters
        job_input = event.get('input', {})
        source_image_url = job_input.get('source_image_url')
        target_media_url = job_input.get('target_media_url')
        media_type = job_input.get('media_type', 'image')
        
        # Validate input
        if not source_image_url or not target_media_url:
            return {
                'error': 'Missing required parameters: source_image_url and target_media_url'
            }
        
        # Create temp directory
        with tempfile.TemporaryDirectory() as temp_dir:
            # Download source image
            source_ext = '.jpg'
            source_path = os.path.join(temp_dir, f'source{source_ext}')
            if not download_file(source_image_url, source_path):
                return {'error': 'Failed to download source image'}
            
            # Download target media
            target_ext = '.mp4' if media_type == 'video' else '.jpg'
            target_path = os.path.join(temp_dir, f'target{target_ext}')
            if not download_file(target_media_url, target_path):
                return {'error': 'Failed to download target media'}
            
            # Prepare output path
            output_ext = '.mp4' if media_type == 'video' else '.jpg'
            output_path = os.path.join(temp_dir, f'output{output_ext}')
            
            # Get swapper instance
            swapper = get_swapper()
            
            # Perform face swap
            if media_type == 'video':
                logger.info("Processing video face swap")
                result = swapper.swap_face_in_video(source_path, target_path, output_path, max_duration=30)
            else:
                logger.info("Processing image face swap")
                result = swapper.swap_face_in_image(source_path, target_path, output_path)
            
            if result is None:
                return {
                    'error': 'Face swap failed. Please ensure both images contain clear, visible faces.'
                }
            
            # Upload result (or convert to base64)
            output_data = upload_to_s3_or_base64(output_path)
            if output_data is None:
                return {'error': 'Failed to process output file'}
            
            logger.info("Handler completed successfully")
            
            return {
                'status': 'success',
                'output': output_data,
                'message': 'Face swap completed successfully'
            }
    
    except Exception as e:
        logger.error(f"Handler error: {str(e)}")
        return {
            'error': f'Internal error: {str(e)}'
        }


if __name__ == "__main__":
    logger.info("Starting RunPod Serverless Worker...")
    runpod.serverless.start({"handler": handler})
