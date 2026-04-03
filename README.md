# Om Cloth Store – Ledger App

**Shop:** Om Cloth Store Peeplu  
**Owners:** Omprakash Vijay, Nishant Vijay

---

## Tech Stack
- **Frontend:** Pure HTML + CSS + Vanilla JS (no React, no build step)
- **Backend:** Node.js + Express
- **Database:** Excel file (`data/ledger.xlsx`) via `xlsx` package
- **Image Storage:** Local disk (`data/uploads/`)
- **Deploy:** Render.com (free tier)

---

## Local Development

```bash
npm install
npm start
# Open http://localhost:3000
```

---

## Deploy on Render.com (FREE, Multi-Device)

### Step 1 – Push to GitHub
1. Create a free account at github.com
2. Create a new repository (e.g. `om-cloth-store`)
3. Upload all these files to the repository

### Step 2 – Deploy on Render
1. Go to render.com → Sign up free
2. Click "New +" → "Web Service"
3. Connect your GitHub repo
4. Settings:
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Environment:** Node
5. Add a **Disk** (IMPORTANT for data persistence):
   - Click "Add Disk"
   - Name: `data`
   - Mount Path: `/opt/render/project/src/data`
   - Size: 1 GB (free)
6. Click "Create Web Service"
7. Your app will be live at `https://om-cloth-store.onrender.com`

### Step 3 – Install on Android
1. Open the app URL in Chrome on your Android phone
2. Tap menu (3 dots) → "Add to Home Screen"
3. App is installed like a native app!

---

## Data Storage

All data is stored in **`data/ledger.xlsx`** with 4 sheets:
- `Sales` — Daily sale entries
- `SupplierBills` — Supplier bill records
- `SupplierPayments` — Payment records
- `Settings` — App preferences

Bill photos are stored in **`data/uploads/`**

You can download the Excel file anytime from the Reports page → "Download Excel Backup"

---

## Features

- Dashboard with today's KPIs
- Daily Sales (Cash + PhonePe split)
- Supplier Bills with photo upload
- Supplier Payments with pending dues tracking
- Reports with date range filter
- WhatsApp message generation (no emojis, professional format)
- Hindi + English language support
- Dark + Light theme
- Works on mobile + desktop
- Multi-device sync via Render server
