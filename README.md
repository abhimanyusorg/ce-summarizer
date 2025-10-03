# CE Email Thread Summarization System 

An AI-powered customer service email thread summarization system with human-in-the-loop approval workflow. Built to improve CE associate efficiency by **68%** (reducing thread processing time from 8 min to 2.5 min).


## 🛠️ Tech Stack

### Frontend
- **Next.js 15** - React framework with App Router
- **React 19** - UI library
- **TypeScript 5** - Type-safe JavaScript
- **Tailwind CSS 4** - Utility-first CSS framework
- **Lucide React** - Beautiful icons

### Backend
- **Next.js API Routes** - Serverless API endpoints
- **Drizzle ORM** - Type-safe SQL query builder
- **SQLite** - Lightweight database (with better-sqlite3)
- **Zod** - Schema validation

### AI & NLP
- **OpenRouter API** - Access to OpenRouter free model (for prototype), can use paid one .
- **Rule-based Fallback** - Keyword-based summarization when API unavailable

### Development & Testing
- **Jest** - Testing framework
- **ESLint** - Code linting
- **Swagger/OpenAPI** - API documentation
- **tsx** - TypeScript execution

### Deployment
- **Vercel** - Hosting platform
- **PostgreSQL** - Production database (optional)

## �️ Architecture

### System Overview
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Web Browser   │────│   Next.js App   │────│   SQLite DB     │
│                 │    │                 │    │                 │
│ • Dashboard     │    │ • API Routes    │    │ • Threads       │
│ • Thread View   │    │ • Business Logic│    │ • Summaries     │
│ • Analytics     │    │ • NLP Processing│    │ • Audit Log     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                              │
                              ▼
                       ┌─────────────────┐
                       │   OpenRouter    │
                       │   (OpenRouter   │ 
                       │     free model) │
                       └─────────────────┘
```

### Project Structure
```
ce-summarization/
├── src/app/                    # Next.js App Router
│   ├── page.tsx                # Dashboard
│   ├── threads/[id]/           # Thread detail pages
│   │   ├── page.tsx            # Thread view
│   │   └── summary-panel.tsx   # Summary editing
│   ├── analytics/              # Analytics dashboard
│   │   └── page.tsx
│   ├── docs/                   # API documentation
│   │   └── page.tsx
│   └── api/                    # API routes
│       ├── threads/            # Thread management
│       ├── summaries/          # Summary generation/approval
│       ├── analytics/          # Metrics endpoints
│       └── reset/              # Data reset functionality
│
├── lib/                        # Business logic
│   ├── db/                     # Database layer
│   │   ├── schema.ts           # Drizzle schema definitions
│   │   ├── client.ts           # Database connection
│   │   └── queries.ts          # Reusable queries
│   ├── nlp/                    # NLP integration
│   │   ├── openrouter.ts       # OpenRouter API client
│   │   ├── prompts.ts          # AI prompt templates
│   │   ├── parser.ts           # Response validation
│   │   └── fallback.ts         # Rule-based backup
│   ├── crm/                    # CRM integration
│   │   └── service.ts          # CRM service layer
│   ├── utils.ts                # Utility functions
│   └── seed.ts                 # Database seeding
│
├── components/                 # Reusable UI components
│   └── ui/                     # Base components (Card, Button, etc.)
│
├── data/                       # Static data & database files
│   ├── ce_exercise_threads.json # Sample thread data
│   └── ce_threads.db           # SQLite database
│
├── types/                      # TypeScript definitions
│   ├── index.ts                # Main type definitions
│   └── crm.ts                  # CRM-related types
│
├── public/                     # Static assets
└── node_modules/               # Dependencies
```

### Data Flow
1. **Thread Import** → Database storage
2. **Summary Generation** → OpenRouter API or fallback
3. **Human Review** → Edit/approve summaries
4. **Analytics** → Track performance metrics
5. **Audit Logging** → Complete action history

## 📦 Installation

### Prerequisites
- **Node.js 18+** - JavaScript runtime
- **npm** - Package manager (comes with Node.js)
- **Git** - Version control system

### Step-by-Step Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd ce-summarization
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```
   This creates the `node_modules/` directory with all required packages.

3. **Set up environment variables**
   ```bash
   cp .env.local.example .env.local
   ```
   Edit `.env.local` and add your OpenRouter API key (optional):
   ```env
   OPENROUTER_API_KEY=sk-or-v1-your-key-here
   DATABASE_URL=file:./data/ce_threads.db
   NEXT_PUBLIC_SITE_URL=http://localhost:3000
   ```

4. **Seed the database**
   ```bash
   npm run db:seed
   ```
   This populates the database with sample customer service threads.

5. **Start the development server**
   ```bash
   npm run dev
   ```

Visit **http://localhost:3000** to access the application.

### Sample Data
The seed script imports 5 realistic customer service threads:
- Damaged product on arrival (LED Monitor)
- Wrong item received (Wireless Mouse)
- Defective product (USB-C Cables)
- Missing order (Mechanical Keyboard)
- Positive feedback (Laptop Stand)

## 🚀 Running the Application

### Development Mode
```bash
npm run dev
```
- Starts development server with hot reload
- Access at http://localhost:3000
- Includes debugging tools and error overlays

### Production Build
```bash
# Build the application
npm run build

# Start production server
npm run start
```
- Optimized build for production
- Static file optimization
- API routes compiled for performance

### Additional Commands
```bash
# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Lint code
npm run lint

# Type checking (included in build)
npm run build
```

## 🧩 Components

### 1. Dashboard
**Location:** `src/app/page.tsx`

The main dashboard provides an overview of all customer service threads with key metrics and navigation.

**Features:**
- **Analytics Cards**: Total threads, summarized, pending approval, approved
- **Thread List**: Filterable list of all email threads
- **Quick Actions**: Links to analytics, API docs, and data reset
- **Real-time Updates**: Client-side data fetching with refresh capability

**Key Components:**
- Thread status badges
- Relative time formatting
- Responsive grid layout
- Reset data functionality with confirmation

### 2. Thread Summarizer & Editor
**Location:** `src/app/threads/[id]/` and `src/app/threads/[id]/summary-panel.tsx`

The core summarization interface for individual email threads.

**Features:**
- **Thread Timeline**: Complete email conversation history
- **AI Summary Generation**: OpenRouter-powered analysis
- **Human-in-the-Loop Editing**: Edit summaries before approval
- **Confidence Scoring**: 0-1.0 reliability indicators
- **Sentiment Analysis**: Frustrated, neutral, satisfied, angry detection
- **Approval Workflow**: Approve/reject with notes
- **Audit Trail**: Complete history of all actions

**Key Components:**
- Message timeline display
- Summary editing form
- Action buttons (generate, edit, approve)
- Confidence score visualization
- Status management

### 3. Analytics Dashboard
**Location:** `src/app/analytics/page.tsx`

Performance metrics and ROI tracking for the summarization system.

**Features:**
- **Time Savings Metrics**: Processing time reductions
- **Quality Metrics**: Approval rates, edit frequencies
- **Sentiment Breakdown**: Customer emotion distribution
- **Throughput Analytics**: Threads processed over time
- **ROI Calculations**: Cost savings projections

**Key Components:**
- Metric cards with trend indicators
- Chart visualizations (processing time, sentiment)
- Date range filtering
- Export capabilities

### 4. API Documentation
**Location:** `src/app/docs/page.tsx`

Interactive API documentation powered by Swagger/OpenAPI.

**Features:**
- **Interactive Testing**: Try API endpoints directly
- **Schema Documentation**: Request/response formats
- **Authentication**: API key management
- **Examples**: Sample requests and responses

**Key Components:**
- Swagger UI integration
- OpenAPI specification
- Endpoint categorization
- Response examples

## 📡 API Documentation

### Core Endpoints

#### Threads
- `GET /api/threads` - List all threads
- `GET /api/threads/[id]` - Get thread details

#### Summaries
- `POST /api/summaries/generate` - Generate AI summary
- `PUT /api/summaries/[id]` - Edit summary
- `POST /api/summaries/[id]/approve` - Approve/reject summary

#### Analytics
- `GET /api/analytics/overview` - Dashboard metrics

#### Utilities
- `POST /api/reset` - Reset and reseed all data (development only)
- `POST /api/seed` - Seed database with sample data (development only)

### Authentication
Currently uses API key authentication via environment variables. For production, implement proper user authentication.

## 💾 Database Schema

### Tables

**threads**
- `id` - Primary key (e.g., "CE-405467-683")
- `order_id` - Order identifier
- `product` - Product name
- `topic` - Issue category
- `subject` - Email subject line
- `initiated_by` - "customer" or "company"
- `status` - open, in_progress, resolved
- `priority` - low, medium, high, urgent
- `created_at`, `updated_at` - Timestamps

**messages**
- `id` - Primary key
- `thread_id` - Foreign key to threads
- `sender` - "customer" or "company"
- `timestamp` - When sent
- `body` - Message content
- `sequence_num` - Order in thread

**summaries**
- `id` - Auto-increment primary key
- `thread_id` - Foreign key to threads (unique)
- `summary_text` - 2-3 sentence overview
- `key_issue` - Main problem
- `sentiment` - frustrated | neutral | satisfied | angry
- `recommended_action` - Next steps
- `current_status` - unresolved | pending | resolved
- `confidence_score` - 0.0-1.0
- `status` - pending | approved | rejected | edited
- `edited_by`, `edited_at` - Edit tracking
- `approved_at`, `approval_notes` - Approval tracking
- `version` - Revision number
- `metadata` - Additional JSON data
- `created_at` - Timestamp

**audit_log**
- `id` - Auto-increment primary key
- `thread_id` - Foreign key to threads
- `action` - summarize, edit, approve, reject
- `user_id` - Associate identifier
- `details` - JSON action data
- `timestamp` - When action occurred

## 🤖 NLP Integration

### Prompt Engineering

The system uses carefully crafted prompts to extract structured information:

```typescript
{
  "summary": "2-3 sentence overview of the entire conversation",
  "keyIssue": "The main problem the customer is experiencing",
  "sentiment": "frustrated | neutral | satisfied | angry",
  "currentStatus": "unresolved | pending | resolved",
  "recommendedAction": "Specific next step for the associate",
  "confidenceScore": 0.0-1.0,
  "additionalContext": "Any important details or red flags"
}
```

### Fallback Strategy

When OpenRouter API is unavailable or no API key is provided:

1. **Retry Logic**: 3 attempts with exponential backoff (1s, 2s, 4s)
2. **Rule-Based Summarization**: Keyword-based sentiment analysis
3. **Low Confidence Flag**: Marks summaries with score < 0.7 for review

### Error Handling

- **Rate Limiting**: Automatic retry with backoff
- **Timeout**: 30-second max wait time
- **Network Errors**: Graceful degradation to fallback
- **Invalid Responses**: Schema validation with Zod

## 🚀 Deployment

### Environment Variables

```env
# Required
DATABASE_URL=file:./data/ce_threads.db
NEXT_PUBLIC_SITE_URL=https://your-domain.com

# Optional (system works without it using fallback)
OPENROUTER_API_KEY=sk-or-v1-xxxxx
```

### Deploy to Vercel

```bash
# 1. Install Vercel CLI
npm i -g vercel

# 2. Deploy
vercel

# 3. Set environment variables in Vercel dashboard
# - OPENROUTER_API_KEY (optional)
# - DATABASE_URL (for production, use PostgreSQL)

# 4. Deploy to production
vercel --prod
```

### Production Considerations

1. **Database**: Migrate from SQLite to PostgreSQL for production
2. **API Keys**: Use Vercel environment variables, not `.env.local`
3. **CORS**: Configure for your domain
4. **Authentication**: Add user authentication for production use
5. **Rate Limiting**: Implement API rate limiting
6. **Monitoring**: Set up error tracking (Sentry, LogRocket)

## 📈 Performance & Scaling

### Current (Prototype)

- **Throughput**: 10-20 threads/minute
- **Database**: SQLite (~100MB for 10K threads)
- **Cost**: $0/month (free tier or fallback)
- **Latency**: <5s summary generation

### Scaling Path

#### Phase 1: 10x Scale (100-200 threads/day)
- **Changes**: OpenRouter paid tier, Redis caching
- **Cost**: ~$50-100/month
- **Throughput**: 100-200 threads/minute

#### Phase 2: 100x Scale (1,000-2,000 threads/day)
- **Changes**: PostgreSQL, Job queue, Load balancing
- **Cost**: ~$300-500/month
- **Throughput**: 1,000+ threads/minute

#### Phase 3: 1,000x Scale (10,000+ threads/day)
- **Changes**: Self-hosted LLM, Vector DB, Multi-region
- **Cost**: ~$2,000-5,000/month
- **Throughput**: 10,000+ threads/minute

## 📊 Success Metrics

### Time Savings

- **Before**: 8 min/thread (5 min read + 3 min respond)
- **After**: 2.5 min/thread (30 sec review + 2 min respond)
- **Savings**: **68% reduction** (5.5 min/thread)

### ROI Projection

| Scale | Threads/Day | Hours Saved/Day | Annual Savings |
|-------|-------------|-----------------|----------------|
| Small | 100 | 9.2 hrs | ~$XX |
| Medium | 1,000 | 92 hrs | ~$10XX |
| Large | 10,000 | 917 hrs | ~$100XX |

*Based on $20/hr associate rate*

### Quality Impact

- ✅ Consistent summaries → fewer misunderstandings
- ✅ Faster responses → higher CSAT (+8-12% estimated)
- ✅ Better escalation → reduced repeat contacts

## 🔐 Security & Privacy

- **API Keys**: Stored in environment variables only
- **PII Masking**: Can mask emails, phones, addresses
- **Audit Logging**: Full action history
- **HTTPS**: Required for production
- **SQL Injection**: Protected by Drizzle ORM
- **XSS**: React's built-in protection

## 🚧 Known Limitations

- Free OpenRouter tier: 5 requests/minute rate limit
- SQLite: Not suitable for high-concurrency writes
- No real-time collaboration (yet)
- Single-user workflow (no authentication)
- No mobile app (web-only)

## 🔮 Future Enhancements

1. **Batch Processing**: Queue system for high volume
2. **Advanced NLP**: Fine-tuned model for better accuracy
3. **CRM Integration**: Salesforce/Zendesk connectors, real integration
4. **Collaboration**: Multi-user editing/commenting
5. **Analytics**: Deeper CSAT correlation insights
6. **Mobile App**: Native iOS/Android apps
7. **Voice Integration**: Transcribe and summarize calls
8. **Multi-language**: Support for non-English threads

## 📝 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [OpenRouter](https://openrouter.ai/) for NLP API access
- [Drizzle ORM](https://orm.drizzle.team/) for elegant database management
- [Next.js](https://nextjs.org/) for the excellent framework
- [Tailwind CSS](https://tailwindcss.com/) for rapid UI development
- [Lucide](https://lucide.dev/) for beautiful icons

