# Deployment Guide: PredictionMatrix

This application is built with **Next.js** and **Firebase**. The best place to host it is **Vercel**, as it supports the automated Cron Jobs (for updating predictions) natively.

## Option 1: Vercel (Recommended)
**Best for**: Ease of use, free tier, automated updates.

1.  **Push your code to GitHub**
    *   Create a new repository on GitHub.
    *   Push this code to it:
        ```bash
        git init
        git add .
        git commit -m "Initial commit"
        git branch -M main
        git remote add origin <your-repo-url>
        git push -u origin main
        ```

2.  **Connect to Vercel**
    *   Go to [Vercel.com](https://vercel.com) and sign up.
    *   Click **"Add New" > "Project"**.
    *   Import your GitHub repository.

3.  **Configure Environment Variables**
    *   In the Vercel Project Settings, find "Environment Variables".
    *   Add all the values from your `.env.local` file:
        *   `NEXT_PUBLIC_FIREBASE_API_KEY`
        *   `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
        *   `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
        *   `FIREBASE_CLIENT_EMAIL` (for admin SDK)
        *   `FIREBASE_PRIVATE_KEY` (copy the whole string, including `-----BEGIN...`)

4.  **Deploy**
    *   Click "Deploy". Vercel will build your site.
    *   **Cron Jobs**: Since we have a `vercel.json` file, Vercel will automatically set up the schedules to refresh odds and predictions.

---

## Option 2: Self-Host (VPS / DigitalOcean)
**Best for**: Full control, fixed pricing.

Prerequisites: A Linux server with Node.js 18+ installed.

1.  **Build the Project**
    Run this on your server:
    ```bash
    npm install
    npm run build
    ```

2.  **Start the Server**
    Use a process manager like `pm2` to keep it running:
    ```bash
    npm install -g pm2
    pm2 start npm --name "prediction-matrix" -- start
    ```

3.  **Set up Cron Jobs Manually**
    Since Vercel Crons won't work here, you must set up Linux crontabs to hit your API endpoints:
    *   `0 6 * * 1 curl http://localhost:3000/api/cron/weekly-refresh`
    *   (Repeat for other crons listed in `vercel.json`)

---

## Important Note on Firebase
Go to your **Firebase Console > Authentication > Settings** and add your new domain (e.g., `prediction-matrix.vercel.app`) to the **Authorized Domains** list. Otherwise, login will fail.
