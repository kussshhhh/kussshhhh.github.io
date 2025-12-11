# Blog Setup Guide

This guide walks you through setting up the Google Docs → Blog auto-sync system.

## Overview

- **Write** in a Google Doc (from phone or computer)
- **GitHub Action** runs hourly to fetch new content
- **Blog page** auto-updates with your entries

---

## Step 1: Google Cloud Setup

### 1.1 Create a Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click **Select a project** → **New Project**
3. Name it something like `blog-sync`
4. Click **Create**

### 1.2 Enable Google Docs API

1. Go to **APIs & Services** → **Enable APIs and Services**
2. Search for "Google Docs API"
3. Click **Enable**

### 1.3 Create a Service Account

1. Go to **APIs & Services** → **Credentials**
2. Click **Create Credentials** → **Service Account**
3. Name it `blog-reader`
4. Click **Create and Continue** → **Done**
5. Click on the service account you just created
6. Go to **Keys** tab → **Add Key** → **Create New Key**
7. Choose **JSON** → **Create**
8. Save the downloaded file (keep it safe, you'll need it!)

---

## Step 2: Create Your Blog Document

1. Go to [Google Docs](https://docs.google.com/)
2. Create a new document (name it "Blog" or whatever you like)
3. **Share it** with your service account:
   - Click **Share** button
   - Paste the service account email (looks like `blog-reader@project-name.iam.gserviceaccount.com`)
   - Give it **Viewer** access
   - Click **Share**

### Document Format

Write your entries like this:

```
## Dec 11, 2024
Today I worked on something cool...

Here's an image:
[paste your image directly into the doc]

More thoughts here.

## Dec 10, 2024
Yesterday was productive!
```

Each `## Date` heading starts a new blog entry.

---

## Step 3: Get Your Document ID

Your document URL looks like this:
```
https://docs.google.com/document/d/ABC123XYZ.../edit
                                   ^^^^^^^^^^^
                                   This is your Doc ID
```

Copy the ID part (the long string between `/d/` and `/edit`).

---

## Step 4: Add GitHub Secrets

1. Go to your repo on GitHub: `github.com/kussshhhh/kussshhhh.github.io`
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Add two secrets:

### Secret 1: GOOGLE_CREDENTIALS

1. Open the JSON file you downloaded earlier
2. Go to [Base64 Encode](https://www.base64encode.org/) or run in terminal:
   ```bash
   base64 -i your-credentials-file.json
   ```
3. Copy the entire base64 output
4. In GitHub, click **New repository secret**
   - Name: `GOOGLE_CREDENTIALS`
   - Value: paste the base64 string

### Secret 2: GOOGLE_DOC_ID

1. Click **New repository secret**
   - Name: `GOOGLE_DOC_ID`
   - Value: paste your document ID from Step 3

---

## Step 5: Test It!

1. Go to **Actions** tab in your repo
2. Click **Update Blog** workflow
3. Click **Run workflow** → **Run workflow**
4. Wait for it to complete (should take < 1 min)
5. Check your blog at `kussshhhh.github.io/blog.html`!

---

## How It Works

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│   📱 You write in Google Doc (phone or laptop)          │
│                      ↓                                  │
│   ⏰ GitHub Action runs every hour                      │
│                      ↓                                  │
│   🐍 Python script fetches doc + downloads images       │
│                      ↓                                  │
│   📄 Generates blog_data.json                           │
│                      ↓                                  │
│   🚀 Commits & pushes to repo                           │
│                      ↓                                  │
│   🌐 GitHub Pages auto-deploys                          │
│                      ↓                                  │
│   ✨ Blog is live at kussshhhh.github.io/blog.html      │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## Troubleshooting

### Action fails with "No credentials found"
- Make sure `GOOGLE_CREDENTIALS` secret is set correctly
- Ensure the JSON is base64 encoded

### Action fails with "Document not found"
- Make sure `GOOGLE_DOC_ID` is correct
- Ensure the doc is shared with your service account email

### No entries showing up
- Make sure your doc has `## Date` headers
- Check the Action logs for parsing errors

### Images not downloading
- Images must be pasted directly into the doc (not linked)
- Check if the images folder was created

---

## Manual Trigger

You can manually run the sync anytime:
1. Go to **Actions** → **Update Blog**
2. Click **Run workflow**

Or wait for the hourly automatic run!
