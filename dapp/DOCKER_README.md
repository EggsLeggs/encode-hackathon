# Docker Setup for Concordium DApp

This directory contains Docker configuration files to containerize the Concordium DApp.

## Files Created

- `Dockerfile` - Multi-stage Docker build configuration
- `docker-compose.yaml` - Docker Compose configuration for easy deployment
- `nginx.conf` - Nginx configuration for serving the React app
- `.dockerignore` - Files to exclude from Docker build context

## Quick Start

### Using Docker Compose (Recommended)

1. Build and run the application:
   ```bash
   docker-compose up --build
   ```

2. The application will be available at `http://localhost:3000`

3. To run in detached mode:
   ```bash
   docker-compose up -d --build
   ```

4. To stop the application:
   ```bash
   docker-compose down
   ```

### Using Docker directly

1. Build the Docker image:
   ```bash
   docker build -t concordium-dapp .
   ```

2. Run the container:
   ```bash
   docker run -p 3000:80 concordium-dapp
   ```

## Environment Variables

You can customize the port by setting the `DAPP_PORT` environment variable:

```bash
DAPP_PORT=8080 docker-compose up --build
```

## Features

- **Multi-stage build**: Optimized for production with minimal image size
- **Nginx server**: Efficient static file serving with gzip compression
- **Client-side routing**: Properly configured for React Router
- **Security headers**: Basic security headers included
- **Asset caching**: Static assets are cached for better performance

## Development

For development, it's recommended to use the standard npm commands:

```bash
npm install
npm run dev
```

The Docker setup is primarily intended for production deployment.
