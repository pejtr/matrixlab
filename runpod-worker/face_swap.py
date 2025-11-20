"""
Face Swap Core Logic using Inswapper
Supports both images and videos
"""

import cv2
import insightface
from insightface.app import FaceAnalysis
import numpy as np
from PIL import Image
import os
import tempfile
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class FaceSwapper:
    def __init__(self, model_path="/app/models/inswapper_128.onnx"):
        """Initialize face swapper with inswapper model"""
        logger.info("Initializing FaceSwapper...")
        
        # Initialize face analysis
        self.app = FaceAnalysis(name='buffalo_l')
        self.app.prepare(ctx_id=0, det_size=(640, 640))
        
        # Load face swapper model
        self.swapper = insightface.model_zoo.get_model(model_path, download=False, download_zip=False)
        
        logger.info("FaceSwapper initialized successfully")
    
    def swap_face_in_image(self, source_image_path, target_image_path, output_path):
        """
        Swap face from source image to target image
        
        Args:
            source_image_path: Path to source face image
            target_image_path: Path to target image
            output_path: Path to save output image
            
        Returns:
            output_path if successful, None otherwise
        """
        try:
            logger.info(f"Processing image swap: {source_image_path} -> {target_image_path}")
            
            # Read images
            source_img = cv2.imread(source_image_path)
            target_img = cv2.imread(target_image_path)
            
            if source_img is None or target_img is None:
                logger.error("Failed to read images")
                return None
            
            # Detect faces in source image
            source_faces = self.app.get(source_img)
            if len(source_faces) == 0:
                logger.error("No face detected in source image")
                return None
            
            source_face = source_faces[0]
            logger.info(f"Detected {len(source_faces)} face(s) in source image")
            
            # Detect faces in target image
            target_faces = self.app.get(target_img)
            if len(target_faces) == 0:
                logger.error("No face detected in target image")
                return None
            
            logger.info(f"Detected {len(target_faces)} face(s) in target image")
            
            # Swap each face in target image
            result_img = target_img.copy()
            for target_face in target_faces:
                result_img = self.swapper.get(result_img, target_face, source_face, paste_back=True)
            
            # Save result
            cv2.imwrite(output_path, result_img)
            logger.info(f"Image swap completed: {output_path}")
            
            return output_path
            
        except Exception as e:
            logger.error(f"Error in swap_face_in_image: {str(e)}")
            return None
    
    def swap_face_in_video(self, source_image_path, target_video_path, output_path, max_duration=30):
        """
        Swap face from source image to target video
        
        Args:
            source_image_path: Path to source face image
            target_video_path: Path to target video
            output_path: Path to save output video
            max_duration: Maximum video duration in seconds (default: 30)
            
        Returns:
            output_path if successful, None otherwise
        """
        try:
            logger.info(f"Processing video swap: {source_image_path} -> {target_video_path}")
            
            # Read source image
            source_img = cv2.imread(source_image_path)
            if source_img is None:
                logger.error("Failed to read source image")
                return None
            
            # Detect face in source image
            source_faces = self.app.get(source_img)
            if len(source_faces) == 0:
                logger.error("No face detected in source image")
                return None
            
            source_face = source_faces[0]
            logger.info(f"Detected face in source image")
            
            # Open video
            cap = cv2.VideoCapture(target_video_path)
            if not cap.isOpened():
                logger.error("Failed to open video")
                return None
            
            # Get video properties
            fps = int(cap.get(cv2.CAP_PROP_FPS))
            width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
            height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
            total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
            duration = total_frames / fps
            
            logger.info(f"Video properties: {width}x{height} @ {fps}fps, duration: {duration:.2f}s")
            
            # Check duration limit
            if duration > max_duration:
                logger.error(f"Video duration ({duration:.2f}s) exceeds maximum ({max_duration}s)")
                cap.release()
                return None
            
            # Prepare video writer
            fourcc = cv2.VideoWriter_fourcc(*'mp4v')
            out = cv2.VideoWriter(output_path, fourcc, fps, (width, height))
            
            # Process each frame
            frame_count = 0
            while True:
                ret, frame = cap.read()
                if not ret:
                    break
                
                frame_count += 1
                if frame_count % 30 == 0:
                    logger.info(f"Processing frame {frame_count}/{total_frames}")
                
                # Detect faces in frame
                target_faces = self.app.get(frame)
                
                # Swap faces if detected
                if len(target_faces) > 0:
                    result_frame = frame.copy()
                    for target_face in target_faces:
                        result_frame = self.swapper.get(result_frame, target_face, source_face, paste_back=True)
                    out.write(result_frame)
                else:
                    # No face detected, write original frame
                    out.write(frame)
            
            # Cleanup
            cap.release()
            out.release()
            
            logger.info(f"Video swap completed: {output_path}, processed {frame_count} frames")
            
            return output_path
            
        except Exception as e:
            logger.error(f"Error in swap_face_in_video: {str(e)}")
            return None


# Global instance
_swapper = None

def get_swapper():
    """Get or create global FaceSwapper instance"""
    global _swapper
    if _swapper is None:
        _swapper = FaceSwapper()
    return _swapper
