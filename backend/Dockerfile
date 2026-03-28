FROM python:3.11-slim

WORKDIR /app

# Install system dependencies for document loaders
RUN apt-get update && apt-get install -y --no-install-recommends \
    libmagic1 \
    poppler-utils \
    tesseract-ocr \
    antiword \
    && rm -rf /var/lib/apt/lists/*

# Install CPU-only PyTorch first — avoids downloading 2.3 GB of CUDA packages
RUN pip install --no-cache-dir torch==2.5.1+cpu --index-url https://download.pytorch.org/whl/cpu

# Install remaining Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY app/ ./app/

# Pre-download the embedding model so the first request doesn't time out
RUN python -c "from sentence_transformers import SentenceTransformer; SentenceTransformer('all-MiniLM-L6-v2')"

# Create directories for persistent data
RUN mkdir -p chroma_db uploads

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
