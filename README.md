# Red Cross Training Platform

A modern interactive t3. Set up environment variables:
   ```bash
   cp .env.example .env.local
   ```
   Fill in the required values in `.env.local`, including Supabase credentials and API keys.

> **Tip:** Use [dotenv-safe](https://www.npmjs.com/package/dotenv-safe) to automatically validate required environment variables and prevent deployment with missing configs.

4. Initialize the database:
   ```bash
   pnpm db:push
   ```

> **Warning:** Always backup your database before running migrations in production. Use `pg_dump` or Supabase's backup features to prevent data loss.ion for Red Cross volunteers and staff, featuring spaced repetition flashcards, AI-powered learning assistance, multiplayer quiz modes, and intelligent chat interface.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![TypeScript](https://img.shields.io/badge/typescript-5.2.2-blue.svg)
![Next.js](https://img.shields.io/badge/next.js-15.0-black.svg)
![Tailwind CSS](https://img.shields.io/badge/tailwind-4.0-38bdf8.svg)
![tRPC](https://img.shields.io/badge/tRPC-10.45.0-2596be.svg)

## 🌟 Features

- **Adaptive Flashcard Learning**: Spaced repetition system (SRS) with customizable study schedules
- **AI-Powered Assistance**: Intelligent chat interface with context-aware responses
- **Multiplayer Quiz Modes**: Competitive and collaborative learning sessions
- **Responsive Design**: Optimized for desktop and mobile devices
- **User Authentication**: Secure login system with OTP verification
- **Real-Time Communication**: Live chat and voice options during multiplayer sessions
- **Modern Tech Stack**: Built with Next.js, tRPC, Tailwind CSS, and Supabase

## 📋 Table of Contents

- [Installation](#-installation)
- [Development](#-development)
- [Project Structure](#-project-structure)
- [Technology Stack](#-technology-stack)
- [Authentication](#-authentication)
- [Database Schema](#-database-schema)
- [API Architecture](#-api-architecture)
- [Deployment](#-deployment)
- [License](#-license)

## 🚀 Installation

### Prerequisites

- [Node.js](https://nodejs.org/) (v18.x or higher)
- [pnpm](https://pnpm.io/) (v10.5.2 or higher)
- [PostgreSQL](https://www.postgresql.org/) (via Supabase or local)

### Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/cr-hackathon-secours.git
   cd cr-hackathon-secours
   ```

2. Install dependencies:
   ```bash
   pnpm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env.local
   ```
   Fill in the required values in `.env.local`, including Supabase credentials and API keys.

> **Warning:** Never commit `.env.local` to version control. Ensure it’s listed in `.gitignore` and avoid exposing it in CI/CD logs.

> **Tip:** Use [dotenv-safe](https://www.npmjs.com/package/dotenv-safe) or [direnv](https://direnv.net/) to automatically manage and validate required environment variables.

> **Caution:** Whenever you introduce new environment variables, update `.env.example` so that all contributors and automations remain in sync.

4. Initialize the database:
   ```bash
   pnpm db:push
   ```

5. Start the development server:
   ```bash
   pnpm dev
   ```

## 💻 Development

### Key Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start development server |
| `pnpm build` | Build for production |
| `pnpm start` | Start production server |
| `pnpm check` | Run Biome linting |
| `pnpm check:write` | Fix linting issues automatically |
| `pnpm typecheck` | Run TypeScript type checking |
| `pnpm db:push` | Apply schema changes to database |
| `pnpm db:studio` | Open Drizzle Studio for database management |

### Code Style

We follow TypeScript best practices and use Biome for code formatting and linting:

- Use PascalCase for React components
- Use camelCase for variables, functions, and object keys
- Prefer `async/await` for asynchronous code
- Follow Next.js App Router conventions for routing and data fetching

> **Tip:** Run `pnpm check` before committing to ensure your code follows our style guide. Configure your editor's Biome extension for real-time formatting.

## 📂 Project Structure

```
/
├── app/                    # Next.js App Router pages and layouts
│   ├── api/                # API routes (auth, chat streaming)
│   ├── auth/               # Authentication pages
│   ├── chat/               # Chat interface
│   ├── dashboard/          # User dashboard
│   ├── flashcards/         # Flashcard study, creation, management
│   ├── game/               # Solo game modes
│   └── multiplayer/        # Multiplayer game modes
├── drizzle/                # Database migrations
├── public/                 # Static assets
├── src/
│   ├── components/         # Reusable UI components
│   ├── hooks/              # Custom React hooks
│   ├── lib/                # Utility functions
│   ├── server/             # Server-side code
│   │   ├── api/            # tRPC API routers
│   │   └── db/             # Database schema and connection
│   ├── stores/             # Global state management
│   ├── styles/             # Global styles
│   └── trpc/               # tRPC client configuration
└── package.json            # Project dependencies and scripts
```

## 🔧 Technology Stack

### Frontend
- **Next.js** (v15.x): React framework with App Router for server components
- **Tailwind CSS** (v4.0): Utility-first CSS framework
- **Shadcn/UI**: Component library built on Radix UI primitives
- **TanStack Query**: Data fetching and caching
- **Zustand**: State management for client-side UI state

### Backend
- **tRPC**: End-to-end typesafe APIs
- **Drizzle ORM**: Type-safe SQL query builder
- **Supabase**: Backend-as-a-Service for PostgreSQL, Authentication, and Realtime
- **Mistral AI**: AI integration for chat and flashcard generation

### DevOps
- **Biome**: Modern linting and formatting
- **TypeScript**: Static type checking
- **pnpm**: Fast, disk-efficient package manager

## 🔐 Authentication

We use Supabase Auth with the following features:

- **Email/Password** authentication with secure password hashing
- **OTP Verification** for email validation
- **Route Protection** via middleware for authenticated routes
- **Session Management** with automatic token refreshing

## 🗄️ Database Schema

### Core Tables
- **User Management**:
  - `user`: Profile with email and authentication details
  - `user_preference`: JSON settings for application preferences

- **Flashcards**:
  - `flashcard_deck`: Collections of cards with owner, name, description
  - `flashcard`: Card data with SRS fields (repetitions, ease_factor, interval)
  - `study_stat`: Learning metrics (streaks, counts, dates)

- **Chat**:
  - `chat_session`: Conversation containers with user and title
  - `chat_message`: Individual messages with role, content, metrics
  - `feedback`: User ratings and comments on responses

- **Multiplayer**:
  - `game_lobby`: Session management with join code and host
  - `game_player`: Participant tracking with scores
  - `game_round`: Question sequences with timing
  - `game_answer`: Player responses with timing and scoring

### Database Diagram

![Database Schema Diagram](public/db.svg)

## 🌐 API Architecture

We use tRPC for end-to-end typesafe APIs:

- **Routers**: Modular API routers for different features
- **Procedures**: Type-safe procedures with Zod input validation
- **Middleware**: Authentication checks and error handling
- **Context**: Request context with session information

Key routers:
- `user.ts`: User profiles and preferences
- `flashcard.ts`: Flashcard CRUD and study algorithms
- `chat.ts`: Chat sessions and message handling
- `ai.ts`: AI model integration for chat and flashcards

## 🚢 Deployment

### Production Setup

> **Warning:** Always run security audits before deployment using `pnpm audit` and ensure all dependencies are up to date.

1. Build the application:
   ```bash
   pnpm build
   ```

> **Tip:** Use [PM2](https://pm2.keymetrics.io/) for process management and zero-downtime deployments:
```bash
# Install PM2 globally if not already installed
npm install -g pm2
# Start the production server with PM2
pm2 start npm --name cr-hackathon-secours -- start
# Save the process list and configure startup scripts
pm2 save
pm2 startup
```

2. Start the production server:
   ```bash
   pnpm start
   ```

> **Caution:** Configure proper logging and monitoring before going live. Use PM2's monitoring features or integrate with services like Sentry for error tracking.

### Environment Configuration

Ensure these environment variables are set in production:

```
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
DATABASE_URL=your-database-url
MISTRAL_API_KEY=your-mistral-api-key
```

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

## 🚧 Current Status

The platform is in active development with the following status:

- **Core Database**: ✅ Completed (100%)
- **Backend API**: ✅ Mostly complete (90%)
- **Frontend Components**: ✅ Mostly complete (80%)
- **Multiplayer Features**: ⏳ UI complete, backend pending (50%)
- **Mobile Optimization**: ✅ Significantly improved

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Run `pnpm check` and `pnpm typecheck` to ensure code quality
4. Commit your changes (`git commit -m 'Add some amazing feature'`)
5. Push to the branch (`git push origin feature/amazing-feature`)
6. Open a Pull Request