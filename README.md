# Tellr 💸

> Track money like you text a friend.

A natural language expense tracker powered by Claude AI. Type expenses exactly how you'd text a friend — Tellr parses them instantly and organizes everything in a beautiful dashboard.

## Features

- **No forms, no dropdowns** — just a single text input
- **AI-powered parsing** — Claude extracts amount, category, vendor, and date
- **Real-time dashboard** — expenses appear instantly with live Firestore sync
- **Beautiful dark UI** — glassmorphism cards, smooth animations, futuristic design
- **Smart categorization** — 14 categories auto-detected
- **Visual insights** — spending by category + daily spending charts
- **Month filtering** — browse past expenses by month

## Tech Stack

- **Frontend**: React 18 + Vite + TailwindCSS + Framer Motion
- **Backend/Auth/DB**: Firebase (Google Sign-In + Firestore)
- **AI**: Anthropic Claude API (`claude-sonnet-4-6`)
- **Charts**: Recharts
- **Icons**: Lucide React

## Quick Start

### 1. Clone and install

```bash
git clone <repo-url>
cd tellr
npm install
```

### 2. Set up Firebase

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project
3. Enable **Authentication** → Sign-in method → **Google**
4. Create a **Firestore Database** (start in production mode)
5. Add Firestore security rules:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

6. Go to Project Settings → Your Apps → Add a Web App
7. Copy the Firebase config values

### 3. Get an Anthropic API Key

1. Go to [console.anthropic.com](https://console.anthropic.com/)
2. Create an API key
3. Copy it

### 4. Configure environment variables

```bash
cp .env.example .env
```

Fill in your `.env` file with:

- `VITE_ANTHROPIC_API_KEY` — your Anthropic API key
- All `VITE_FIREBASE_*` values from your Firebase config

### 5. Run the app

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

## Usage Examples

Just type in plain English:

```
Spent 12 bucks on a burrito at Chipotle
Paid 1200 for rent
Netflix subscription 15.99
Uber to airport 45 dollars
Got coffee for 6.50 at Starbucks
Groceries at Whole Foods 89.50
Doctor visit copay 30
```

## Security Note

> ⚠️ **Development Use**: This app calls the Anthropic API directly from the browser using `dangerouslyAllowBrowser: true`. Your API key is exposed in the client bundle. For production, proxy the Claude API calls through a backend (Firebase Cloud Function, etc.).

## Project Structure

```
src/
├── components/
│   ├── LandingPage.jsx     # Hero page with demo animation
│   ├── Dashboard.jsx       # Main dashboard layout
│   ├── MagicInput.jsx      # The AI-powered text input
│   ├── SummaryCards.jsx    # 4 metric cards
│   ├── ExpenseTable.jsx    # Sortable expense list
│   ├── Charts.jsx          # Category + daily charts
│   ├── Navbar.jsx          # Top navigation bar
│   └── ProtectedRoute.jsx  # Auth guard
├── config/
│   └── firebase.js         # Firebase initialization
├── services/
│   ├── claudeService.js    # Claude API integration
│   └── expenseService.js   # Firestore CRUD operations
├── hooks/
│   ├── useAuth.js          # Authentication state
│   └── useExpenses.js      # Real-time expenses listener
├── App.jsx                 # Router setup
├── main.jsx                # React entry point
└── index.css               # Global styles + Tailwind
```

## License

MIT
