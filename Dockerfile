FROM python:3.10-slim

# Install system dependencies
RUN apt-get update && apt-get install -y \
    ffmpeg \
    wget \
    tar \
    && rm -rf /var/lib/apt/lists/*

# Install Piper TTS (Linux version)
WORKDIR /tmp
RUN wget -O piper.tar.gz https://github.com/rhasspy/piper/releases/download/v1.2.0/piper_amd64.tar.gz && \
    tar -xvf piper.tar.gz && \
    mv piper /app/piper && \
    rm piper.tar.gz

# Download a Piper voice (En Lessac Medium)
WORKDIR /app/piper
RUN wget -O en_US-lessac-medium.onnx https://huggingface.co/rhasspy/piper-voices/resolve/main/en/en_US/lessac/medium/en_US-lessac-medium.onnx && \
    wget -O en_US-lessac-medium.onnx.json https://huggingface.co/rhasspy/piper-voices/resolve/main/en/en_US/lessac/medium/en_US-lessac-medium.onnx.json

WORKDIR /app

# Copy requirements and install
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Expose port
EXPOSE 8001

# Run the server
CMD ["python", "agent_server.py"]
