# Use the official Python image.
# https://hub.docker.com/_/python
FROM python:3.11

# Allow statements and log messages to immediately appear in the Cloud Run logs
ENV PYTHONUNBUFFERED True

# Copy application dependency manifests to the container image.
# Copying this separately prevents re-running pip install on every code change.
COPY requirements.txt ./

# Install production dependencies.
RUN pip install -r requirements.txt


RUN set -ex; \
  apt-get -y update; \
  apt-get --yes install libsndfile1; \
  rm -rf /var/lib/apt/lists/*
# [END run_imageproc_dockerfile_imagemagick]
# [END cloudrun_imageproc_dockerfile_imagemagick]

# Copy local code to the container image.
ENV APP_HOME /app
WORKDIR $APP_HOME
COPY . ./

# Set a default value for PORT
ENV PORT 8080

# Run the web service on container startup.
# Use gunicorn webserver with one worker process and 8 threads.
# For environments with multiple CPU cores, increase the number of workers
# to be equal to the cores available.
# Timeout is set to 0 to disable the timeouts of the workers to allow Cloud Run to handle instance scaling.
CMD exec gunicorn --bind :$PORT --workers 1 --threads 8 --timeout 0 main:app