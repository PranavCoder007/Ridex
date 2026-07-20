<p align="center">
  <img src="https://img.shields.io/badge/RideEx-Find%20Your%20Perfect%20Ride-ff4d00?style=for-the-badge&logo=data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJ3aGl0ZSI+PHBhdGggZD0iTTE5IDEzYy0yLjIgMC00IDEuOC00IDRIM2MwLTIuMi0xLjgtNC00LTRzLTQgMS44LTQgNCAyIDQgNCA0IDQtMS44IDQtNHptMC02YzEuMSAwIDItLjkgMi0ycy0uOS0yLTItMi0yIC45LTIgMiAuOSAyIDIgMnptLTcgMGMxLjEgMCAyLS45IDItMnMtLjktMi0yLTItMiAuOS0yIDIgLjkgMiAyIDJ6Ii8+PC9zdmc+" alt="RideEx Badge"/>
</p>

<h1 align="center">🏍️ RideEx — Find Your Perfect Ride</h1>

<p align="center">
  <strong>A full-stack motorcycle & scooter discovery platform with 733+ bikes, intelligent matching, and a cloud-powered database.</strong>
</p>

<p align="center">
  <a href="https://ridex-wine.vercel.app/">🌐 Live Demo</a> •
  <a href="#features">✨ Features</a> •
  <a href="#tech-stack">🛠️ Tech Stack</a> •
  <a href="#getting-started">🚀 Getting Started</a> •
  <a href="#api-reference">📡 API Reference</a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Bikes-733+-ff4d00?style=flat-square" alt="Bikes"/>
  <img src="https://img.shields.io/badge/Brands-57-00b4d8?style=flat-square" alt="Brands"/>
  <img src="https://img.shields.io/badge/Images-615-10b981?style=flat-square" alt="Images"/>
  <img src="https://img.shields.io/badge/Deploy-Vercel-000?style=flat-square&logo=vercel" alt="Vercel"/>
  <img src="https://img.shields.io/badge/Database-MongoDB%20Atlas-47a248?style=flat-square&logo=mongodb" alt="MongoDB"/>
</p>

---

## 🌐 Live Demo

**👉 [https://ridex-wine.vercel.app](https://ridex-wine.vercel.app/)**

---

## ✨ Features

### 🔍 Smart Bike Finder
- **Interactive Builder** — Configure your dream bike step-by-step (budget, engine, riding style, features) and get AI-powered match scores.
- **Advanced Filters** — Filter by price range, category, brand, engine displacement, and more.
- **Real-time Search** — Instant search across 733+ bikes with debounced input.

### 📊 Rich Bike Database
- **733 unique motorcycles & scooters** from **57 brands** (Bajaj, Honda, Royal Enfield, Ducati, BMW, KTM, etc.)
- **615 high-quality bike images** (84% coverage) with intelligent fuzzy matching.
- **Detailed specs** for every bike: engine, power, torque, mileage, brakes, suspension, weight, and more.
- **Feature ratings** — Algorithmically generated scores for mileage, comfort, performance, handling, braking, value, and styling.

### 🏗️ Dual-Mode Architecture
| Mode | How it Works |
|------|-------------|
| **⚡ Serverless (Static)** | Pre-compiled `js/data.js` — works without any backend, even opened as a local file |
| **☁️ Cloud (MongoDB Atlas)** | Express API / Vercel Serverless Functions connected to MongoDB Atlas |

The frontend **automatically detects** which mode to use — if the API is reachable, it loads from MongoDB Atlas; otherwise, it falls back to the static database.

### 🎨 Premium UI/UX
- Dark-themed, glassmorphic design with vibrant orange accents.
- Smooth micro-animations and hover effects.
- Fully responsive across desktop and mobile.
- Detailed bike popup with tabbed specs, reviews, pros/cons, and feature radar.

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | HTML5, CSS3 (Vanilla), JavaScript (ES6+) |
| **Backend** | Node.js, Express.js |
| **Database** | MongoDB Atlas (M0 Free Tier) |
| **Deployment** | Vercel (Serverless Functions + Static Hosting) |
| **Data Pipeline** | Custom CSV parser with column-shift correction & fuzzy image matching |

---

## 📂 Project Structure

```
RideEx/
├── api/                          # Vercel Serverless Functions
│   ├── bikes/
│   │   ├── index.js              # GET /api/bikes (list + filter)
│   │   └── [id].js               # GET /api/bikes/:id (single bike)
│   ├── brands.js                 # GET /api/brands
│   ├── body-types.js             # GET /api/body-types
│   ├── stats.js                  # GET /api/stats
│   └── search/
│       └── [query].js            # GET /api/search/:query
├── css/
│   ├── style.css                 # Main stylesheet
│   └── builder.css               # Bike builder styles
├── js/
│   ├── data.js                   # Compiled static database (733 bikes)
│   ├── results.js                # Search, filter, sort logic
│   ├── popup.js                  # Bike detail modal
│   └── builder.js                # Interactive bike configurator
├── db/
│   ├── connection.js             # MongoDB connection (serverless-cached)
│   ├── models/Bike.js            # Mongoose schema
│   ├── seed.js                   # MongoDB Atlas seeder
│   └── build_json_db.js          # Static data.js generator
├── Sports/                       # Bike images (sports category)
├── Commuter/                     # Bike images (commuter category)
├── Cruiser/                      # Bike images (cruiser category)
├── OffRoad/                      # Bike images (off-road category)
├── Scooter/                      # Bike images (scooter category)
├── index.html                    # Homepage
├── motorcycle.html               # Motorcycles listing
├── scooter.html                  # Scooters listing
├── builder.html                  # Bike configurator
├── results.html                  # Search results
├── server.js                     # Express server (local dev)
├── vercel.json                   # Vercel deployment config
└── package.json
```

---

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v18+)
- [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) account (free M0 tier)

### 1. Clone the Repository
```bash
git clone https://github.com/PranavCoder007/Ridex.git
cd Ridex
npm install
```

### 2. Set Up Environment Variables
Create a `.env` file in the root:
```env
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/rideex?retryWrites=true&w=majority
PORT=3000
```

### 3. Seed the Database
```bash
node db/seed.js
```
This parses all CSV files, applies column-shift correction, matches 615 images via fuzzy matching, and inserts 733 bikes into MongoDB Atlas.

### 4. Run Locally
```bash
node server.js
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 5. Build Static Database (Optional)
To regenerate the serverless `js/data.js` file:
```bash
node db/build_json_db.js
```

---

## 📡 API Reference

All endpoints return JSON with `{ success: true, data: ... }` format.

| Endpoint | Description | Example |
|----------|-------------|---------|
| `GET /api/bikes` | List bikes with filters | `?brand=Honda&min_price=50000&limit=20` |
| `GET /api/bikes/:id` | Get single bike by ID | `/api/bikes/6a5e16...` |
| `GET /api/brands` | All brands with counts | Returns 57 brands |
| `GET /api/body-types` | All categories with counts | commuter, cruiser, sport, etc. |
| `GET /api/stats` | Database statistics | Total bikes, image coverage, price range |
| `GET /api/search/:query` | Smart search | `/api/search/royal enfield` |

### Filter Parameters for `/api/bikes`

| Parameter | Type | Description |
|-----------|------|-------------|
| `brand` | string | Filter by brand name |
| `category` | string | commuter, cruiser, sport, scooter, superbike |
| `min_price` | number | Minimum price (₹) |
| `max_price` | number | Maximum price (₹) |
| `min_cc` | number | Minimum engine displacement |
| `max_cc` | number | Maximum engine displacement |
| `cooling` | string | air, liquid, oil |
| `search` | string | Full-text search across brand, model, tags |
| `sort_by` | string | price, power, mileage, overallRating |
| `sort_order` | string | asc or desc |
| `page` | number | Page number (default: 1) |
| `limit` | number | Results per page (default: 50) |

---

## 🔧 Data Pipeline

The data pipeline handles three inconsistent CSV sources and produces a clean, unified database:

```
Bike_Features.csv ──┐
bike_dataset.csv ───┼──▶ Parser + Shift Correction ──▶ Fuzzy Image Match ──▶ data.js / MongoDB
bikesCleaned.csv ───┘
```

**Key innovations:**
- **Column Shift Correction** — Detects and fixes rows where CSV columns are misaligned (e.g., torque values appearing in the displacement column).
- **Fuzzy Image Matching** — Scans 5 image folders and correlates filenames with bike models using normalized name patterns (84% success rate).
- **Smart Defaults** — Algorithmically generates missing specs based on displacement and category.

---

## 📄 License

This project is licensed under the ISC License.

---

<p align="center">
  Built with ❤️ by <a href="https://github.com/PranavCoder007">Pranav</a>
</p>
