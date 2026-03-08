# MindMate AI

A modern Next.js 14+ web application with AI-powered chat capabilities, built with the App Router architecture.

## Features

- **Authentication**: NextAuth.js with Google, GitHub, and Credentials providers
- **AI Chat**: Interactive chat interface with AI-powered responses
- **Modern UI**: Built with shadcn/ui components and Tailwind CSS
- **State Management**: Zustand for global state management
- **Type Safety**: Full TypeScript support
- **Responsive Design**: Mobile-first responsive design

## Tech Stack

- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui + Radix UI
- **Authentication**: NextAuth.js
- **State Management**: Zustand
- **Icons**: Lucide React
- **HTTP Client**: Axios

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd mindmate-ai
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
```

4. Update `.env.local` with your credentials:
- `NEXTAUTH_SECRET`: Generate with `openssl rand -base64 32`
- `NEXTAUTH_URL`: Your app URL (http://localhost:3000 for development)
- OAuth credentials from Google and GitHub

5. Run the development server:
```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   │   ├── auth/          # NextAuth.js configuration
│   │   ├── ai/            # AI-related API routes
│   │   ├── chat/          # Chat API routes
│   │   └── user/          # User API routes
│   ├── (pages)/           # Application pages
│   ├── layout.tsx         # Root layout
│   ├── page.tsx           # Home page
│   ├── loading.tsx        # Loading UI
│   ├── error.tsx          # Error UI
│   └── not-found.tsx      # 404 page
├── components/            # React components
│   ├── ui/               # shadcn/ui components
│   ├── chat/             # Chat components
│   ├── dashboard/        # Dashboard components
│   ├── profile/          # Profile components
│   ├── settings/         # Settings components
│   └── providers/        # Context providers
├── lib/                  # Utility functions
│   ├── auth/            # Auth configuration
│   └── utils.ts         # Helper functions
├── stores/              # Zustand stores
│   ├── auth-store.ts
│   ├── chat-store.ts
│   └── ui-store.ts
├── types/               # TypeScript types
├── hooks/               # Custom React hooks
├── public/              # Static assets
└── middleware.ts        # Next.js middleware
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript type checking

## Authentication

The app uses NextAuth.js with the following providers:
- Google OAuth
- GitHub OAuth
- Credentials (email/password)

Protected routes are handled by the middleware in `middleware.ts`.

## API Routes

### Chat
- `GET /api/chat` - Get all chats
- `POST /api/chat` - Create new chat
- `GET /api/chat/[id]` - Get specific chat
- `PATCH /api/chat/[id]` - Update chat
- `DELETE /api/chat/[id]` - Delete chat
- `GET /api/chat/[id]/messages` - Get chat messages
- `POST /api/chat/[id]/messages` - Add message

### AI
- `POST /api/ai/chat` - Send message to AI

### User
- `GET /api/user/profile` - Get user profile
- `PATCH /api/user/profile` - Update profile
- `GET /api/user/settings` - Get user settings
- `PATCH /api/user/settings` - Update settings

## State Management

Zustand stores are used for:
- **Auth Store**: User authentication state and settings
- **Chat Store**: Chat history and current conversation
- **UI Store**: UI state (sidebar, modals, toasts)

## Customization

### Adding New shadcn/ui Components

```bash
npx shadcn-ui@latest add <component-name>
```

### Theming

Update `tailwind.config.ts` and `app/globals.css` to customize the theme.

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy

### Other Platforms

Build the application:
```bash
npm run build
```

The output will be in the `.next` directory.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

MIT License - see LICENSE file for details.

## Support

For support, email support@mindmate.ai or open an issue on GitHub.
