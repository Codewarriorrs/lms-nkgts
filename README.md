# LMS-NKGTS

This is a monorepo workspace for the **LMS-NKGTS** (Learning Management System - NKGTS) project. It contains both the frontend (Next.js) and the backend (NestJS).

## Project Structure

- `apps/web`: Next.js frontend with Tailwind CSS and TypeScript.
- `apps/api`: NestJS backend API.

## Requirements

- Node.js (v20+ recommended)
- npm (v10+ recommended)

## Getting Started

1. **Install Dependencies**:
   Run the following command at the root of the project to install all dependencies for both frontend and backend:
   ```bash
   npm install
   ```

2. **Run in Development Mode**:
   To start both Next.js and NestJS development servers concurrently:
   ```bash
   npm run dev
   ```
   - Next.js: [http://localhost:3000](http://localhost:3000)
   - NestJS API: [http://localhost:3001](http://localhost:3001)

3. **Build the Applications**:
   To build both projects for production:
   ```bash
   npm run build
   ```
