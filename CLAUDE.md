# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Scout is an AI-powered coding assistant platform built with Next.js, Drizzle ORM, and TypeScript. The project is a monorepo using pnpm workspaces, with multiple packages handling different concerns: authentication, sandboxing, database operations, agent execution, and more.

## Monorepo Structure

### Core Packages

- **`packages/shared`** - Database schema (Drizzle), migrations, and core database models
- **`packages/daemon`** - Unix socket daemon that orchestrates Agent execution locally on sandboxes
- **`packages/sandbox`** - Sandbox environment abstraction supporting E2B, Docker, and Daytona providers
- **`packages/agent`** - Type definitions and utilities for Agent tool calls and configuration
- **`packages/mcp-server`** - Model Context Protocol server providing tools like SuggestFollowupTask
- **`packages/env`** - Environment variable validation and typing
- **`packages/types`** - Shared TypeScript types (broadcast, sandbox types)
- **`packages/utils`** - Encryption, error handling, and retry utilities
- **`packages/transactional`** - Email template components (React Email)

### Root Application

The main Next.js application resides at `/src` with:
- **App Router** - `src/app/` with layouts for sidebar and no-sidebar routes
- **Server Actions** - `src/server-actions/` for server-side operations (threads, automations, credentials, etc.)
- **Server Lib** - `src/server-lib/` for business logic (thread processing, GitHub integration, credit management)
- **Components** - `src/components/` organized by feature (chat, prompts, admin, settings)
- **Hooks** - `src/hooks/` for custom React hooks
- **Lib** - `src/lib/` for utilities (auth, database, git, GitHub)

## Common Development Commands

```bash
# Install dependencies
pnpm install

# Development server with Turbo
pnpm dev

# Run type checking
pnpm tsc-check

# Run type checking in watch mode
pnpm tsc-watch

# Run linting
pnpm lint

# Run tests across monorepo
pnpm test

# Run tests in watch mode for a specific package
pnpm --filter @scout/agent test -- --watch

# Build for production
pnpm build

# Start production server
pnpm start

# Storybook for component development
pnpm storybook

# Stripe webhook listening (local development)
pnpm dev:stripe

# Cron jobs locally
pnpm dev:cron
```

### Single Test Execution

```bash
# Run a specific test file
pnpm vitest src/lib/auth.test.ts

# Run with UI
pnpm vitest --ui

# Run with coverage
pnpm vitest --coverage
```

## Architecture Patterns

### Thread/Task Processing Flow

1. **Thread Creation** - `src/server-actions/new-thread.ts` creates a thread with user prompt
2. **Daemon Event** - `src/server-lib/handle-daemon-event.ts` receives output from the Agent daemon
3. **Message Processing** - `src/lib/db-message-helpers.ts` converts Agent output to UI messages
4. **Follow-ups** - `src/server-lib/process-follow-up-queue.ts` handles multi-turn interactions

### Database Layer

- **Schema** - `packages/shared/src/db/schema.ts` defines all tables (threads, messages, users, etc.)
- **Queries** - Database queries use Drizzle ORM in `src/lib/db.ts` and throughout server-lib
- **Migrations** - Run with `pnpm drizzle-kit-push-dev` after schema changes

### Authentication & Authorization

- **Auth Setup** - `src/lib/auth-server.ts` and `src/lib/auth-client.ts` using better-auth
- **Sessions** - User sessions stored in database via Drizzle
- **OAuth** - GitHub, Claude, and OpenAI OAuth flows in `src/server-actions/`

### Agent Execution

- **CLI Contract** - `packages/cli-api-contract/` defines messages between CLI and server
- **Agent Types** - `packages/agent/src/types.ts` defines supported agents (Claude, OpenAI, Gemini, Codex)
- **Tool Calls** - `packages/agent/src/tool-calls.ts` defines tool schemas
- **Daemon Communication** - Agent output sent from daemon to `/api/daemon-event`

### Sandboxing

- **Provider Abstraction** - `packages/sandbox/src/provider.ts` abstracts E2B, Docker, Daytona
- **Environment Setup** - MCP config and setup scripts in `packages/sandbox/src/mcp-config.ts`
- **Image Building** - Docker image templates in `packages/sandbox-image/src/render-dockerfile.ts`

## Key Integration Points

### GitHub Integration

- **Webhook Handler** - `src/app/api/webhooks/github/route.ts` processes PR events
- **App Setup** - Create GitHub App at https://github.com/settings/apps (see README.md for details)
- **PR Operations** - Pull request creation and status tracking in `src/server-lib/github.ts`

### Credit System

- **Balance Tracking** - `src/server-lib/credit-balance.ts` manages user credits
- **Auto-reload** - `src/server-lib/credit-auto-reload.ts` handles Stripe top-ups
- **Usage Events** - `packages/shared/src/model/usage-events.ts` tracks API usage

### Automations

- **Storage** - Stored in database via `packages/shared/src/model/automations.ts`
- **Triggers** - GitHub mentions and PR events processed in `src/server-lib/automations.ts`
- **Cron** - Scheduled automations via cron handler in API

## Testing Strategy

- **Vitest** - Default test runner for unit/integration tests
- **E2E Tests** - `src/server-lib/e2e.test.ts` tests thread processing flows
- **Mocking** - Test helpers in `src/test-helpers/` for auth and database setup
- **Database** - Tests use isolated database transactions that rollback

## Environment Configuration

Key environment variables:
- `DATABASE_URL` - PostgreSQL connection (dev: `postgresql://postgres:postgres@localhost:5432/postgres`)
- `E2B_API_KEY` - Sandbox environment provider
- `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET` - GitHub OAuth
- `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` - Stripe integration
- `SLACK_CLIENT_ID`, `SLACK_CLIENT_SECRET`, `SLACK_SIGNING_SECRET` - Slack integration
- `ANTHROPIC_API_KEY`, `OPENAI_API_KEY` - AI model APIs
- `NEXTAUTH_SECRET` - Session encryption secret

See `.env.example` for full list and setup instructions in README.md.

## Git Workflow

- **Main branch** - Production-ready code (primary branch for PRs)
- **Feature branches** - Branch from main with descriptive names
- **Commits** - Use conventional commit format (feat:, fix:, refactor:, etc.)
- **Webhook URLs** - Use ngrok for local GitHub webhook testing

## Performance Considerations

- **React Compiler** - Enabled in `next.config.ts` for automatic optimization
- **Turbo** - Used in dev server for faster builds (`pnpm dev --turbo`)
- **Image Optimization** - Remote images configured for CDN domains
- **Server Actions** - 4MB body size limit for uploads

## Useful File Locations

- **Type Definitions** - `packages/agent/src/types.ts`, `packages/types/src/`
- **UI Components** - `src/components/ui/` (Radix UI primitives)
- **Styles** - `src/app/globals.css` (CSS variables system, Tailwind)
- **Database Types** - `packages/shared/src/db/types.ts`
- **API Routes** - `src/app/api/`
- **Server Actions** - `src/server-actions/` and `src/server-lib/`

## Common Debugging Patterns

1. **Thread Processing** - Check `handle-daemon-event.ts` → `process-queued-thread.ts` → `toUIMessages.ts`
2. **Auth Issues** - Verify `.env` variables and check `auth-server.ts`
3. **Sandbox Failures** - Review provider logs in `packages/sandbox/`
4. **Test Failures** - Run with `--reporter=verbose` flag to see detailed output
5. **Database Issues** - Check migrations with `pnpm drizzle-kit` commands

## Build and Deployment

- **Vercel** - Configured for Next.js deployment (see `vercel.json`)
- **Build Process** - First builds `@scout/bundled` package, then Next.js build
- **Cron Jobs** - Set up via Vercel Functions for automations and scheduled tasks
