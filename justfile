set shell := ["bash", "-eu", "-o", "pipefail", "-c"]

default:
  @just --list

# Install Node dependencies from package-lock.json.
install:
  npm install

# Start the Vite development server.
dev:
  npm run dev

# Build the web app for production.
build:
  npm run build

# Preview the production build locally.
preview:
  npm run preview

# Build and publish the site to GitHub Pages.
deploy:
  npm run deploy

# Run the OpenAI-backed question processing pipeline.
pipeline:
  : "${OPENAI_API_KEY:?OPENAI_API_KEY must be set}"
  npm run pipeline

# Run the pipeline against the test dataset.
pipeline-test:
  : "${OPENAI_API_KEY:?OPENAI_API_KEY must be set}"
  npm run pipeline:test

# Remove generated build artifacts.
clean:
  rm -rf dist

# Reinstall dependencies from scratch.
reset-node:
  rm -rf node_modules
  npm install
