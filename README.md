<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Vote Unity Summit - Voting Application

A comprehensive voting system for Unity Awards 2026 with email OTP verification, fraud detection, and admin management.

## Features

### 🗳️ Voting System
- **OTP Email Verification** - Secure voting with email confirmation
- **Multi-Category Voting** - Support for multiple award categories
- **Fraud Detection** - IP tracking, anomaly scoring, and automatic flagging
- **Admin Dashboard** - Comprehensive vote management and analytics

### 🔐 Security
- **Email OTP Verification** - 6-digit codes sent via email
- **Rate Limiting** - Prevents spam and abuse
- **Single Vote Per Category** - Database-enforced uniqueness
- **Audit Logging** - Complete activity tracking
- **IP & User Agent Tracking** - Fraud prevention

### 📊 Analytics
- **Real-time Statistics** - Vote counts, unique voters, trends
- **Category Results** - Detailed breakdowns per category
- **Leaderboard** - Cross-category rankings
- **Pattern Detection** - Identify suspicious voting patterns

## Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL database
- Email provider (SMTP or Resend)

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Configuration

Create `.env` file:

```env
# Database
DATABASE_URL="postgresql://user:password@host:port/database?sslmode=require"

# Authentication
AUTH_SECRET="your-secret-key"
NEXTAUTH_URL="http://localhost:3000"

# Email (choose one)
# Option 1: SMTP (Gmail, etc.)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_SECURE="false"
SMTP_USER="your-email@gmail.com"
SMTP_PASSWORD="your-app-password"
SMTP_FROM="Unity Awards <noreply@unitysummit.no>"

# Option 2: Resend
RESEND_API_KEY="your-resend-api-key"

# Optional: Gemini AI
GEMINI_API_KEY="your-gemini-api-key"
```

### 3. Database Setup

```bash
# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate dev

# Seed database (optional)
npm run seed
```

### 4. Run Development Server

```bash
npm run dev
```

Visit `http://localhost:3000`

## OTP Voting Flow

### For Voters

1. **Login** - Authenticate with email
2. **Select Nominee** - Choose nominee in a category
3. **Request OTP** - Click vote button
4. **Check Email** - Receive 6-digit code (valid 15 min)
5. **Enter Code** - Submit OTP code
6. **Confirmation** - Vote registered, confirmation email sent

### For Administrators

- **View Statistics** - `/api/admin/votes/stats`
- **Review Flagged Votes** - `/api/admin/votes/flagged`
- **Monitor Pending OTPs** - `/api/admin/votes/pending-otps`
- **Manage Votes** - Invalidate, restore, or delete votes

## API Documentation

### Vote Endpoints

```typescript
// Request OTP for voting
POST /api/vote/request-otp
{
  "categoryId": "uuid",
  "nomineeId": "uuid"
}

// Confirm vote with OTP
POST /api/vote/confirm-otp
{
  "categoryId": "uuid",
  "code": "123456"
}

// Check pending OTP
GET /api/vote/pending-otp?categoryId=uuid

// Cancel pending OTP
POST /api/vote/cancel-otp
{
  "categoryId": "uuid"
}
```

### Admin Endpoints

```typescript
// Get vote statistics
GET /api/admin/votes/stats

// Get all pending OTPs
GET /api/admin/votes/pending-otps

// Cleanup expired OTPs
POST /api/admin/votes/cleanup-otps

// Get flagged votes
GET /api/admin/votes/flagged

// Invalidate vote
POST /api/admin/votes/invalidate

// Restore vote
POST /api/admin/votes/restore
```

## Documentation

- **[OTP Quick Start](docs/OTP_QUICKSTART.md)** - Quick setup guide
- **[OTP System Documentation](docs/VOTE_OTP_SYSTEM.md)** - Complete OTP system guide
- **[Vote API Reference](docs/VOTE_API.md)** - API documentation
- **[Voting Backend Guide](docs/VOTING_BACKEND.md)** - Backend architecture
- **[Implementation Summary](docs/OTP_IMPLEMENTATION_SUMMARY.md)** - Recent changes

## Technology Stack

- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Prisma ORM
- **Database**: PostgreSQL (Neon)
- **Authentication**: NextAuth.js
- **Email**: Resend / SMTP (nodemailer)
- **Deployment**: Vercel-ready

## Project Structure

```
├── app/
│   ├── api/              # API routes
│   │   ├── vote/         # Voting endpoints
│   │   ├── admin/        # Admin endpoints
│   │   └── auth/         # Authentication
│   ├── category/         # Category pages
│   └── components/       # React components
├── services/
│   ├── voteService.ts    # Vote business logic
│   ├── voteOTPService.ts # OTP management
│   └── emailService.ts   # Email sending
├── lib/
│   ├── prisma.ts         # Database client
│   └── vote-utils.ts     # Utility functions
├── prisma/
│   └── schema.prisma     # Database schema
└── docs/                 # Documentation
```

## Database Schema

### Key Models

```prisma
model Vote {
  id                 String   @id @default(uuid())
  email              String
  categoryId         String
  nomineeId          String
  timestamp          BigInt
  ip                 String?
  anomalyScore       Int?
  flagged            Boolean  @default(false)
  invalid            Boolean  @default(false)
  
  @@unique([email, categoryId])
}

model VoteOTP {
  id         String  @id @default(uuid())
  email      String
  categoryId String
  nomineeId  String
  code       String
  expires    BigInt
  verified   Boolean @default(false)
  
  @@unique([email, categoryId])
}
```

## Security Features

- ✅ Email OTP verification required for all votes
- ✅ Rate limiting (1 OTP per 60 seconds)
- ✅ OTP expiration (15 minutes)
- ✅ Single-use OTP codes
- ✅ IP tracking and anomaly detection
- ✅ Automatic fraud flagging
- ✅ Comprehensive audit logging
- ✅ Database-level uniqueness constraints

## Deployment

### Vercel Deployment

1. **Push to GitHub**
2. **Connect to Vercel**
3. **Set Environment Variables** (see `.env` above)
4. **Deploy**

### Database Migration

```bash
# In production
npx prisma migrate deploy
```

### Maintenance Tasks

```bash
# Cleanup expired OTPs (run hourly)
curl -X POST https://your-app.vercel.app/api/admin/votes/cleanup-otps
```

## Development

### Run Tests

```bash
npm test
```

### Lint Code

```bash
npm run lint
```

### Format Code

```bash
npm run format
```

## Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

## Support

- **Documentation**: See `/docs` folder
- **Issues**: GitHub Issues
- **Email**: support@unitysummit.no

## License

Copyright © 2026 Unity Summit Norway

---

## Run Locally (Legacy Instructions)

**Prerequisites:** Node.js

1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key (optional)
3. Run the app:
   `npm run dev`

View your app in AI Studio: https://ai.studio/apps/e1e04037-2f88-4e2c-a43b-c38739edf25c
