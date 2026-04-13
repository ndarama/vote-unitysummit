# Vote Backend System

A comprehensive, secure, and fraud-resistant voting system for the Vote Unity Summit application.

## Overview

This voting backend provides a complete solution for managing votes across multiple categories and nominees, with built-in fraud detection, analytics, and administrative controls.

## Features

### Core Voting Features
- ✅ **One vote per category per user** - Database-enforced uniqueness
- ✅ **Email-based authentication** - Secure voter identification
- ✅ **Real-time validation** - Pre-flight checks before voting
- ✅ **Vote status tracking** - Check if user has voted
- ✅ **Comprehensive audit logging** - Track all voting activities

### Security & Fraud Detection
- 🛡️ **IP-based tracking** - Monitor voting patterns by IP address
- 🛡️ **Rapid voting detection** - Identify bot-like behavior
- 🛡️ **Vote spike monitoring** - Detect unusual voting surges
- 🛡️ **Anomaly scoring** - Automatic risk assessment (0-100+ scale)
- 🛡️ **Automatic flagging** - Flag suspicious votes for review
- 🛡️ **Poll locking** - Ability to close voting system-wide

### Analytics & Reporting
- 📊 **Comprehensive statistics** - Total votes, unique voters, trends
- 📊 **Category results** - Vote counts and percentages per nominee
- 📊 **Leaderboard** - Cross-category rankings
- 📊 **Time-based analysis** - Vote velocity and patterns
- 📊 **Fraud pattern detection** - Identify manipulation attempts

### Administrative Controls
- 🔧 **Vote invalidation** - Mark votes as invalid with reason
- 🔧 **Vote restoration** - Restore invalidated votes
- 🔧 **Bulk operations** - Mass invalidation based on criteria
- 🔧 **Permanent deletion** - Remove votes from database
- 🔧 **Flagged vote review** - List suspicious votes
- 🔧 **Role-based access** - Admin and manager roles

## Architecture

### Technology Stack
- **Database**: PostgreSQL (via Prisma ORM)
- **Backend**: Next.js API Routes
- **Authentication**: NextAuth.js
- **Language**: TypeScript

### File Structure

```
services/
  └── voteService.ts         # Core voting business logic

app/api/
  ├── vote/
  │   ├── route.ts           # POST - Submit vote
  │   ├── status/route.ts    # GET - Check vote status
  │   └── validate/route.ts  # POST - Validate vote
  │
  ├── user/votes/
  │   └── route.ts           # GET - User's votes
  │
  └── admin/votes/
      ├── all/route.ts       # GET - All votes (filtered)
      ├── recent/route.ts    # GET - Recent votes
      ├── flagged/route.ts   # GET - Flagged votes
      ├── stats/route.ts     # GET - Vote statistics
      ├── leaderboard/route.ts # GET - Full leaderboard
      ├── results/[categoryId]/route.ts # GET - Category results
      ├── count/[nomineeId]/route.ts # GET - Nominee vote count
      ├── invalidate/route.ts # POST - Invalidate vote
      ├── restore/route.ts    # POST - Restore vote
      ├── delete/route.ts     # DELETE - Delete vote
      └── bulk-invalidate/route.ts # POST - Bulk invalidate

lib/
  └── vote-utils.ts          # Utility functions

docs/
  └── VOTE_API.md           # API documentation
```

## Quick Start

### 1. Submit a Vote

```typescript
const response = await fetch('/api/vote', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    categoryId: 'category-uuid',
    nomineeId: 'nominee-uuid',
  }),
});

const result = await response.json();
// { success: true, vote: { id, categoryId, nomineeId, timestamp } }
```

### 2. Check Vote Status

```typescript
const response = await fetch(`/api/vote/status?categoryId=${categoryId}`);
const { hasVoted } = await response.json();
```

### 3. Get User's Votes

```typescript
const response = await fetch('/api/user/votes');
const votes = await response.json();
```

### 4. Get Vote Statistics (Admin)

```typescript
const response = await fetch('/api/admin/votes/stats');
const stats = await response.json();
// {
//   totalVotes, validVotes, invalidVotes, flaggedVotes,
//   uniqueVoters, votesByCategory, votesByNominee
// }
```

## Fraud Detection Details

### Anomaly Score Calculation

Votes receive an anomaly score based on multiple factors:

| Factor | Points | Severity |
|--------|--------|----------|
| 5-9 votes from same IP | +40 | Medium |
| 10+ votes from same IP | +70 | High |
| Vote within 1s of previous (same IP) | +90 | High |
| Vote within 3s of previous (same IP) | +50 | Medium |
| 50+ votes for nominee in 1 min | +30 | High |
| 20-49 votes for nominee in 1 min | Alert | Medium |

**Flagging Threshold**: Votes with anomaly score > 70 are automatically flagged.

### Audit Logging

All suspicious activities are logged with:
- Timestamp
- Type (duplicate_ip, bot_pattern, spike, manual_action, system)
- Severity (low, medium, high)
- Message
- Metadata (IP, counts, etc.)

## Database Schema

### Vote Model

```prisma
model Vote {
  id                 String   @id @default(uuid())
  email              String
  categoryId         String
  nomineeId          String
  timestamp          BigInt
  ip                 String?
  userAgent          String?
  anomalyScore       Int?     @default(0)
  flagged            Boolean  @default(false)
  invalid            Boolean  @default(false)
  invalidationReason String?
  category           Category @relation(fields: [categoryId], references: [id])
  nominee            Nominee  @relation(fields: [nomineeId], references: [id])

  @@unique([email, categoryId])
}
```

**Key Constraints**:
- `@@unique([email, categoryId])` - Prevents duplicate votes in same category
- Cascade deletion when category or nominee is deleted

## Service Functions

### Voting Operations

```typescript
import { 
  createVote, 
  validateVote,
  hasVoted,
  getUserVotes 
} from '@/services/voteService';

// Submit a vote
const vote = await createVote({
  email: 'user@example.com',
  categoryId: 'cat-id',
  nomineeId: 'nom-id',
  ip: '192.168.1.1',
  userAgent: 'Mozilla/5.0...'
});

// Validate before voting
const validation = await validateVote({
  email: 'user@example.com',
  categoryId: 'cat-id',
  nomineeId: 'nom-id'
});
// { valid: true/false, error?: string }

// Check if voted
const voted = await hasVoted('user@example.com', 'cat-id');
```

### Analytics Operations

```typescript
import { 
  getVoteStats,
  getCategoryResults,
  getLeaderboard 
} from '@/services/voteService';

// Get comprehensive statsconst stats = await getVoteStats();

// Get category results
const results = await getCategoryResults('category-id');

// Get full leaderboard
const leaderboard = await getLeaderboard();
```

### Admin Operations

```typescript
import { 
  invalidateVote,
  restoreVote,
  deleteVote,
  bulkInvalidateVotes 
} from '@/services/voteService';

// Invalidate a vote
await invalidateVote('user@example.com', 'cat-id', 'Duplicate detected');

// Restore invalidated vote
await restoreVote('user@example.com', 'cat-id');

// Delete permanently
await deleteVote('vote-id');

// Bulk invalidate
const count = await bulkInvalidateVotes(
  { ip: '192.168.1.1', minAnomalyScore: 70 },
  'Suspicious IP pattern'
);
```

## Utility Functions

```typescript
import {
  formatVoteTimestamp,
  calculateVotePercentage,
  detectManipulationPatterns,
  generateVoteSummary,
  exportVotesToCSV
} from '@/lib/vote-utils';

// Format timestamp
const formatted = formatVoteTimestamp(Date.now());
// "10. april 2026, kl. 14:30"

// Calculate percentage
const percent = calculateVotePercentage(45, 200);
// 22.5

// Detect manipulation
const patterns = detectManipulationPatterns(votes);
// [{ type: 'rapid_voting', severity: 'high', ... }]

// Generate summary
const summary = generateVoteSummary(votes);
// { total, valid, invalid, flagged, ... }

// Export to CSV
const csv = exportVotesToCSV(votes);
```

## Best Practices

### For Frontend Developers

1. **Always validate before submitting**
   ```typescript
   const validation = await validateVote(data);
   if (!validation.valid) {
     showError(validation.error);
     return;
   }
   await submitVote(data);
   ```

2. **Check vote status before showing vote form**
   ```typescript
   const { hasVoted } = await checkVoteStatus(categoryId);
   if (hasVoted) {
     showAlreadyVotedMessage();
   } else {
     showVoteForm();
   }
   ```

3. **Handle errors gracefully**
   ```typescript
   try {
     await submitVote(data);
   } catch (error) {
     if (error.status === 409) {
       showAlreadyVotedError();
     } else if (error.status === 403) {
       showPollLockedError();
     } else {
       showGenericError();
     }
   }
   ```

### For Admins

1. **Regularly review flagged votes**
   - Check `/api/admin/votes/flagged` daily
   - Investigate high anomaly scores
   - Invalidate confirmed fraudulent votes

2. **Monitor vote statistics**
   - Watch for unusual patterns in `/api/admin/votes/stats`
   - Look for spike patterns
   - Review vote velocity

3. **Use bulk operations carefully**
   - Always specify clear invalidation reasons
   - Test criteria before bulk invalidating
   - Keep audit logs for accountability

4. **Lock poll when needed**
   - Update system config when voting should close
   - Prevents new votes while counting
   - Can be unlocked for vote corrections

## Security Considerations

1. **Rate Limiting**: Consider adding rate limiting at the API gateway level
2. **CAPTCHA**: Can be integrated for additional bot protection
3. **Email Verification**: Ensure emails are verified before allowing votes
4. **IP Anonymization**: IPs are logged but should be treated as sensitive
5. **Audit Logs**: Regularly review for unusual patterns
6. **Database Backups**: Maintain regular backups before bulk operations

## Error Handling

All API endpoints return consistent error responses:

```json
{
  "error": "Error message in Norwegian"
}
```

Common errors:
- `Ikke logget inn` (401) - Not authenticated
- `Mangler data` (400) - Missing required fields
- `Avstemningen er stengt` (403) - Poll is locked
- `Du har allerede stemt i denne kategorien` (409) - Already voted
- `Ugyldig kategori` (400) - Invalid category
- `Stemme ikke funnet` (404) - Vote not found

## Performance Optimization

1. **Database Indexes**: Ensure indexes on:
   - `Vote.email`
   - `Vote.categoryId`
   - `Vote.nomineeId`
   - `Vote.timestamp`
   - `Vote.ip`
   - `Vote.invalid`
   - `Vote.flagged`

2. **Query Optimization**:
   - Use `select` to limit returned fields
   - Use `take` for pagination
   - Use `groupBy` for aggregations

3. **Caching** (optional):
   - Cache category results
   - Cache leaderboard for short periods
   - Invalidate cache on new votes

## Testing

### Unit Tests (Example)

```typescript
import { validateVote, calculateAnomalyScore } from '@/services/voteService';

describe('Vote Validation', () => {
  it('should reject duplicate votes', async () => {
    const result = await validateVote({
      email: 'test@example.com',
      categoryId: 'cat-1',
      nomineeId: 'nom-1'
    });
    expect(result.valid).toBe(false);
    expect(result.error).toContain('allerede stemt');
  });
});

describe('Anomaly Detection', () => {
  it('should flag rapid voting', async () => {
    const result = await calculateAnomalyScore({
      email: 'test@example.com',
      categoryId: 'cat-1',
      nomineeId: 'nom-1',
      ip: '192.168.1.1'
    });
    expect(result.flagged).toBe(true);
    expect(result.anomalyScore).toBeGreaterThan(70);
  });
});
```

## Monitoring & Maintenance

### Key Metrics to Monitor

1. **Vote Volume**
   - Total votes per day
   - Votes per category
   - Unique voters

2. **Fraud Indicators**
   - Flagged vote percentage
   - Average anomaly score
   - Number of invalidations

3. **Performance**
   - API response times
   - Database query performance
   - Error rates

### Regular Maintenance Tasks

- Review and clean up audit logs older than 90 days
- Archive old votes if needed
- Update fraud detection thresholds based on patterns
- Review and optimize database queries

## API Documentation

For complete API documentation, see [VOTE_API.md](./VOTE_API.md)

## Support

For issues or questions:
1. Check the API documentation
2. Review audit logs for specific vote issues
3. Check database constraints and indexes
4. Review this README for best practices

## License

This voting backend is part of the Vote Unity Summit application.
