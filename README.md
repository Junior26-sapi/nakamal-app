# Nakamal App - Developer Guide & Git Deployment

Welcome to the **Nakamal App** codebase. This project has been fully initialized with Git, styled with custom themes, and optimized for both Web (Vercel/Vite/Express) and Mobile (Capacitor for Android and iOS).

---

## 🚀 Quick Git Deployment Guide

Since this is a remote containerized workspace, pushing to GitHub requires setting your remote origin and configuring your authentication credentials.

### Step 1: Add your Remote Repository URL

To connect your local repository to a remote GitHub repository, run the following command. Replace `<YOUR_GITHUB_URL>` with your actual repository URL:

```bash
git remote add origin <YOUR_GITHUB_URL>
```

> **Tip (Passwordless Push):** If you are pushing from a headless container, you can embed your Personal Access Token (PAT) directly in the URL:
> `git remote add origin https://<YOUR_PERSONAL_ACCESS_TOKEN>@github.com/<USERNAME>/<REPOSITORY_NAME>.git`

### Step 2: Push your Changes

To push your initial commit and all local branches to the remote repository, execute:

```bash
git push -u origin main
```

---

## 🛠️ Project Structure & Architecture

This repository contains several key feature upgrades and structural updates:

1. **Clean Manager Dashboard Architecture**:
   - Decoupled the **Operating Schedule** from the **Venue Information** card.
   - Refactored the layout into a clean multi-column grid with a dedicated side-stack for **Operations History** and **QR Code Distribution Hub**.
   - Added interactive sync and persistence features with feedback loops.

2. **Multimedia B2B Negotiation Desk**:
   - High-fidelity chat interface for supplier-venue agreements.
   - Live location integration, document tracking, and custom feedback metrics.

3. **Multi-Platform Ready**:
   - **Web**: Managed via a combined Express server (`server.ts`) and Vite bundler. Run `npm run dev` to start.
   - **Mobile**: Powered by Capacitor. Ready for native iOS (`/ios`) and Android (`/android`) builds.

---

## 💻 Handy Commands

- **Start Dev Server**: `npm run dev`
- **Build Web Application**: `npm run build`
- **Lint Codebase**: `npm run lint`
- **Capacitor Sync**: `npx cap sync`
