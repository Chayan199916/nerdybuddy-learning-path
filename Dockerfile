FROM python:3.9

# Install necessary tools
RUN apt-get update && apt-get install -y \
    build-essential \
    curl \
    git \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
RUN pip install pytest

WORKDIR /app

CMD ["/bin/bash"]