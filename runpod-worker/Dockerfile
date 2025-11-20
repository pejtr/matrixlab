# RunPod Worker - Face Swap with Inswapper
# Based on: https://github.com/ashleykleynhans/runpod-worker-inswapper

FROM nvidia/cuda:11.8.0-cudnn8-runtime-ubuntu22.04

# Set environment variables
ENV DEBIAN_FRONTEND=noninteractive
ENV PYTHONUNBUFFERED=1
ENV PYTHON_VERSION=3.10

# Install system dependencies
RUN apt-get update && apt-get install -y \
    python${PYTHON_VERSION} \
    python${PYTHON_VERSION}-dev \
    python3-pip \
    git \
    wget \
    ffmpeg \
    libsm6 \
    libxext6 \
    libxrender-dev \
    libgomp1 \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Set Python 3.10 as default
RUN update-alternatives --install /usr/bin/python3 python3 /usr/bin/python${PYTHON_VERSION} 1 \
    && update-alternatives --install /usr/bin/python python /usr/bin/python${PYTHON_VERSION} 1

# Upgrade pip
RUN python3 -m pip install --upgrade pip

# Install Python dependencies
RUN pip3 install --no-cache-dir \
    runpod==1.6.2 \
    opencv-python==4.9.0.80 \
    opencv-python-headless==4.9.0.80 \
    insightface==0.7.3 \
    onnxruntime-gpu==1.16.3 \
    Pillow==10.2.0 \
    numpy==1.26.3 \
    basicsr==1.4.2 \
    facexlib==0.3.0 \
    realesrgan==0.3.0 \
    gfpgan==1.3.8

# Create working directory
WORKDIR /app

# Download inswapper model
RUN mkdir -p /app/models && \
    wget -O /app/models/inswapper_128.onnx \
    https://huggingface.co/deepinsight/inswapper/resolve/main/inswapper_128.onnx

# Download face detection model
RUN mkdir -p /root/.insightface/models/buffalo_l && \
    wget -O /root/.insightface/models/buffalo_l.zip \
    https://github.com/deepinsight/insightface/releases/download/v0.7/buffalo_l.zip && \
    cd /root/.insightface/models && \
    unzip buffalo_l.zip -d buffalo_l && \
    rm buffalo_l.zip

# Copy worker code
COPY handler.py /app/
COPY face_swap.py /app/
COPY requirements.txt /app/

# Install any additional requirements
RUN pip3 install --no-cache-dir -r requirements.txt

# Set the entrypoint
CMD ["python3", "-u", "handler.py"]
