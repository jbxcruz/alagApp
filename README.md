# 🏥 AlagApp

**Your AI-Powered Personal Health Companion**

AlagApp helps you track, understand, and improve your wellness with AI-powered insights from Google Gemini.

## ✨ Features

### 📊 Health Tracking
- Track vitals: blood pressure, heart rate, sleep, weight, glucose, oxygen, temperature
- Beautiful visualizations and progress charts
- Historical data trends

### 💊 Medication Management
- Add and manage medications
- Track adherence with visual progress
- Daily medication schedule

### 🥗 Nutrition Logging
- Log meals with calorie and macro tracking
- Daily intake summaries
- Meal categorization (breakfast, lunch, dinner, snacks)

### 😊 Daily Check-ins
- Quick mood and energy tracking
- Symptom logging
- Notes for context

### 🤖 AI Health Assistant
- Chat interface powered by Google Gemini
- Personalized health insights
- Answer wellness questions

### 📈 Progress Analytics
- Weekly/monthly trend charts
- Health score tracking
- Visual statistics

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm

### Installation

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🛠️ Tech Stack

| Category | Technology |
|----------|------------|
| Framework | Next.js 14 (App Router) |
| Styling | Tailwind CSS |
| UI Components | Custom components |
| State | Zustand |
| Charts | Custom SVG charts |
| Animations | Framer Motion |
| Icons | Lucide React |
| AI | Google Gemini API |
| Database | Supabase (ready) |

## 📁 Project Structure

```
src/
├── app/                    # Next.js pages
│   ├── dashboard/          # Main dashboard
│   ├── vitals/             # Vitals tracking
│   ├── medications/        # Medication management
│   ├── nutrition/          # Nutrition logging
│   ├── check-in/           # Daily check-ins
│   ├── ai-assistant/       # AI chat
│   ├── progress/           # Analytics
│   ├── settings/           # User settings
│   ├── login/              # Auth
│   └── register/           # Auth
├── components/
│   ├── ui/                 # Button, Card, Input, etc.
│   ├── layout/             # Sidebar, Navbar, Shell
│   └── dashboard/          # Dashboard widgets
├── lib/                    # Utilities
├── types/                  # TypeScript types
└── config/                 # App configuration
```

## 🎨 Design System

- **Primary**: Green (#22C55E) - health & growth
- **Typography**: Outfit (display), JetBrains Mono (numbers)
- **Border Radius**: 12-16px (rounded-xl/2xl)
- **Dark Mode**: Full support

## 🔐 Security Features (Production Ready)

- Supabase Row-Level Security
- Input validation with Zod
- Secure authentication
- HTTPS enforcement
- Data anonymization for AI

## 📱 Responsive Design

Works on:
- 📱 Mobile phones
- 📱 Tablets
- 💻 Desktop

## 🔧 Environment Variables

Create `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
OPENROUTER_API_KEY=your-gemini-api-key
```

## 📄 License

MIT License

---

Made with ❤️ for your health
