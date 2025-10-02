# Later App — Tech Stack

## Frontend
- **Expo (React Native + TypeScript)** → primary app framework
- **EAS Build & Updates** → app builds, OTA updates
- **Navigation** → React Navigation + Expo Linking (for deep linking)
- **Data Flow & State**  
  - Zustand → state management  
  - React Query → server state  
  - React Hook Form → form state
- **UI, Styling & Interactivity**  
  - NativeWind (Tailwind for RN) for styling  
  - Expo Vector Icons for icons  
  - Expo Haptics for feedback  
  - Expo Reanimated + Gesture Handler for smooth interactions  

## Backend
- **Supabase (Postgres + Auth + Storage + Edge Functions)** → primary backend  
- **Vercel (Serverless Functions + Hosting)** → API endpoints & web app deploy  
- **OpenAI API** → LLM summaries, categorization, smart suggestions  

## Data Storage
- Supabase Postgres (core DB)  
- Supabase Storage (files, images, documents)  
- Expo SecureStore (local secure storage)  

## Authentication
- Supabase Auth → email/password, magic links, OAuth  
- Expo LocalAuthentication → biometrics  

## Background Jobs
- Supabase cron jobs or Vercel Cron → scheduled tasks  
- No Redis needed (simplify MVP)  

## Media & Camera
- Expo Camera  
- Expo Image & ImageManipulator  

## Networking
- Fetch API (native)  
- GraphQL (optional later, start with REST/Supabase client)  

## CI/CD
- **GitHub** → repo + Actions for testing & linting  
- **Vercel** → deploys triggered by GitHub pushes  
- **Expo EAS** → mobile builds & OTA updates  
- **Sentry** → error monitoring  

## Deployment
- Vercel → frontend + API endpoints  
- Supabase → backend infra (DB/auth/storage)  
- Expo EAS → app store builds + OTA updates  
