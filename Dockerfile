FROM python:3.10-slim

# Install system dependencies
# Install system dependencies (Minimal, avoiding recommended bloat like X11)
RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg \
    curl \
    tar \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Install Piper TTS (Linux version)
WORKDIR /tmp
RUN curl -L -o piper.tar.gz https://github.com/rhasspy/piper/releases/download/2023.11.14-2/piper_linux_x86_64.tar.gz
RUN tar -xvf piper.tar.gz
RUN mkdir -p /app/piper && cp -r piper/* /app/piper/ && rm -rf piper piper.tar.gz

# Download a Piper voice (En Lessac Medium)
WORKDIR /app/piper
RUN curl -L -o en_US-lessac-medium.onnx https://huggingface.co/rhasspy/piper-voices/resolve/main/en/en_US/lessac/medium/en_US-lessac-medium.onnx && \
    curl -L -o en_US-lessac-medium.onnx.json https://huggingface.co/rhasspy/piper-voices/resolve/main/en/en_US/lessac/medium/en_US-lessac-medium.onnx.json

WORKDIR /app

# Copy requirements and install
COPY requirements.txt .

# Install CPU-only PyTorch (Separate layer to save space/cache)
RUN pip install --no-cache-dir torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cpu

# Install Whisper (Separate layer)
RUN pip install --no-cache-dir openai-whisper --extra-index-url https://pypi.org/simple

RUN pip install --no-cache-dir -r requirements.txt

# Pre-cache Whisper model (Disabled to save build space on Free Tier)
# RUN python -c "import whisper; whisper.load_model('base')"

# Copy application code
COPY . .

# Expose port
EXPOSE 8001

# Run the server
CMD ["python", "agent_server.py"]
