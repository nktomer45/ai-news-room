# AI Newsroom CMS Backend

A production-ready backend for an AI-powered newsroom CMS.

## Tech Stack
- **Node.js & Express**: API Framework
- **MongoDB & Mongoose**: Database
- **Redis & BullMQ**: Queue & Background Jobs
- **OpenAI**: AI Article Generation
- **News API**: Trend Fetching
- **Node-cron**: Scheduling

## Getting Started

### Prerequisites
- Docker & Docker Compose
- OpenAI API Key
- News API Key (Optional, fallback provided)

### Environment Setup
Create a `.env` file in the root directory (already provided as a template):
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/ainewsroom
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
OPENAI_API_KEY=your_openai_api_key
NEWS_API_KEY=your_news_api_key
```

### Running with Docker (Recommended)
```bash
docker-compose up --build
```

### Running Locally
1. Ensure MongoDB and Redis are running on your machine.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the server:
   ```bash
   npm run dev
   ```

## API Endpoints

### Articles
- `GET /api/articles`: Fetch all articles (can filter by `status` or `category`).
- `GET /api/articles/stats`: Get counts of all, draft, published, and review articles.
- `GET /api/articles/:id`: Fetch a single article.
- `POST /api/articles`: Manually create an article.
- `PUT /api/articles/:id`: Update an article (supports status: `draft`, `published`, `review`).
- `DELETE /api/articles/:id`: Delete an article.
- `PATCH /api/articles/:id/publish`: Change status to 'published'.
- `PATCH /api/articles/:id/draft`: Change status to 'draft'.

### System
- `GET /health`: Monitor server and dependency status (MongoDB, Redis).

## Features
- **Trend Fetching**: Automatically fetches top headlines every hour using `node-cron`.
- **AI Generation**: Processes article generation in the background using `BullMQ`.
- **Duplicate Prevention**: Checks for existing topics in the database before generating new articles.
- **Flexible Workflow**: Supports both manual review and automatic publishing.
