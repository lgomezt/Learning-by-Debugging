# Teaching the Agent

In this scenario, students engage in pair programming with an agent that intentionally makes mistakes or exhibits misconceptions. By withholding the correct code, the agent forces the student to guide the solution, encouraging intellectual effort rather than passive consumption

🏗️ Architecture

```
├── frontend/          # React + TypeScript + Vite + Tailwind
│   └── src/
│       ├── components/    # UI components (IDE, Problem Selection, etc.)
│       ├── context/       # React Context state
│       └── utils/         # API utilities and helpers
│
├── backend/           # Python + FastAPI + Google Gemini/OpenAI
│   └── app/
│       ├── routers/       # API routes
│       ├── utils/         # Agent tools and problem parsing
│       └── models.py      # Database models
│
└── problems/          # Markdown problem definitions
```

Key Design Decision: Problem definitions are stored as Markdown files with frontmatter metadata. Users can upload new problems through the UI, which are parsed and stored in the database.

🚀 Getting Started

Quick Start with Docker (Recommended)

The easiest way to run the application is using Docker Compose. This ensures consistent environments across different machines and eliminates setup issues - no need to install Python, Node.js, PostgreSQL, or manage dependencies manually!

Prerequisites

- Docker and Docker Compose installed
- Google Gemini API Key (Get one [here](https://ai.google.dev/)) or OpenAI API Key
- Auth0 account and application (for authentication)

Steps

1. Clone the repository (if you haven't already)

```bash
git clone https://github.com/lgomezt/Learning-by-Debugging.git
cd Learning-by-Debugging
```

2. Set up environment variables

Create a `.env` file in the project root:

```bash
# Database Configuration
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your_secure_password
POSTGRES_DB=teaching_agent

# AI API Key 
GEMINI_API_KEY=your_gemini_api_key_here

# CORS Configuration (for production)
# CORS_ORIGINS=http://localhost:5173,http://localhost:5174
```

Create a `frontend/.env.development` file for frontend configuration:

```bash
# Backend API URL
VITE_API_URL=http://localhost:8000/api

# Auth0 Configuration
VITE_AUTH0_DOMAIN=your_auth0_domain.auth0.com
VITE_AUTH0_CLIENT_ID=your_auth0_client_id
VITE_AUTH0_AUDIENCE=your_auth0_audience
```

3. Set up Google Cloud credentials (for local development)

Place your `credentials.json` file in the `backend/` directory. This is required if you're using Google Cloud services in development, or can be skipped if using only API keys.

4. Build and start the containers

From the project root, for local development:

```bash
docker-compose -f docker-compose.dev.yml up --build
```

**Note**: For local development, you only need `docker-compose.dev.yml`. The production `docker-compose.yml` is for deployment and includes cloud-sql-proxy which isn't needed locally.

The first time this runs, it will:

- Build the backend Docker image (Python 3.11 + dependencies)
- Build the frontend Docker image (Node.js + React build)
- Start PostgreSQL database
- Start both frontend and backend services
- Run database migrations automatically

5. Access the application

- Frontend: http://localhost:5173 (dev mode with hot reload)
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs
- Adminer (database UI): http://localhost:8080
- PostgreSQL: localhost:5432

Docker Commands (Development)

- Start services: `docker-compose -f docker-compose.dev.yml up`
- Start in background: `docker-compose -f docker-compose.dev.yml up -d`
- Stop services: `docker-compose -f docker-compose.dev.yml down`
- View logs: `docker-compose -f docker-compose.dev.yml logs -f`
- View logs for specific service: `docker-compose -f docker-compose.dev.yml logs -f backend` or `docker-compose -f docker-compose.dev.yml logs -f frontend`
- Rebuild after changes: `docker-compose -f docker-compose.dev.yml up --build`
- Restart a service: `docker-compose -f docker-compose.dev.yml restart backend` or `docker-compose -f docker-compose.dev.yml restart frontend`
- Remove containers and volumes: `docker-compose -f docker-compose.dev.yml down -v`

Development Mode (with Hot Reload)

For development with automatic code reloading (changes to code will automatically refresh):

```bash
docker-compose -f docker-compose.dev.yml up --build
```

**Note**: The dev compose file is self-contained for local development. It includes a local PostgreSQL database, hot reloading, and all necessary services without the production-specific cloud-sql-proxy service.

This enables:

- Hot reloading for both backend (Python) and frontend (React/Vite)
- Volume mounting for live code changes (edit files locally, see changes immediately)
- Faster iteration during development

In development mode:

- Backend runs with `--reload` flag (auto-restarts on Python file changes)
- Frontend runs Vite dev server (instant HMR for React components)
- Both services watch for file changes automatically
- Frontend is available at http://localhost:5173
- Python debugger port is exposed at 5678

Production Mode

For production deployment, use the standard `docker-compose.yml`:

```bash
docker-compose up -d --build
```

This runs:

- Backend as a production FastAPI server with Gunicorn
- Frontend as a static build served by Nginx
- Uses Cloud SQL Proxy for database connections (configure `DB_INSTANCE_CONNECTION_NAME`)

See `DEPLOYMENT.md` for detailed production deployment instructions.

🛠️ Tech Stack

Frontend:
- React 19 + TypeScript
- Vite
- Tailwind CSS
- Framer Motion
- Monaco Editor (code editor)
- React Markdown
- Auth0 Authentication
- React Router

Backend:
- FastAPI
- Google Gemini API / OpenAI API
- PostgreSQL (via SQLAlchemy)
- Alembic (database migrations)
- Python 3.11+

Features

- Interactive IDE with code editor
- AI-powered coding assistant (Gemini/OpenAI)
- Problem management system
- User authentication via Auth0
- Code evaluation and feedback
- Problem upload and parsing from Markdown
- Real-time chat interface with AI agent

📝 Environment Variables Reference

### Backend (.env)

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `POSTGRES_USER` | Yes | Database username | `postgres` |
| `POSTGRES_PASSWORD` | Yes | Database password | `secure-password` |
| `POSTGRES_DB` | Yes | Database name | `teaching_agent` |
| `DB_HOST` | No | Database host (defaults to `db` in dev) | `db` or `cloud-sql-proxy` |
| `DB_PORT` | No | Database port (defaults to `5432`) | `5432` |
| `GEMINI_API_KEY` | Yes* | Google Gemini API key | `...` |
| `OPENAI_API_KEY` | Yes* | OpenAI API key | `...` |
| `CORS_ORIGINS` | Recommended | Comma-separated allowed origins | `http://localhost:5173` |

\* At least one AI API key is required (Gemini or OpenAI)

### Frontend (frontend/.env.development)

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `VITE_API_URL` | Yes | Backend API URL | `http://localhost:8000/api` |
| `VITE_AUTH0_DOMAIN` | Yes | Auth0 domain | `app.auth0.com` |
| `VITE_AUTH0_CLIENT_ID` | Yes | Auth0 client ID | `...` |
| `VITE_AUTH0_AUDIENCE` | Yes | Auth0 audience | `...` |

📄 License

MIT License - See LICENSE for details.
