# MindMate AI - Monorepo Project Structure

## Overview

This document defines the complete folder structure and configuration for the MindMate AI monorepo. The project uses a modern microservices architecture with shared packages for maximum code reuse.

---

## Root Directory Structure

```
mindmate-ai/
├── .github/                    # GitHub Actions, workflows, templates
├── .husky/                     # Git hooks
├── apps/                       # Application packages
│   ├── mobile/                 # React Native mobile app
│   ├── web/                    # Next.js web app
│   └── admin/                  # Next.js admin dashboard
├── services/                   # Backend microservices
│   ├── api/                    # Main API gateway (Node.js)
│   ├── ai-pipeline/            # AI/ML pipeline service (Python)
│   └── scheduler/              # Job scheduler service (Node.js)
├── packages/                   # Shared packages
│   ├── shared/                 # Shared types, utils, constants
│   ├── ui/                     # Shared UI components
│   ├── config/                 # Shared configuration
│   └── eslint-config/          # Shared ESLint configuration
├── infrastructure/             # Infrastructure as Code
│   ├── terraform/              # Terraform modules
│   ├── kubernetes/             # K8s manifests
│   └── docker/                 # Docker configurations
├── docs/                       # Documentation
├── scripts/                    # Build and utility scripts
├── .editorconfig               # Editor configuration
├── .gitignore                  # Root gitignore
├── .npmrc                      # NPM configuration
├── package.json                # Root package.json
├── pnpm-workspace.yaml         # PNPM workspace configuration
├── pnpm-lock.yaml              # PNPM lock file
├── turbo.json                  # Turborepo configuration
└── README.md                   # Project README
```

---

## Root Configuration Files

### `package.json` (Root)

```json
{
  "name": "mindmate-ai",
  "version": "1.0.0",
  "private": true,
  "description": "MindMate AI - Mental Health Companion Platform",
  "author": "MindMate AI Team",
  "license": "MIT",
  "scripts": {
    "build": "turbo run build",
    "dev": "turbo run dev --parallel",
    "lint": "turbo run lint",
    "lint:fix": "turbo run lint:fix",
    "format": "prettier --write \"**/*.{ts,tsx,js,jsx,json,md}\"",
    "format:check": "prettier --check \"**/*.{ts,tsx,js,jsx,json,md}\"",
    "type-check": "turbo run type-check",
    "test": "turbo run test",
    "test:e2e": "turbo run test:e2e",
    "clean": "turbo run clean && rm -rf node_modules",
    "changeset": "changeset",
    "version-packages": "changeset version",
    "release": "turbo run build --filter=docs^... && changeset publish",
    "prepare": "husky install",
    "docker:build": "docker-compose -f infrastructure/docker/docker-compose.yml build",
    "docker:up": "docker-compose -f infrastructure/docker/docker-compose.yml up -d",
    "docker:down": "docker-compose -f infrastructure/docker/docker-compose.yml down"
  },
  "devDependencies": {
    "@changesets/cli": "^2.27.1",
    "@mindmate/eslint-config": "workspace:*",
    "husky": "^9.0.11",
    "lint-staged": "^15.2.2",
    "prettier": "^3.2.5",
    "turbo": "^1.13.3"
  },
  "packageManager": "pnpm@8.15.6",
  "engines": {
    "node": ">=18.0.0",
    "pnpm": ">=8.0.0"
  },
  "lint-staged": {
    "*.{ts,tsx,js,jsx}": [
      "eslint --fix",
      "prettier --write"
    ],
    "*.{json,md}": [
      "prettier --write"
    ]
  }
}
```

### `pnpm-workspace.yaml`

```yaml
packages:
  - "apps/*"
  - "services/*"
  - "packages/*"
  - "infrastructure/*"
```

### `turbo.json`

```json
{
  "$schema": "https://turbo.build/schema.json",
  "globalDependencies": ["**/.env.*local"],
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": [".next/**", "!.next/cache/**", "dist/**", "build/**", "expo-router/**"]
    },
    "lint": {
      "dependsOn": ["^build"]
    },
    "lint:fix": {
      "cache": false
    },
    "type-check": {
      "dependsOn": ["^build"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "test": {
      "dependsOn": ["^build"]
    },
    "test:e2e": {
      "dependsOn": ["^build"],
      "env": ["CI"]
    },
    "clean": {
      "cache": false
    }
  }
}
```

### `.editorconfig`

```ini
root = true

[*]
charset = utf-8
end_of_line = lf
indent_style = space
indent_size = 2
insert_final_newline = true
trim_trailing_whitespace = true

[*.md]
trim_trailing_whitespace = false

[*.{py,pyi}]
indent_size = 4

[Makefile]
indent_style = tab
```

### `.gitignore` (Root)

```gitignore
# Dependencies
node_modules/
.pnp
.pnp.js

# Build outputs
dist/
build/
.next/
out/
*.tsbuildinfo

# Environment variables
.env
.env.local
.env.*.local

# Testing
coverage/
.nyc_output/

# IDE
.idea/
.vscode/
*.swp
*.swo
*~

# OS
.DS_Store
Thumbs.db

# Logs
logs/
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*
pnpm-debug.log*

# Cache
.cache/
.parcel-cache/
.eslintcache
.stylelintcache

# Misc
*.pem
.vercel
.netlify

# Mobile
apps/mobile/ios/Pods/
apps/mobile/android/.gradle/
apps/mobile/android/app/build/
apps/mobile/android/build/

# Python
__pycache__/
*.py[cod]
*$py.class
*.so
.Python
env/
venv/
.venv/
*.egg-info/
dist/
build/
.pytest_cache/
.mypy_cache/

# Terraform
*.tfstate
*.tfstate.*
.terraform/
.terraform.lock.hcl
terraform.tfvars

# Docker
.docker/

# Turbo
.turbo/
```

### `.npmrc`

```ini
engine-strict=true
auto-install-peers=true
strict-peer-dependencies=false
shamefully-hoist=true
```

### `.prettierrc` (Root)

```json
{
  "semi": true,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "es5",
  "printWidth": 100,
  "bracketSpacing": true,
  "arrowParens": "avoid",
  "endOfLine": "lf",
  "plugins": ["prettier-plugin-tailwindcss"]
}
```

---

## Apps

### 1. Mobile App (React Native)

**Location:** `apps/mobile/`

```
apps/mobile/
├── android/                    # Android native code
├── ios/                        # iOS native code
├── src/
│   ├── api/                    # API clients
│   ├── assets/                 # Images, fonts, videos
│   │   ├── fonts/
│   │   ├── images/
│   │   └── animations/
│   ├── components/             # React components
│   │   ├── common/             # Shared components
│   │   ├── forms/              # Form components
│   │   └── navigation/         # Navigation components
│   ├── config/                 # App configuration
│   ├── constants/              # Constants
│   ├── context/                # React contexts
│   ├── hooks/                  # Custom hooks
│   ├── navigation/             # Navigation setup
│   │   ├── AppNavigator.tsx
│   │   ├── AuthNavigator.tsx
│   │   └── MainNavigator.tsx
│   ├── screens/                # Screen components
│   │   ├── auth/
│   │   ├── chat/
│   │   ├── home/
│   │   ├── journal/
│   │   ├── meditation/
│   │   ├── profile/
│   │   └── settings/
│   ├── services/               # Business logic services
│   ├── store/                  # State management (Zustand)
│   ├── theme/                  # Theme configuration
│   ├── types/                  # TypeScript types
│   ├── utils/                  # Utility functions
│   └── App.tsx                 # App entry point
├── .env.example
├── .eslintrc.js
├── .prettierrc
├── app.json                    # Expo configuration
├── babel.config.js
├── eas.json                    # EAS Build configuration
├── index.js
├── jest.config.js
├── metro.config.js
├── package.json
├── tsconfig.json
└── README.md
```

#### `apps/mobile/package.json`

```json
{
  "name": "@mindmate/mobile",
  "version": "1.0.0",
  "private": true,
  "main": "index.js",
  "scripts": {
    "start": "expo start",
    "android": "expo run:android",
    "ios": "expo run:ios",
    "web": "expo start --web",
    "build:android": "eas build --platform android",
    "build:ios": "eas build --platform ios",
    "build:android:local": "eas build --platform android --local",
    "build:ios:local": "eas build --platform ios --local",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "lint": "eslint . --ext .ts,.tsx",
    "lint:fix": "eslint . --ext .ts,.tsx --fix",
    "type-check": "tsc --noEmit",
    "clean": "rm -rf node_modules .expo ios/Pods android/.gradle"
  },
  "dependencies": {
    "@mindmate/shared": "workspace:*",
    "@react-native-async-storage/async-storage": "^1.23.1",
    "@react-native-community/netinfo": "^11.3.1",
    "@react-navigation/bottom-tabs": "^6.5.20",
    "@react-navigation/native": "^6.1.17",
    "@react-navigation/native-stack": "^6.9.26",
    "@tanstack/react-query": "^5.32.1",
    "axios": "^1.6.8",
    "date-fns": "^3.6.0",
    "expo": "~50.0.17",
    "expo-av": "~13.10.6",
    "expo-device": "~5.9.4",
    "expo-file-system": "~16.0.9",
    "expo-font": "~11.10.3",
    "expo-haptics": "~12.8.1",
    "expo-image": "~1.10.6",
    "expo-linear-gradient": "~12.7.2",
    "expo-localization": "~14.8.4",
    "expo-notifications": "~0.27.7",
    "expo-secure-store": "~12.8.1",
    "expo-splash-screen": "~0.26.5",
    "expo-status-bar": "~1.11.1",
    "expo-updates": "~0.24.12",
    "i18next": "^23.11.3",
    "react": "18.2.0",
    "react-i18next": "^14.1.1",
    "react-native": "0.73.6",
    "react-native-gesture-handler": "~2.14.1",
    "react-native-reanimated": "~3.6.3",
    "react-native-safe-area-context": "4.8.2",
    "react-native-screens": "~3.29.0",
    "react-native-svg": "14.1.0",
    "socket.io-client": "^4.7.5",
    "zod": "^3.23.4",
    "zustand": "^4.5.2"
  },
  "devDependencies": {
    "@babel/core": "^7.24.4",
    "@testing-library/jest-native": "^5.4.3",
    "@testing-library/react-native": "^12.4.5",
    "@types/jest": "^29.5.12",
    "@types/react": "~18.2.79",
    "@types/react-test-renderer": "^18.3.0",
    "babel-plugin-module-resolver": "^5.0.2",
    "jest": "^29.7.0",
    "jest-expo": "~50.0.4",
    "react-test-renderer": "18.2.0",
    "typescript": "^5.4.5"
  }
}
```

#### `apps/mobile/tsconfig.json`

```json
{
  "extends": "expo/tsconfig.base",
  "compilerOptions": {
    "strict": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"],
      "@components/*": ["./src/components/*"],
      "@screens/*": ["./src/screens/*"],
      "@hooks/*": ["./src/hooks/*"],
      "@utils/*": ["./src/utils/*"],
      "@types/*": ["./src/types/*"],
      "@api/*": ["./src/api/*"],
      "@store/*": ["./src/store/*"],
      "@theme/*": ["./src/theme/*"],
      "@assets/*": ["./src/assets/*"],
      "@mindmate/shared": ["../../packages/shared/src"]
    },
    "jsx": "react-jsx",
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "noEmit": true
  },
  "include": ["**/*.ts", "**/*.tsx", ".expo/types/**/*.ts", "expo-env.d.ts"],
  "exclude": ["node_modules", "android", "ios"]
}
```

#### `apps/mobile/.eslintrc.js`

```javascript
module.exports = {
  root: true,
  extends: [
    '@mindmate/eslint-config',
    'plugin:react-hooks/recommended',
    'plugin:react/recommended',
    'plugin:react-native/all',
  ],
  plugins: ['react', 'react-native', 'react-hooks'],
  parserOptions: {
    ecmaFeatures: {
      jsx: true,
    },
  },
  settings: {
    react: {
      version: 'detect',
    },
  },
  env: {
    'react-native/react-native': true,
    jest: true,
  },
  rules: {
    'react/react-in-jsx-scope': 'off',
    'react-native/no-unused-styles': 'warn',
    'react-native/split-platform-components': 'off',
    'react-native/no-inline-styles': 'warn',
    'react-native/no-color-literals': 'off',
    'react-native/no-raw-text': ['warn', { skip: ['Text'] }],
    'react/prop-types': 'off',
  },
  overrides: [
    {
      files: ['**/*.test.ts', '**/*.test.tsx'],
      env: {
        jest: true,
      },
    },
  ],
};
```

#### `apps/mobile/.prettierrc`

```json
{
  "semi": true,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "es5",
  "printWidth": 100,
  "bracketSpacing": true,
  "arrowParens": "avoid",
  "endOfLine": "lf"
}
```

#### `apps/mobile/babel.config.js`

```javascript
module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      [
        'module-resolver',
        {
          root: ['./src'],
          extensions: ['.ios.js', '.android.js', '.js', '.ts', '.tsx', '.json'],
          alias: {
            '@': './src',
            '@components': './src/components',
            '@screens': './src/screens',
            '@hooks': './src/hooks',
            '@utils': './src/utils',
            '@types': './src/types',
            '@api': './src/api',
            '@store': './src/store',
            '@theme': './src/theme',
            '@assets': './src/assets',
          },
        },
      ],
      'react-native-reanimated/plugin',
    ],
  };
};
```

#### `apps/mobile/metro.config.js`

```javascript
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Enable symlinks for monorepo
config.watchFolders = [
  path.resolve(__dirname, '../../packages/shared'),
];

// Add support for workspace packages
config.resolver.nodeModulesPaths = [
  path.resolve(__dirname, 'node_modules'),
  path.resolve(__dirname, '../../node_modules'),
];

config.resolver.disableHierarchicalLookup = true;

module.exports = config;
```

---

### 2. Web App (Next.js)

**Location:** `apps/web/`

```
apps/web/
├── public/                     # Static assets
│   ├── favicon.ico
│   ├── logo.svg
│   ├── manifest.json
│   └── robots.txt
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (auth)/             # Auth route group
│   │   │   ├── login/
│   │   │   ├── register/
│   │   │   └── forgot-password/
│   │   ├── (main)/             # Main app route group
│   │   │   ├── chat/
│   │   │   ├── dashboard/
│   │   │   ├── journal/
│   │   │   ├── meditation/
│   │   │   ├── profile/
│   │   │   └── settings/
│   │   ├── api/                # API routes
│   │   ├── layout.tsx          # Root layout
│   │   ├── page.tsx            # Home page
│   │   ├── loading.tsx         # Loading UI
│   │   ├── error.tsx           # Error UI
│   │   ├── not-found.tsx       # 404 page
│   │   └── globals.css         # Global styles
│   ├── components/             # React components
│   │   ├── ui/                 # UI components
│   │   ├── forms/              # Form components
│   │   ├── layout/             # Layout components
│   │   └── features/           # Feature components
│   ├── hooks/                  # Custom hooks
│   ├── lib/                    # Library configurations
│   ├── providers/              # Context providers
│   ├── store/                  # State management
│   ├── types/                  # TypeScript types
│   └── utils/                  # Utility functions
├── .env.example
├── .eslintrc.js
├── .prettierrc
├── components.json             # shadcn/ui config
├── next.config.js
├── package.json
├── postcss.config.js
├── tailwind.config.ts
├── tsconfig.json
└── README.md
```

#### `apps/web/package.json`

```json
{
  "name": "@mindmate/web",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "next dev -p 3000",
    "build": "next build",
    "start": "next start -p 3000",
    "lint": "next lint",
    "lint:fix": "next lint --fix",
    "type-check": "tsc --noEmit",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:e2e": "playwright test",
    "clean": "rm -rf .next node_modules"
  },
  "dependencies": {
    "@mindmate/shared": "workspace:*",
    "@mindmate/ui": "workspace:*",
    "@radix-ui/react-accordion": "^1.1.2",
    "@radix-ui/react-alert-dialog": "^1.0.5",
    "@radix-ui/react-avatar": "^1.0.4",
    "@radix-ui/react-checkbox": "^1.0.4",
    "@radix-ui/react-dialog": "^1.0.5",
    "@radix-ui/react-dropdown-menu": "^2.0.6",
    "@radix-ui/react-label": "^2.0.2",
    "@radix-ui/react-popover": "^1.0.7",
    "@radix-ui/react-progress": "^1.0.3",
    "@radix-ui/react-select": "^2.0.0",
    "@radix-ui/react-separator": "^1.0.3",
    "@radix-ui/react-slider": "^1.1.2",
    "@radix-ui/react-slot": "^1.0.2",
    "@radix-ui/react-switch": "^1.0.3",
    "@radix-ui/react-tabs": "^1.0.4",
    "@radix-ui/react-toast": "^1.1.5",
    "@radix-ui/react-tooltip": "^1.0.7",
    "@tanstack/react-query": "^5.32.1",
    "@tanstack/react-query-devtools": "^5.32.1",
    "axios": "^1.6.8",
    "class-variance-authority": "^0.7.0",
    "clsx": "^2.1.1",
    "cmdk": "^1.0.0",
    "date-fns": "^3.6.0",
    "framer-motion": "^11.1.7",
    "lucide-react": "^0.376.0",
    "next": "14.2.3",
    "next-auth": "^5.0.0-beta.17",
    "next-intl": "^3.12.0",
    "next-themes": "^0.3.0",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-hook-form": "^7.51.3",
    "recharts": "^2.12.6",
    "socket.io-client": "^4.7.5",
    "sonner": "^1.4.41",
    "tailwind-merge": "^2.3.0",
    "tailwindcss-animate": "^1.0.7",
    "vaul": "^0.9.0",
    "zod": "^3.23.4",
    "zustand": "^4.5.2"
  },
  "devDependencies": {
    "@playwright/test": "^1.43.1",
    "@testing-library/jest-dom": "^6.4.2",
    "@testing-library/react": "^15.0.5",
    "@types/jest": "^29.5.12",
    "@types/node": "^20.12.7",
    "@types/react": "^18.3.1",
    "@types/react-dom": "^18.3.0",
    "autoprefixer": "^10.4.19",
    "eslint": "^8.57.0",
    "eslint-config-next": "14.2.3",
    "jest": "^29.7.0",
    "jest-environment-jsdom": "^29.7.0",
    "postcss": "^8.4.38",
    "tailwindcss": "^3.4.3",
    "typescript": "^5.4.5"
  }
}
```

#### `apps/web/tsconfig.json`

```json
{
  "compilerOptions": {
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"],
      "@components/*": ["./src/components/*"],
      "@hooks/*": ["./src/hooks/*"],
      "@lib/*": ["./src/lib/*"],
      "@utils/*": ["./src/utils/*"],
      "@types/*": ["./src/types/*"],
      "@store/*": ["./src/store/*"],
      "@providers/*": ["./src/providers/*"],
      "@mindmate/shared": ["../../packages/shared/src"],
      "@mindmate/ui": ["../../packages/ui/src"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

#### `apps/web/.eslintrc.js`

```javascript
module.exports = {
  root: true,
  extends: [
    'next/core-web-vitals',
    '@mindmate/eslint-config',
    'plugin:jsx-a11y/recommended',
  ],
  plugins: ['jsx-a11y'],
  rules: {
    'jsx-a11y/anchor-is-valid': 'off',
    '@next/next/no-html-link-for-pages': 'off',
  },
  overrides: [
    {
      files: ['**/*.test.ts', '**/*.test.tsx'],
      env: {
        jest: true,
      },
    },
  ],
};
```

#### `apps/web/.prettierrc`

```json
{
  "semi": true,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "es5",
  "printWidth": 100,
  "bracketSpacing": true,
  "arrowParens": "avoid",
  "endOfLine": "lf",
  "plugins": ["prettier-plugin-tailwindcss"]
}
```

#### `apps/web/next.config.js`

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  transpilePackages: ['@mindmate/shared', '@mindmate/ui'],
  images: {
    domains: ['localhost'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  experimental: {
    typedRoutes: true,
  },
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Credentials', value: 'true' },
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,DELETE,PATCH,POST,PUT' },
          {
            key: 'Access-Control-Allow-Headers',
            value:
              'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization',
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
```

#### `apps/web/tailwind.config.ts`

```typescript
import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class'],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    '../../packages/ui/src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: {
        '2xl': '1400px',
      },
    },
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};

export default config;
```

#### `apps/web/postcss.config.js`

```javascript
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
```

---

### 3. Admin Dashboard (Next.js)

**Location:** `apps/admin/`

```
apps/admin/
├── public/
│   ├── favicon.ico
│   └── logo.svg
├── src/
│   ├── app/
│   │   ├── (dashboard)/
│   │   │   ├── analytics/
│   │   │   ├── content/
│   │   │   ├── moderation/
│   │   │   ├── settings/
│   │   │   ├── users/
│   │   │   └── layout.tsx
│   │   ├── api/
│   │   ├── login/
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   ├── loading.tsx
│   │   ├── error.tsx
│   │   ├── not-found.tsx
│   │   └── globals.css
│   ├── components/
│   │   ├── ui/
│   │   ├── data-table/
│   │   ├── charts/
│   │   ├── forms/
│   │   └── layout/
│   ├── hooks/
│   ├── lib/
│   ├── providers/
│   ├── store/
│   ├── types/
│   └── utils/
├── .env.example
├── .eslintrc.js
├── .prettierrc
├── components.json
├── next.config.js
├── package.json
├── postcss.config.js
├── tailwind.config.ts
├── tsconfig.json
└── README.md
```

#### `apps/admin/package.json`

```json
{
  "name": "@mindmate/admin",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "next dev -p 3001",
    "build": "next build",
    "start": "next start -p 3001",
    "lint": "next lint",
    "lint:fix": "next lint --fix",
    "type-check": "tsc --noEmit",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "clean": "rm -rf .next node_modules"
  },
  "dependencies": {
    "@mindmate/shared": "workspace:*",
    "@mindmate/ui": "workspace:*",
    "@radix-ui/react-accordion": "^1.1.2",
    "@radix-ui/react-alert-dialog": "^1.0.5",
    "@radix-ui/react-avatar": "^1.0.4",
    "@radix-ui/react-checkbox": "^1.0.4",
    "@radix-ui/react-dialog": "^1.0.5",
    "@radix-ui/react-dropdown-menu": "^2.0.6",
    "@radix-ui/react-label": "^2.0.2",
    "@radix-ui/react-popover": "^1.0.7",
    "@radix-ui/react-progress": "^1.0.3",
    "@radix-ui/react-select": "^2.0.0",
    "@radix-ui/react-separator": "^1.0.3",
    "@radix-ui/react-slider": "^1.1.2",
    "@radix-ui/react-slot": "^1.0.2",
    "@radix-ui/react-switch": "^1.0.3",
    "@radix-ui/react-tabs": "^1.0.4",
    "@radix-ui/react-toast": "^1.1.5",
    "@radix-ui/react-tooltip": "^1.0.7",
    "@tanstack/react-query": "^5.32.1",
    "@tanstack/react-query-devtools": "^5.32.1",
    "@tanstack/react-table": "^8.16.0",
    "axios": "^1.6.8",
    "class-variance-authority": "^0.7.0",
    "clsx": "^2.1.1",
    "cmdk": "^1.0.0",
    "date-fns": "^3.6.0",
    "framer-motion": "^11.1.7",
    "lucide-react": "^0.376.0",
    "next": "14.2.3",
    "next-auth": "^5.0.0-beta.17",
    "next-themes": "^0.3.0",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-hook-form": "^7.51.3",
    "recharts": "^2.12.6",
    "sonner": "^1.4.41",
    "tailwind-merge": "^2.3.0",
    "tailwindcss-animate": "^1.0.7",
    "vaul": "^0.9.0",
    "zod": "^3.23.4",
    "zustand": "^4.5.2"
  },
  "devDependencies": {
    "@testing-library/jest-dom": "^6.4.2",
    "@testing-library/react": "^15.0.5",
    "@types/jest": "^29.5.12",
    "@types/node": "^20.12.7",
    "@types/react": "^18.3.1",
    "@types/react-dom": "^18.3.0",
    "autoprefixer": "^10.4.19",
    "eslint": "^8.57.0",
    "eslint-config-next": "14.2.3",
    "jest": "^29.7.0",
    "jest-environment-jsdom": "^29.7.0",
    "postcss": "^8.4.38",
    "tailwindcss": "^3.4.3",
    "typescript": "^5.4.5"
  }
}
```

#### `apps/admin/tsconfig.json`

```json
{
  "compilerOptions": {
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"],
      "@components/*": ["./src/components/*"],
      "@hooks/*": ["./src/hooks/*"],
      "@lib/*": ["./src/lib/*"],
      "@utils/*": ["./src/utils/*"],
      "@types/*": ["./src/types/*"],
      "@store/*": ["./src/store/*"],
      "@providers/*": ["./src/providers/*"],
      "@mindmate/shared": ["../../packages/shared/src"],
      "@mindmate/ui": ["../../packages/ui/src"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

#### `apps/admin/.eslintrc.js`

```javascript
module.exports = {
  root: true,
  extends: [
    'next/core-web-vitals',
    '@mindmate/eslint-config',
    'plugin:jsx-a11y/recommended',
  ],
  plugins: ['jsx-a11y'],
  rules: {
    'jsx-a11y/anchor-is-valid': 'off',
    '@next/next/no-html-link-for-pages': 'off',
  },
};
```

#### `apps/admin/.prettierrc`

```json
{
  "semi": true,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "es5",
  "printWidth": 100,
  "bracketSpacing": true,
  "arrowParens": "avoid",
  "endOfLine": "lf",
  "plugins": ["prettier-plugin-tailwindcss"]
}
```

#### `apps/admin/next.config.js`

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  transpilePackages: ['@mindmate/shared', '@mindmate/ui'],
  images: {
    domains: ['localhost'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  experimental: {
    typedRoutes: true,
  },
};

module.exports = nextConfig;
```

#### `apps/admin/tailwind.config.ts`

```typescript
import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class'],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    '../../packages/ui/src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: {
        '2xl': '1400px',
      },
    },
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};

export default config;
```

---

## Services

### 1. API Service (Node.js/Express)

**Location:** `services/api/`

```
services/api/
├── src/
│   ├── config/                 # Configuration
│   │   ├── database.ts
│   │   ├── redis.ts
│   │   └── env.ts
│   ├── controllers/            # Route controllers
│   │   ├── auth.controller.ts
│   │   ├── chat.controller.ts
│   │   ├── journal.controller.ts
│   │   ├── meditation.controller.ts
│   │   ├── user.controller.ts
│   │   └── webhook.controller.ts
│   ├── middleware/             # Express middleware
│   │   ├── auth.middleware.ts
│   │   ├── error.middleware.ts
│   │   ├── rate-limit.middleware.ts
│   │   └── validation.middleware.ts
│   ├── models/                 # Database models
│   │   ├── chat.model.ts
│   │   ├── journal.model.ts
│   │   ├── meditation.model.ts
│   │   ├── user.model.ts
│   │   └── index.ts
│   ├── routes/                 # API routes
│   │   ├── auth.routes.ts
│   │   ├── chat.routes.ts
│   │   ├── journal.routes.ts
│   │   ├── meditation.routes.ts
│   │   ├── user.routes.ts
│   │   └── index.ts
│   ├── services/               # Business logic
│   │   ├── auth.service.ts
│   │   ├── chat.service.ts
│   │   ├── journal.service.ts
│   │   ├── meditation.service.ts
│   │   ├── notification.service.ts
│   │   └── user.service.ts
│   ├── sockets/                # Socket.IO handlers
│   │   └── chat.socket.ts
│   ├── types/                  # TypeScript types
│   ├── utils/                  # Utility functions
│   ├── validators/             # Input validators
│   ├── app.ts                  # Express app setup
│   └── server.ts               # Server entry point
├── tests/                      # Test files
│   ├── integration/
│   └── unit/
├── .env.example
├── .eslintrc.js
├── .prettierrc
├── docker-compose.yml
├── Dockerfile
├── jest.config.js
├── package.json
├── tsconfig.json
└── README.md
```

#### `services/api/package.json`

```json
{
  "name": "@mindmate/api",
  "version": "1.0.0",
  "private": true,
  "main": "dist/server.js",
  "scripts": {
    "dev": "tsx watch src/server.ts",
    "build": "tsc",
    "start": "node dist/server.js",
    "lint": "eslint src --ext .ts",
    "lint:fix": "eslint src --ext .ts --fix",
    "type-check": "tsc --noEmit",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:integration": "jest --config jest.integration.config.js",
    "db:migrate": "prisma migrate dev",
    "db:generate": "prisma generate",
    "db:seed": "tsx prisma/seed.ts",
    "db:studio": "prisma studio",
    "clean": "rm -rf dist node_modules"
  },
  "dependencies": {
    "@mindmate/shared": "workspace:*",
    "@prisma/client": "^5.13.0",
    "bcryptjs": "^2.4.3",
    "compression": "^1.7.4",
    "cors": "^2.8.5",
    "dotenv": "^16.4.5",
    "express": "^4.19.2",
    "express-rate-limit": "^7.2.0",
    "express-validator": "^7.0.1",
    "helmet": "^7.1.0",
    "ioredis": "^5.4.1",
    "jsonwebtoken": "^9.0.2",
    "morgan": "^1.10.0",
    "openai": "^4.38.5",
    "passport": "^0.7.0",
    "passport-jwt": "^4.0.1",
    "pino": "^8.21.0",
    "pino-pretty": "^11.0.0",
    "socket.io": "^4.7.5",
    "uuid": "^9.0.1",
    "zod": "^3.23.4"
  },
  "devDependencies": {
    "@types/bcryptjs": "^2.4.6",
    "@types/compression": "^1.7.5",
    "@types/cors": "^2.8.17",
    "@types/express": "^4.17.21",
    "@types/jest": "^29.5.12",
    "@types/jsonwebtoken": "^9.0.6",
    "@types/morgan": "^1.9.9",
    "@types/node": "^20.12.7",
    "@types/passport": "^1.0.16",
    "@types/passport-jwt": "^4.0.1",
    "@types/supertest": "^6.0.2",
    "@types/uuid": "^9.0.8",
    "jest": "^29.7.0",
    "prisma": "^5.13.0",
    "supertest": "^7.0.0",
    "ts-jest": "^29.1.2",
    "tsx": "^4.7.3",
    "typescript": "^5.4.5"
  }
}
```

#### `services/api/tsconfig.json`

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "commonjs",
    "lib": ["ES2022"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "moduleResolution": "node",
    "allowSyntheticDefaultImports": true,
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"],
      "@config/*": ["./src/config/*"],
      "@controllers/*": ["./src/controllers/*"],
      "@middleware/*": ["./src/middleware/*"],
      "@models/*": ["./src/models/*"],
      "@routes/*": ["./src/routes/*"],
      "@services/*": ["./src/services/*"],
      "@sockets/*": ["./src/sockets/*"],
      "@types/*": ["./src/types/*"],
      "@utils/*": ["./src/utils/*"],
      "@validators/*": ["./src/validators/*"],
      "@mindmate/shared": ["../../packages/shared/src"]
    }
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "tests"]
}
```

#### `services/api/.eslintrc.js`

```javascript
module.exports = {
  root: true,
  extends: ['@mindmate/eslint-config'],
  parserOptions: {
    project: './tsconfig.json',
  },
  env: {
    node: true,
    jest: true,
  },
  rules: {
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/no-explicit-any': 'warn',
  },
};
```

#### `services/api/.prettierrc`

```json
{
  "semi": true,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "es5",
  "printWidth": 100,
  "bracketSpacing": true,
  "arrowParens": "avoid",
  "endOfLine": "lf"
}
```

#### `services/api/jest.config.js`

```javascript
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src', '<rootDir>/tests'],
  testMatch: ['**/*.test.ts'],
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/server.ts',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@config/(.*)$': '<rootDir>/src/config/$1',
    '^@controllers/(.*)$': '<rootDir>/src/controllers/$1',
    '^@middleware/(.*)$': '<rootDir>/src/middleware/$1',
    '^@models/(.*)$': '<rootDir>/src/models/$1',
    '^@routes/(.*)$': '<rootDir>/src/routes/$1',
    '^@services/(.*)$': '<rootDir>/src/services/$1',
    '^@utils/(.*)$': '<rootDir>/src/utils/$1',
  },
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
};
```

#### `services/api/Dockerfile`

```dockerfile
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies
COPY package.json pnpm-lock.yaml ./
RUN npm install -g pnpm && pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Build
RUN pnpm build

# Production stage
FROM node:20-alpine AS production

WORKDIR /app

# Install production dependencies only
COPY package.json pnpm-lock.yaml ./
RUN npm install -g pnpm && pnpm install --frozen-lockfile --prod

# Copy built files
COPY --from=builder /app/dist ./dist

EXPOSE 4000

CMD ["node", "dist/server.js"]
```

---

### 2. AI Pipeline Service (Python)

**Location:** `services/ai-pipeline/`

```
services/ai-pipeline/
├── src/
│   ├── __init__.py
│   ├── main.py                 # FastAPI entry point
│   ├── config/                 # Configuration
│   │   ├── __init__.py
│   │   ├── settings.py
│   │   └── logging.py
│   ├── api/                    # API routes
│   │   ├── __init__.py
│   │   ├── routes/
│   │   │   ├── __init__.py
│   │   │   ├── chat.py
│   │   │   ├── emotion.py
│   │   │   ├── journal.py
│   │   │   └── health.py
│   │   └── dependencies.py
│   ├── core/                   # Core business logic
│   │   ├── __init__.py
│   │   ├── chat_engine.py
│   │   ├── emotion_analyzer.py
│   │   ├── journal_processor.py
│   │   └── recommendation.py
│   ├── models/                 # ML models
│   │   ├── __init__.py
│   │   ├── llm/
│   │   │   ├── __init__.py
│   │   │   ├── openai_client.py
│   │   │   └── prompts/
│   │   ├── emotion/
│   │   │   ├── __init__.py
│   │   │   └── classifier.py
│   │   └── embeddings/
│   │       ├── __init__.py
│   │       └── vector_store.py
│   ├── services/               # External services
│   │   ├── __init__.py
│   │   ├── redis_service.py
│   │   └── queue_service.py
│   ├── utils/                  # Utilities
│   │   ├── __init__.py
│   │   ├── helpers.py
│   │   └── validators.py
│   └── workers/                # Background workers
│       ├── __init__.py
│       └── tasks.py
├── tests/                      # Test files
│   ├── __init__.py
│   ├── conftest.py
│   ├── unit/
│   └── integration/
├── models/                     # Pre-trained models
│   └── .gitkeep
├── notebooks/                  # Jupyter notebooks
│   └── experiments/
├── .env.example
├── .flake8
├── .pylintrc
├── Dockerfile
├── docker-compose.yml
├── pyproject.toml
├── pytest.ini
├── requirements.txt
├── requirements-dev.txt
└── README.md
```

#### `services/ai-pipeline/pyproject.toml`

```toml
[build-system]
requires = ["setuptools>=61.0", "wheel"]
build-backend = "setuptools.build_meta"

[project]
name = "mindmate-ai-pipeline"
version = "1.0.0"
description = "MindMate AI Pipeline Service"
authors = [{ name = "MindMate AI Team", email = "team@mindmate.ai" }]
license = { text = "MIT" }
readme = "README.md"
requires-python = ">=3.11"
classifiers = [
    "Development Status :: 4 - Beta",
    "Intended Audience :: Developers",
    "License :: OSI Approved :: MIT License",
    "Programming Language :: Python :: 3",
    "Programming Language :: Python :: 3.11",
    "Programming Language :: Python :: 3.12",
]
dependencies = [
    "fastapi>=0.110.0",
    "uvicorn[standard]>=0.29.0",
    "pydantic>=2.7.0",
    "pydantic-settings>=2.2.1",
    "openai>=1.23.0",
    "langchain>=0.1.16",
    "langchain-openai>=0.1.3",
    "redis>=5.0.3",
    "celery>=5.3.6",
    "numpy>=1.26.4",
    "pandas>=2.2.2",
    "scikit-learn>=1.4.2",
    "transformers>=4.40.0",
    "torch>=2.3.0",
    "sentence-transformers>=2.7.0",
    "chromadb>=0.4.24",
    "httpx>=0.27.0",
    "python-multipart>=0.0.9",
    "python-jose[cryptography]>=3.3.0",
    "passlib[bcrypt]>=1.7.4",
    "structlog>=24.1.0",
    "prometheus-client>=0.20.0",
]

[project.optional-dependencies]
dev = [
    "pytest>=8.1.1",
    "pytest-asyncio>=0.23.6",
    "pytest-cov>=5.0.0",
    "black>=24.4.0",
    "isort>=5.13.2",
    "flake8>=7.0.0",
    "mypy>=1.9.0",
    "pylint>=3.1.0",
    "pre-commit>=3.7.0",
    "httpx>=0.27.0",
]

[project.scripts]
ai-pipeline = "src.main:main"

[tool.setuptools.packages.find]
where = ["."]
include = ["src*"]

[tool.black]
line-length = 100
target-version = ['py311']
include = '\.pyi?$'
extend-exclude = '''
/(
  # directories
  \.eggs
  | \.git
  | \.hg
  | \.mypy_cache
  | \.tox
  | \.venv
  | build
  | dist
)/
'''

[tool.isort]
profile = "black"
line_length = 100
multi_line_output = 3
include_trailing_comma = true
force_grid_wrap = 0
use_parentheses = true
ensure_newline_before_comments = true
skip_gitignore = true

[tool.mypy]
python_version = "3.11"
warn_return_any = true
warn_unused_configs = true
disallow_untyped_defs = true
disallow_incomplete_defs = true
check_untyped_defs = true
disallow_untyped_decorators = true
no_implicit_optional = true
warn_redundant_casts = true
warn_unused_ignores = true
warn_no_return = true
warn_unreachable = true
strict_equality = true
show_error_codes = true

[[tool.mypy.overrides]]
module = [
    "transformers.*",
    "torch.*",
    "chromadb.*",
    "sklearn.*",
]
ignore_missing_imports = true

[tool.pytest.ini_options]
minversion = "8.0"
addopts = "-ra -q --strict-markers --cov=src --cov-report=term-missing"
testpaths = ["tests"]
asyncio_mode = "auto"
markers = [
    "slow: marks tests as slow (deselect with '-m \"not slow\"')",
    "integration: marks tests as integration tests",
    "unit: marks tests as unit tests",
]

[tool.coverage.run]
source = ["src"]
omit = ["*/tests/*", "*/test_*"]

[tool.coverage.report]
exclude_lines = [
    "pragma: no cover",
    "def __repr__",
    "raise AssertionError",
    "raise NotImplementedError",
    "if __name__ == .__main__.:",
    "if TYPE_CHECKING:",
]
```

#### `services/ai-pipeline/requirements.txt`

```
fastapi>=0.110.0
uvicorn[standard]>=0.29.0
pydantic>=2.7.0
pydantic-settings>=2.2.1
openai>=1.23.0
langchain>=0.1.16
langchain-openai>=0.1.3
redis>=5.0.3
celery>=5.3.6
numpy>=1.26.4
pandas>=2.2.2
scikit-learn>=1.4.2
transformers>=4.40.0
torch>=2.3.0
sentence-transformers>=2.7.0
chromadb>=0.4.24
httpx>=0.27.0
python-multipart>=0.0.9
python-jose[cryptography]>=3.3.0
passlib[bcrypt]>=1.7.4
structlog>=24.1.0
prometheus-client>=0.20.0
```

#### `services/ai-pipeline/requirements-dev.txt`

```
-r requirements.txt
pytest>=8.1.1
pytest-asyncio>=0.23.6
pytest-cov>=5.0.0
black>=24.4.0
isort>=5.13.2
flake8>=7.0.0
mypy>=1.9.0
pylint>=3.1.0
pre-commit>=3.7.0
httpx>=0.27.0
```

#### `services/ai-pipeline/.flake8`

```ini
[flake8]
max-line-length = 100
extend-ignore = E203, W503
exclude =
    .git,
    __pycache__,
    build,
    dist,
    .venv,
    venv,
    .tox,
    .eggs,
    *.egg-info
per-file-ignores =
    __init__.py:F401
```

#### `services/ai-pipeline/.pylintrc`

```ini
[MASTER]
init-hook='import sys; sys.path.append(".")'
ignore=CVS,.git,__pycache__,.venv,venv,build,dist
jobs=1
limit-inference-results=100
persistent=yes
suggestion-mode=yes
unsafe-load-any-extension=no

[MESSAGES CONTROL]
disable=
    C0114,  # missing-module-docstring
    C0115,  # missing-class-docstring
    C0116,  # missing-function-docstring
    R0903,  # too-few-public-methods
    R0913,  # too-many-arguments
    R0914,  # too-many-locals
    W0511,  # fixme

[REPORTS]
output-format=text
reports=no
score=yes

[REFACTORING]
max-nested-blocks=5
never-returning-functions=sys.exit

[BASIC]
good-names=i,j,k,ex,Run,_,id,db,ok
bad-names=foo,bar,baz,toto,tutu,tata
name-group=
include-naming-hint=no
property-classes=abc.abstractproperty
function-rgx=[a-z_][a-z0-9_]{2,50}$
variable-rgx=[a-z_][a-z0-9_]{0,50}$
const-rgx=(([A-Z_][A-Z0-9_]*)|(__.*__))$
attr-rgx=[a-z_][a-z0-9_]{2,50}$
argument-rgx=[a-z_][a-z0-9_]{0,50}$
class-attribute-rgx=([A-Za-z_][A-Za-z0-9_]{2,50}|(__.*__))$
inlinevar-rgx=[A-Za-z_][A-Za-z0-9_]*$
class-rgx=[A-Z_][a-zA-Z0-9]+$
module-rgx=(([a-z_][a-z0-9_]*)|(__.*__))$
method-rgx=[a-z_][a-z0-9_]{2,50}$
dummy-variables-rgx=_+$|(_[a-zA-Z0-9_]*[a-zA-Z0-9]+?)$|dummy|^ignored_|^unused_
argument-rgx=[a-z_][a-z0-9_]{0,50}$

[FORMAT]
max-line-length=100
ignore-long-lines=^\s*(# )?<?https?://\S+>?$
single-line-if-stmt=no
no-space-check=trailing-comma,dict-separator
max-module-lines=2000
indent-string='    '
indent-after-paren=4
expected-line-ending-format=LF

[LOGGING]
logging-modules=logging,structlog

[MISCELLANEOUS]
notes=FIXME,XXX,TODO

[TYPECHECK]
generated-members=REQUEST,acl_users,aq_parent,objects,DoesNotExist,MultipleObjectsReturned

[VARIABLES]
init-import=no
dummy-variables-rgx=_+$|(_[a-zA-Z0-9_]*[a-zA-Z0-9]+?)$|dummy|^ignored_|^unused_
additional-builtins=
callbacks=cb_,_cb

[CLASSES]
defining-attr-methods=__init__,__new__,setUp,__post_init__
valid-classmethod-first-arg=cls
valid-metaclass-classmethod-first-arg=cls
exclude-protected=_asdict,_fields,_replace,_source,_make,os._exit

[DESIGN]
max-args=10
max-attributes=15
max-bool-expr=5
max-branches=15
max-locals=20
max-parents=7
max-public-methods=25
max-returns=10
max-statements=60
min-public-methods=1

[IMPORTS]
deprecate-modules=optparse,tkinter.tix
import-graph=
ext-import-graph=
int-import-graph=
```

#### `services/ai-pipeline/pytest.ini`

```ini
[pytest]
testpaths = tests
python_files = test_*.py
python_classes = Test*
python_functions = test_*
addopts = -v --tb=short --strict-markers
django_find_project = false
asyncio_mode = auto
markers =
    slow: marks tests as slow
    integration: marks tests as integration tests
    unit: marks tests as unit tests
```

#### `services/ai-pipeline/Dockerfile`

```dockerfile
FROM python:3.11-slim AS builder

WORKDIR /app

# Install build dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir --user -r requirements.txt

# Production stage
FROM python:3.11-slim AS production

WORKDIR /app

# Copy installed packages from builder
COPY --from=builder /root/.local /root/.local

# Copy application code
COPY src/ ./src/

# Make sure scripts in .local are usable
ENV PATH=/root/.local/bin:$PATH
ENV PYTHONPATH=/app

EXPOSE 8000

CMD ["uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

---

### 3. Scheduler Service (Node.js)

**Location:** `services/scheduler/`

```
services/scheduler/
├── src/
│   ├── config/                 # Configuration
│   │   ├── database.ts
│   │   ├── redis.ts
│   │   └── env.ts
│   ├── jobs/                   # Job definitions
│   │   ├── daily-check-in.job.ts
│   │   ├── journal-reminder.job.ts
│   │   ├── meditation-reminder.job.ts
│   │   ├── report-generation.job.ts
│   │   └── index.ts
│   ├── queues/                 # Queue definitions
│   │   ├── email.queue.ts
│   │   ├── notification.queue.ts
│   │   └── index.ts
│   ├── services/               # Business logic
│   │   ├── job.service.ts
│   │   ├── queue.service.ts
│   │   └── notification.service.ts
│   ├── workers/                # Queue workers
│   │   ├── email.worker.ts
│   │   ├── notification.worker.ts
│   │   └── index.ts
│   ├── types/                  # TypeScript types
│   ├── utils/                  # Utility functions
│   ├── scheduler.ts            # Scheduler setup
│   └── server.ts               # Server entry point
├── tests/
│   ├── integration/
│   └── unit/
├── .env.example
├── .eslintrc.js
├── .prettierrc
├── Dockerfile
├── docker-compose.yml
├── jest.config.js
├── package.json
├── tsconfig.json
└── README.md
```

#### `services/scheduler/package.json`

```json
{
  "name": "@mindmate/scheduler",
  "version": "1.0.0",
  "private": true,
  "main": "dist/server.js",
  "scripts": {
    "dev": "tsx watch src/server.ts",
    "build": "tsc",
    "start": "node dist/server.js",
    "lint": "eslint src --ext .ts",
    "lint:fix": "eslint src --ext .ts --fix",
    "type-check": "tsc --noEmit",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "clean": "rm -rf dist node_modules"
  },
  "dependencies": {
    "@mindmate/shared": "workspace:*",
    "bullmq": "^5.7.8",
    "cron-parser": "^4.9.0",
    "dotenv": "^16.4.5",
    "ioredis": "^5.4.1",
    "node-cron": "^3.0.3",
    "pino": "^8.21.0",
    "pino-pretty": "^11.0.0",
    "zod": "^3.23.4"
  },
  "devDependencies": {
    "@types/jest": "^29.5.12",
    "@types/node": "^20.12.7",
    "@types/node-cron": "^3.0.11",
    "jest": "^29.7.0",
    "ts-jest": "^29.1.2",
    "tsx": "^4.7.3",
    "typescript": "^5.4.5"
  }
}
```

#### `services/scheduler/tsconfig.json`

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "commonjs",
    "lib": ["ES2022"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "moduleResolution": "node",
    "allowSyntheticDefaultImports": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"],
      "@config/*": ["./src/config/*"],
      "@jobs/*": ["./src/jobs/*"],
      "@queues/*": ["./src/queues/*"],
      "@services/*": ["./src/services/*"],
      "@workers/*": ["./src/workers/*"],
      "@types/*": ["./src/types/*"],
      "@utils/*": ["./src/utils/*"],
      "@mindmate/shared": ["../../packages/shared/src"]
    }
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "tests"]
}
```

#### `services/scheduler/.eslintrc.js`

```javascript
module.exports = {
  root: true,
  extends: ['@mindmate/eslint-config'],
  parserOptions: {
    project: './tsconfig.json',
  },
  env: {
    node: true,
    jest: true,
  },
  rules: {
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/no-explicit-any': 'warn',
  },
};
```

#### `services/scheduler/.prettierrc`

```json
{
  "semi": true,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "es5",
  "printWidth": 100,
  "bracketSpacing": true,
  "arrowParens": "avoid",
  "endOfLine": "lf"
}
```

---

## Packages

### Shared Package

**Location:** `packages/shared/`

```
packages/shared/
├── src/
│   ├── constants/              # Shared constants
│   │   ├── api.ts
│   │   ├── app.ts
│   │   ├── emotions.ts
│   │   ├── routes.ts
│   │   └── index.ts
│   ├── types/                  # Shared TypeScript types
│   │   ├── api.ts
│   │   ├── auth.ts
│   │   ├── chat.ts
│   │   ├── emotion.ts
│   │   ├── journal.ts
│   │   ├── meditation.ts
│   │   ├── notification.ts
│   │   ├── user.ts
│   │   └── index.ts
│   ├── utils/                  # Shared utilities
│   │   ├── date.ts
│   │   ├── encryption.ts
│   │   ├── http.ts
│   │   ├── logger.ts
│   │   ├── validation.ts
│   │   └── index.ts
│   ├── schemas/                # Zod schemas
│   │   ├── auth.schema.ts
│   │   ├── chat.schema.ts
│   │   ├── journal.schema.ts
│   │   ├── user.schema.ts
│   │   └── index.ts
│   └── index.ts                # Package entry point
├── tests/
├── .eslintrc.js
├── .prettierrc
├── package.json
├── tsconfig.json
└── README.md
```

#### `packages/shared/package.json`

```json
{
  "name": "@mindmate/shared",
  "version": "1.0.0",
  "private": true,
  "main": "./dist/index.js",
  "module": "./dist/index.mjs",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "import": "./dist/index.mjs",
      "require": "./dist/index.js",
      "types": "./dist/index.d.ts"
    },
    "./types": {
      "import": "./dist/types/index.mjs",
      "require": "./dist/types/index.js",
      "types": "./dist/types/index.d.ts"
    },
    "./utils": {
      "import": "./dist/utils/index.mjs",
      "require": "./dist/utils/index.js",
      "types": "./dist/utils/index.d.ts"
    },
    "./constants": {
      "import": "./dist/constants/index.mjs",
      "require": "./dist/constants/index.js",
      "types": "./dist/constants/index.d.ts"
    },
    "./schemas": {
      "import": "./dist/schemas/index.mjs",
      "require": "./dist/schemas/index.js",
      "types": "./dist/schemas/index.d.ts"
    }
  },
  "scripts": {
    "build": "tsup src/index.ts --format cjs,esm --dts --clean",
    "dev": "tsup src/index.ts --format cjs,esm --dts --watch",
    "lint": "eslint src --ext .ts",
    "lint:fix": "eslint src --ext .ts --fix",
    "type-check": "tsc --noEmit",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "clean": "rm -rf dist node_modules"
  },
  "dependencies": {
    "zod": "^3.23.4"
  },
  "devDependencies": {
    "@types/jest": "^29.5.12",
    "@types/node": "^20.12.7",
    "jest": "^29.7.0",
    "ts-jest": "^29.1.2",
    "tsup": "^8.0.2",
    "typescript": "^5.4.5"
  }
}
```

#### `packages/shared/tsconfig.json`

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "lib": ["ES2022"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "moduleResolution": "bundler",
    "allowSyntheticDefaultImports": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"],
      "@types/*": ["./src/types/*"],
      "@utils/*": ["./src/utils/*"],
      "@constants/*": ["./src/constants/*"],
      "@schemas/*": ["./src/schemas/*"]
    }
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "tests"]
}
```

#### `packages/shared/.eslintrc.js`

```javascript
module.exports = {
  root: true,
  extends: ['@mindmate/eslint-config'],
  parserOptions: {
    project: './tsconfig.json',
  },
  env: {
    node: true,
    jest: true,
  },
};
```

#### `packages/shared/.prettierrc`

```json
{
  "semi": true,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "es5",
  "printWidth": 100,
  "bracketSpacing": true,
  "arrowParens": "avoid",
  "endOfLine": "lf"
}
```

---

### UI Package

**Location:** `packages/ui/`

```
packages/ui/
├── src/
│   ├── components/             # UI components
│   │   ├── button/
│   │   ├── card/
│   │   ├── dialog/
│   │   ├── dropdown-menu/
│   │   ├── form/
│   │   ├── input/
│   │   ├── select/
│   │   ├── toast/
│   │   └── index.ts
│   ├── hooks/                  # UI hooks
│   ├── lib/                    # Utility functions
│   └── styles/                 # Shared styles
│       └── globals.css
├── .eslintrc.js
├── .prettierrc
├── components.json
├── package.json
├── tailwind.config.ts
├── tsconfig.json
└── README.md
```

#### `packages/ui/package.json`

```json
{
  "name": "@mindmate/ui",
  "version": "1.0.0",
  "private": true,
  "main": "./dist/index.js",
  "module": "./dist/index.mjs",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "import": "./dist/index.mjs",
      "require": "./dist/index.js",
      "types": "./dist/index.d.ts"
    },
    "./components/*": {
      "import": "./dist/components/*.mjs",
      "require": "./dist/components/*.js",
      "types": "./dist/components/*.d.ts"
    },
    "./styles/*": "./dist/styles/*"
  },
  "sideEffects": [
    "**/*.css"
  ],
  "scripts": {
    "build": "tsup src/index.ts --format cjs,esm --dts --clean --external react,react-dom",
    "dev": "tsup src/index.ts --format cjs,esm --dts --watch --external react,react-dom",
    "lint": "eslint src --ext .ts,.tsx",
    "lint:fix": "eslint src --ext .ts,.tsx --fix",
    "type-check": "tsc --noEmit",
    "clean": "rm -rf dist node_modules"
  },
  "dependencies": {
    "@radix-ui/react-slot": "^1.0.2",
    "class-variance-authority": "^0.7.0",
    "clsx": "^2.1.1",
    "tailwind-merge": "^2.3.0"
  },
  "devDependencies": {
    "@types/react": "^18.3.1",
    "@types/react-dom": "^18.3.0",
    "autoprefixer": "^10.4.19",
    "postcss": "^8.4.38",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "tailwindcss": "^3.4.3",
    "tsup": "^8.0.2",
    "typescript": "^5.4.5"
  },
  "peerDependencies": {
    "react": "^18.0.0",
    "react-dom": "^18.0.0"
  }
}
```

---

### ESLint Config Package

**Location:** `packages/eslint-config/`

```
packages/eslint-config/
├── src/
│   ├── index.js
│   ├── next.js
│   ├── react.js
│   └── node.js
├── package.json
└── README.md
```

#### `packages/eslint-config/package.json`

```json
{
  "name": "@mindmate/eslint-config",
  "version": "1.0.0",
  "private": true,
  "main": "./src/index.js",
  "exports": {
    ".": "./src/index.js",
    "./next": "./src/next.js",
    "./react": "./src/react.js",
    "./node": "./src/node.js"
  },
  "dependencies": {
    "@typescript-eslint/eslint-plugin": "^7.7.1",
    "@typescript-eslint/parser": "^7.7.1",
    "eslint-config-prettier": "^9.1.0",
    "eslint-import-resolver-typescript": "^3.6.1",
    "eslint-plugin-import": "^2.29.1",
    "eslint-plugin-prettier": "^5.1.3",
    "eslint-plugin-unused-imports": "^3.1.0"
  },
  "peerDependencies": {
    "eslint": "^8.0.0",
    "typescript": "^5.0.0"
  }
}
```

#### `packages/eslint-config/src/index.js`

```javascript
/** @type {import('eslint').Linter.Config} */
module.exports = {
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true,
    },
  },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:import/recommended',
    'plugin:import/typescript',
    'plugin:prettier/recommended',
  ],
  plugins: ['@typescript-eslint', 'import', 'unused-imports'],
  rules: {
    // TypeScript
    '@typescript-eslint/no-unused-vars': [
      'error',
      { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
    ],
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/no-empty-function': 'off',
    '@typescript-eslint/no-non-null-assertion': 'warn',

    // Import
    'import/order': [
      'error',
      {
        groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index'],
        'newlines-between': 'always',
        alphabetize: { order: 'asc', caseInsensitive: true },
      },
    ],
    'import/no-unresolved': 'error',
    'import/no-cycle': 'error',
    'import/no-self-import': 'error',

    // Unused imports
    'unused-imports/no-unused-imports': 'error',
    'unused-imports/no-unused-vars': [
      'warn',
      { vars: 'all', varsIgnorePattern: '^_', args: 'after-used', argsIgnorePattern: '^_' },
    ],

    // General
    'no-console': ['warn', { allow: ['warn', 'error'] }],
    'no-debugger': 'error',
    'no-duplicate-imports': 'error',
    'prefer-const': 'error',
    'no-var': 'error',
  },
  settings: {
    'import/resolver': {
      typescript: {
        alwaysTryTypes: true,
      },
    },
  },
  ignorePatterns: [
    'node_modules/',
    'dist/',
    'build/',
    '.next/',
    'coverage/',
    '*.config.js',
    '*.config.ts',
  ],
};
```

#### `packages/eslint-config/src/next.js`

```javascript
/** @type {import('eslint').Linter.Config} */
module.exports = {
  extends: ['./index.js', 'next/core-web-vitals'],
  rules: {
    '@next/next/no-html-link-for-pages': 'off',
  },
};
```

#### `packages/eslint-config/src/react.js`

```javascript
/** @type {import('eslint').Linter.Config} */
module.exports = {
  extends: ['./index.js', 'plugin:react-hooks/recommended'],
  plugins: ['react-hooks'],
  rules: {
    'react-hooks/rules-of-hooks': 'error',
    'react-hooks/exhaustive-deps': 'warn',
  },
};
```

#### `packages/eslint-config/src/node.js`

```javascript
/** @type {import('eslint').Linter.Config} */
module.exports = {
  extends: ['./index.js'],
  env: {
    node: true,
  },
  rules: {
    '@typescript-eslint/explicit-function-return-type': 'off',
  },
};
```

---

## Infrastructure

### Terraform

**Location:** `infrastructure/terraform/`

```
infrastructure/terraform/
├── modules/
│   ├── vpc/
│   │   ├── main.tf
│   │   ├── variables.tf
│   │   ├── outputs.tf
│   │   └── README.md
│   ├── eks/
│   │   ├── main.tf
│   │   ├── variables.tf
│   │   ├── outputs.tf
│   │   └── README.md
│   ├── rds/
│   │   ├── main.tf
│   │   ├── variables.tf
│   │   ├── outputs.tf
│   │   └── README.md
│   ├── elasticache/
│   │   ├── main.tf
│   │   ├── variables.tf
│   │   ├── outputs.tf
│   │   └── README.md
│   ├── s3/
│   │   ├── main.tf
│   │   ├── variables.tf
│   │   ├── outputs.tf
│   │   └── README.md
│   └── cloudfront/
│       ├── main.tf
│       ├── variables.tf
│       ├── outputs.tf
│       └── README.md
├── environments/
│   ├── dev/
│   │   ├── main.tf
│   │   ├── variables.tf
│   │   ├── terraform.tfvars
│   │   └── backend.tf
│   ├── staging/
│   │   ├── main.tf
│   │   ├── variables.tf
│   │   ├── terraform.tfvars
│   │   └── backend.tf
│   └── production/
│       ├── main.tf
│       ├── variables.tf
│       ├── terraform.tfvars
│       └── backend.tf
├── global/
│   ├── iam/
│   │   ├── main.tf
│   │   ├── variables.tf
│   │   └── outputs.tf
│   └── route53/
│       ├── main.tf
│       ├── variables.tf
│       └── outputs.tf
├── .terraformignore
├── README.md
└── versions.tf
```

#### `infrastructure/terraform/versions.tf`

```hcl
terraform {
  required_version = ">= 1.5.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    kubernetes = {
      source  = "hashicorp/kubernetes"
      version = "~> 2.23"
    }
    helm = {
      source  = "hashicorp/helm"
      version = "~> 2.11"
    }
  }
}
```

---

### Docker

**Location:** `infrastructure/docker/`

```
infrastructure/docker/
├── docker-compose.yml          # Main compose file
├── docker-compose.dev.yml      # Development overrides
├── docker-compose.prod.yml     # Production overrides
├── .env.example
└── README.md
```

#### `infrastructure/docker/docker-compose.yml`

```yaml
version: '3.8'

services:
  # API Service
  api:
    build:
      context: ../../services/api
      dockerfile: Dockerfile
    ports:
      - '4000:4000'
    environment:
      - NODE_ENV=production
      - DATABASE_URL=${DATABASE_URL}
      - REDIS_URL=${REDIS_URL}
      - JWT_SECRET=${JWT_SECRET}
      - OPENAI_API_KEY=${OPENAI_API_KEY}
    depends_on:
      - postgres
      - redis
    networks:
      - mindmate-network

  # AI Pipeline Service
  ai-pipeline:
    build:
      context: ../../services/ai-pipeline
      dockerfile: Dockerfile
    ports:
      - '8000:8000'
    environment:
      - OPENAI_API_KEY=${OPENAI_API_KEY}
      - REDIS_URL=${REDIS_URL}
    depends_on:
      - redis
    networks:
      - mindmate-network

  # Scheduler Service
  scheduler:
    build:
      context: ../../services/scheduler
      dockerfile: Dockerfile
    environment:
      - NODE_ENV=production
      - REDIS_URL=${REDIS_URL}
      - DATABASE_URL=${DATABASE_URL}
    depends_on:
      - redis
      - postgres
    networks:
      - mindmate-network

  # PostgreSQL
  postgres:
    image: postgres:16-alpine
    ports:
      - '5432:5432'
    environment:
      - POSTGRES_USER=${POSTGRES_USER}
      - POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
      - POSTGRES_DB=${POSTGRES_DB}
    volumes:
      - postgres-data:/var/lib/postgresql/data
    networks:
      - mindmate-network

  # Redis
  redis:
    image: redis:7-alpine
    ports:
      - '6379:6379'
    volumes:
      - redis-data:/data
    networks:
      - mindmate-network

  # Nginx Reverse Proxy
  nginx:
    image: nginx:alpine
    ports:
      - '80:80'
      - '443:443'
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - ./nginx/ssl:/etc/nginx/ssl:ro
    depends_on:
      - api
      - ai-pipeline
    networks:
      - mindmate-network

volumes:
  postgres-data:
  redis-data:

networks:
  mindmate-network:
    driver: bridge
```

---

### Kubernetes

**Location:** `infrastructure/kubernetes/`

```
infrastructure/kubernetes/
├── base/
│   ├── kustomization.yaml
│   ├── namespace.yaml
│   ├── configmap.yaml
│   └── secrets.yaml
├── api/
│   ├── deployment.yaml
│   ├── service.yaml
│   ├── hpa.yaml
│   └── kustomization.yaml
├── ai-pipeline/
│   ├── deployment.yaml
│   ├── service.yaml
│   ├── hpa.yaml
│   └── kustomization.yaml
├── scheduler/
│   ├── deployment.yaml
│   ├── service.yaml
│   └── kustomization.yaml
├── web/
│   ├── deployment.yaml
│   ├── service.yaml
│   └── kustomization.yaml
├── admin/
│   ├── deployment.yaml
│   ├── service.yaml
│   └── kustomization.yaml
├── ingress/
│   ├── ingress.yaml
│   └── certificate.yaml
├── monitoring/
│   ├── prometheus/
│   ├── grafana/
│   └── loki/
├── overlays/
│   ├── dev/
│   ├── staging/
│   └── production/
└── README.md
```

---

## GitHub Actions

**Location:** `.github/`

```
.github/
├── workflows/
│   ├── ci.yml                  # Main CI workflow
│   ├── cd.yml                  # Deployment workflow
│   ├── mobile-build.yml        # Mobile build workflow
│   ├── security-scan.yml       # Security scanning
│   └── release.yml             # Release workflow
├── pull_request_template.md
└── dependabot.yml
```

#### `.github/workflows/ci.yml`

```yaml
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v3
        with:
          version: 8
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'
      - run: pnpm install
      - run: pnpm lint

  type-check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v3
        with:
          version: 8
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'
      - run: pnpm install
      - run: pnpm type-check

  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v3
        with:
          version: 8
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'
      - run: pnpm install
      - run: pnpm test

  build:
    runs-on: ubuntu-latest
    needs: [lint, type-check, test]
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v3
        with:
          version: 8
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'
      - run: pnpm install
      - run: pnpm build
```

---

## Summary

This monorepo structure provides:

1. **Apps** - Three frontend applications (Mobile, Web, Admin)
2. **Services** - Three backend microservices (API, AI Pipeline, Scheduler)
3. **Packages** - Shared code including types, utils, UI components, and ESLint config
4. **Infrastructure** - Terraform, Docker, and Kubernetes configurations
5. **CI/CD** - GitHub Actions workflows

### Key Technologies

| Category | Technologies |
|----------|-------------|
| Frontend | React Native, Next.js, Tailwind CSS, shadcn/ui |
| Backend | Node.js, Express, FastAPI (Python) |
| Database | PostgreSQL, Prisma |
| Cache | Redis |
| Queue | BullMQ, Celery |
| AI/ML | OpenAI, LangChain, Transformers |
| DevOps | Docker, Kubernetes, Terraform, GitHub Actions |
| Monorepo | PNPM, Turborepo |

### Getting Started

```bash
# Install dependencies
pnpm install

# Start all services in development mode
pnpm dev

# Build all packages
pnpm build

# Run tests
pnpm test

# Run linting
pnpm lint
```
