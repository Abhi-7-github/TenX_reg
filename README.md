# Canvas Craft - Event Registration & Hackathon Management Platform

A robust, modern full-stack web application designed to streamline team registrations, payment verification, problem statement selection, and round-by-round grading for events, hackathons, and competitions.

## 🚀 Tech Stack

### Frontend
- **Framework**: React (v19) + Vite
- **Styling**: Tailwind CSS (v4)
- **Routing**: React Router DOM (v7)

### Backend
- **Runtime & Framework**: Node.js + Express.js (v5)
- **Database**: MongoDB Atlas + Mongoose
- **Media Hosting**: Cloudinary (for payment receipt uploads)
- **File Parsing**: Multer (multipart form handling)
- **Exporting**: SheetJS (xlsx) for exporting database collections to Excel format

---

## ✨ Features

### 👥 For Participants
- **Dynamic Landing Page (`/`)**: Features smooth CSS intro animations, a live registration progress bar (showing current vs. maximum team slots), and real-time event status alerts.
- **Team Registration Form (`/home`)**:
  - Allows registering teams of exactly 4 members (1 leader + 3 members).
  - Validation checks for registration numbers, 10-digit phone numbers, sections, years, and branches.
  - Payment details step: inputs transaction ID and uploads payment receipts directly to Cloudinary.
  - Auto-checks for duplicate team names and transaction IDs in real-time.
  - LocalStorage persistence saves form draft state so users don't lose data on page refresh.
- **Team Dashboard Panel (`/team`)**:
  - Login via team name/verification credentials.
  - View real-time status of payment verification (Pending, Verified, or Rejected).
  - Browse and select from a list of available event problem statements once payment status is **Verified**.
  - Restricts selection slots to prevent overflow (max 7 teams per statement).

### 🛠️ For Administrators
- **Admin Configuration & Download (`/download`)**:
  - Access secured via password authentication.
  - **Excel Export**: Single-click export of all registrations and team details to a `.xlsx` spreadsheet.
  - **Registration Control**: Toggle registrations open/closed globally, change maximum team limits, and enable/disable problem selection.
  - **Verification Flow**: Grid list of all submissions, image receipt previews in a modal, and buttons to Verify or Reject payments instantly.
- **Problem Statement Console (`/admin/problems`)**:
  - Create, view, edit, and delete problem statements.
  - Track taken slots per statement and view which teams selected each statement.
  - Toggle problem statement selection visibility globally.
- **Grading & Scoring Board (`/marks`)**:
  - Securely manage event scoring.
  - Create custom assessment rounds (e.g., Round 1, Round 2) with specific maximum scores.
  - Matrix table to assign and update scores for each registered team in real-time.
  - Automatic summation of total team marks for instant leaderboard reference.

---

## 📂 Project Structure

```
form01/
├── backend/                  # Node.js Express server
│   ├── connect.js            # MongoDB connection configuration
│   ├── cloudinary.js         # Multer and Cloudinary storage config
│   ├── model.js              # Mongoose schemas (Teams, AppSettings, Problems, Marks)
│   ├── server.js             # Main server logic and API endpoints
│   └── package.json
├── frontend/                 # React Vite client
│   ├── src/
│   │   ├── assets/           # Video and logo assets
│   │   ├── pages/            # Page components (Home, Team Panel, Marks, Download, AddProblems, Animation)
│   │   ├── App.css           # Global Tailwind and app styles
│   │   ├── App.jsx           # Routing configuration
│   │   ├── index.css
│   │   └── main.jsx
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
└── README.md                 # Workspace documentation
```

---

## 🔑 Environment Variables

To run this project, configure the following environment variables:

### Backend (`/backend/.env`)
```env
PORT=5000
MONGODB_URI=your_mongodb_connection_string
DOWNLOAD_PASSWORD=your_excel_download_password
adminPassword=your_admin_management_password
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
```

### Frontend (`/frontend/.env`)
```env
VITE_BACKEND_URL=http://localhost:5000
```

---

## 🏃 Getting Started

### Prerequisites
Make sure you have Node.js and MongoDB installed/configured.

### 1. Set Up Backend
```bash
cd backend
npm install
npm start
```
The backend server will run by default at `http://localhost:5000`.

### 2. Set Up Frontend
```bash
cd frontend
npm install
npm run dev
```
The frontend client will run by default at `http://localhost:5173`. Open this URL in your browser to view the application.
