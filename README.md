# Later App 📚

A context-aware content management platform designed as "calm technology" that helps users capture, organize, and intelligently surface content at contextually appropriate moments.

## 🎯 Project Overview

Later combines AI-powered content processing with privacy-first context detection to create a mindful alternative to traditional productivity tools. The app serves as your intelligent reading companion, helping you save content when you discover it and resurface it when you're ready to engage.

## 🏗️ Architecture

### Frontend
- **Expo (React Native + TypeScript)** - Cross-platform mobile app
- **Zustand** - State management
- **React Query** - Server state management
- **NativeWind** - Tailwind CSS for React Native
- **React Navigation** - Navigation and deep linking

### Backend
- **Supabase** - Postgres database, authentication, storage, real-time
- **Vercel** - Serverless functions and web hosting
- **OpenAI API** - Content processing and AI features

### Design Principles
- **Calm Technology** - Respectful of user attention and time
- **Mobile-First** - Optimized for mobile experience
- **Accessibility** - WCAG AA compliant design
- **Privacy-First** - User-controlled data with strong security

## 📱 Key Features

### Content Capture
- URL sharing from other apps
- Text input and voice notes
- Screenshot and image capture
- Quick capture widget

### Smart Organization
- AI-powered content categorization
- Contextual recommendations
- Tags and collections
- Advanced search capabilities

### Reading Experience
- Optimized typography and spacing
- Progress tracking and notes
- Offline reading support
- Focus-friendly interface

### Context Awareness
- Location-based suggestions
- Calendar integration
- Device context detection
- Time-appropriate content surfacing

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- Expo CLI
- iOS Simulator / Android Emulator

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/later-app.git
   cd later-app
   ```

2. **Install dependencies**
   ```bash
   # Frontend
   cd later-frontend
   npm install

   # Backend
   cd ../later-backend
   npm install
   ```

3. **Environment setup**
   ```bash
   # Copy environment templates
   cp later-frontend/.env.example later-frontend/.env
   cp later-backend/.env.example later-backend/.env

   # Configure your Supabase and OpenAI credentials
   ```

4. **Start development servers**
   ```bash
   # Frontend (from later-frontend/)
   npm start

   # Backend (from later-backend/)
   npm run dev
   ```

## 📂 Project Structure

```
later-app/
├── later-frontend/          # Expo React Native app
│   ├── app/                 # App router screens
│   ├── components/          # Reusable UI components
│   ├── stores/              # Zustand state management
│   ├── constants/           # Design tokens and constants
│   └── utils/               # Helper functions
├── later-backend/           # Supabase functions and API
│   ├── supabase/            # Database schema and migrations
│   ├── functions/           # Edge functions
│   └── api/                 # Vercel serverless functions
├── design-documentation/    # Design system and UX specs
├── project-documentation/   # Technical specifications
└── performance-testing/     # Load testing and benchmarks
```

## 🎨 Design System

The app follows a comprehensive design system built on calm technology principles:

- **Colors**: Soft blues, sage greens, and warm accents
- **Typography**: Inter font family with reading-optimized scales
- **Spacing**: 8px base unit system for consistent rhythm
- **Components**: Accessible, touch-friendly mobile interfaces
- **Animations**: Gentle, purposeful motion that respects user attention

See `design-documentation/` for complete specifications.

## 🧪 Testing

```bash
# Frontend tests
cd later-frontend
npm test

# Backend tests
cd later-backend
npm test

# E2E tests
npm run test:e2e
```

## 📈 Performance

- **App launch**: <3 seconds
- **Content capture**: <5 seconds
- **AI processing**: <30 seconds
- **Offline support**: Full reading capability
- **Target**: 10,000 concurrent users

## 🔒 Privacy & Security

- **Privacy-first design** with user-controlled data retention
- **Row Level Security** (RLS) with Supabase
- **GDPR/CCPA compliance** built-in
- **Local biometric authentication**
- **Encrypted local storage**

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Calm Technology** principles by Amber Case
- **Design inspiration** from reading-focused apps like Instapaper and Pocket
- **Open source community** for the excellent tools and libraries

---

Made with ❤️ for mindful content consumption