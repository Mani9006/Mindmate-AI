# MindMate AI - React Native Mobile App

A comprehensive mental wellness mobile application built with React Native and Expo.

## Features

- **AI-Powered Sessions**: Chat, voice, and video sessions with AI companion
- **Mood Tracking**: Track and visualize your mood over time
- **Session History**: Review past sessions and insights
- **Push Notifications**: Stay updated with reminders and notifications
- **User Profiles**: Manage your account and preferences
- **Dark/Light Theme**: Support for system, light, and dark themes
- **Secure Authentication**: JWT-based auth with token refresh

## Tech Stack

- **Framework**: React Native with Expo
- **Navigation**: React Navigation v6
- **State Management**: Zustand
- **API Client**: Axios with interceptors
- **Push Notifications**: Expo Notifications
- **Camera/Mic**: Expo Camera & Audio
- **Storage**: AsyncStorage + SecureStore

## Project Structure

```
src/
├── components/       # Reusable UI components
├── constants/        # App constants (colors, config, etc.)
├── hooks/           # Custom React hooks
├── navigation/      # Navigation configuration
├── screens/         # Screen components
│   ├── auth/       # Auth flow screens
│   ├── main/       # Main app screens
│   └── onboarding/ # Onboarding screens
├── services/        # API and external services
├── stores/          # Zustand state stores
├── types/           # TypeScript type definitions
└── utils/           # Utility functions
```

## Getting Started

### Prerequisites

- Node.js 16+
- npm or yarn
- Expo CLI (`npm install -g expo-cli`)
- iOS Simulator (Mac) or Android Emulator

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd mindmate-ai/code/mobile
```

2. Install dependencies:
```bash
npm install
```

3. Create environment file:
```bash
cp .env.example .env
```

4. Update `.env` with your API URL:
```
EXPO_PUBLIC_API_URL=https://api.mindmate.ai/v1
EXPO_PUBLIC_PROJECT_ID=your-expo-project-id
```

5. Start the development server:
```bash
npm start
```

### Running on Device/Simulator

- **iOS**: Press `i` in the terminal or click "Run on iOS simulator" in Expo Dev Tools
- **Android**: Press `a` in the terminal or click "Run on Android device/emulator" in Expo Dev Tools

## Scripts

- `npm start` - Start Expo development server
- `npm run android` - Run on Android
- `npm run ios` - Run on iOS
- `npm run web` - Run on web
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript type checking

## Architecture

### Navigation Flow

```
Splash → Onboarding → Login/Register → Main App
                                    ↓
                              Home/Sessions/Explore/Profile
```

### State Management

- **Auth Store**: Authentication state, user data, tokens
- **User Store**: User profile, preferences, mood history
- **Session Store**: Active and past sessions, messages
- **Notification Store**: Push notifications, settings

### API Integration

The app uses Axios with:
- Request/response interceptors
- Automatic token refresh
- Error handling and retry logic
- Type-safe API calls

## Environment Variables

| Variable | Description |
|----------|-------------|
| `EXPO_PUBLIC_API_URL` | Backend API base URL |
| `EXPO_PUBLIC_PROJECT_ID` | Expo project ID for push notifications |

## Contributing

1. Create a feature branch
2. Make your changes
3. Run linting and type checking
4. Submit a pull request

## License

[Your License Here]
