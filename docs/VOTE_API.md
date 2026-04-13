# Vote API Documentation

This document describes all the voting-related API endpoints in the Vote Unity Summit application.

## Table of Contents

- [Public Endpoints](#public-endpoints)
- [User Endpoints](#user-endpoints)
- [Admin Endpoints](#admin-endpoints)
- [Data Models](#data-models)

---

## Public Endpoints

### POST /api/vote

Submit a vote for a nominee in a specific category.

**Authentication:** Required (email-based session)

**Request Body:**
```json
{
  "categoryId": "string",
  "nomineeId": "string"
}
```

**Response:**
```json
{
  "success": true,
  "vote": {
    "id": "string",
    "categoryId": "string",
    "nomineeId": "string",
    "timestamp": "number"
  }
}
```

**Error Responses:**
- `401`: Not authenticated
- `400`: Missing data or validation failed
- `403`: Poll is locked
- `409`: Already voted in this category

**Features:**
- Automatic fraud detection (IP tracking, rapid voting detection)
- Vote spike monitoring
- Anomaly scoring and flagging
- Audit logging

---

### GET /api/vote/status

Check if the current user has voted in a specific category.

**Authentication:** Required

**Query Parameters:**
- `categoryId` (required): Category ID to check

**Response:**
```json
{
  "hasVoted": true
}
```

---

### POST /api/vote/validate

Validate a vote before submission (pre-flight check).

**Authentication:** Required

**Request Body:**
```json
{
  "categoryId": "string",
  "nomineeId": "string"
}
```

**Response:**
```json
{
  "valid": true,
  "error": "string (optional)",
  "anomalyScore": "number (optional)",
  "flagged": "boolean (optional)"
}
```

---

## User Endpoints

### GET /api/user/votes

Get all votes submitted by the current user.

**Authentication:** Required

**Response:**
```json
[
  {
    "id": "string",
    "email": "string",
    "categoryId": "string",
    "nomineeId": "string",
    "timestamp": "number",
    "invalid": "boolean",
    "category": {
      "id": "string",
      "title": "string"
    },
    "nominee": {
      "id": "string",
      "name": "string",
      "title": "string",
      "imageUrl": "string"
    }
  }
]
```

---

## Admin Endpoints

### GET /api/admin/votes/all

Get all votes with optional filtering.

**Authentication:** Required (admin or manager role)

**Query Parameters:**
- `categoryId`: Filter by category ID
- `nomineeId`: Filter by nominee ID
- `email`: Filter by voter email
- `flagged`: Filter flagged votes (true/false)
- `invalid`: Filter invalid votes (true/false)

**Response:**
```json
[
  {
    "id": "string",
    "email": "string",
    "categoryId": "string",
    "nomineeId": "string",
    "timestamp": "number",
    "ip": "string",
    "userAgent": "string",
    "anomalyScore": "number",
    "flagged": "boolean",
    "invalid": "boolean",
    "invalidationReason": "string",
    "category": {
      "id": "string",
      "title": "string"
    },
    "nominee": {
      "id": "string",
      "name": "string",
      "title": "string"
    }
  }
]
```

---

### GET /api/admin/votes/recent

Get the most recent votes.

**Authentication:** Required (admin or manager role)

**Query Parameters:**
- `limit`: Number of votes to return (default: 50)

**Response:** Same as `/api/admin/votes/all`

---

### GET /api/admin/votes/flagged

Get all flagged votes (votes with high anomaly scores).

**Authentication:** Required (admin or manager role)

**Response:** Same as `/api/admin/votes/all`

---

### GET /api/admin/votes/stats

Get comprehensive voting statistics.

**Authentication:** Required (admin or manager role)

**Response:**
```json
{
  "totalVotes": "number",
  "validVotes": "number",
  "invalidVotes": "number",
  "flaggedVotes": "number",
  "uniqueVoters": "number",
  "votesByCategory": [
    {
      "categoryId": "string",
      "categoryTitle": "string",
      "totalVotes": "number"
    }
  ],
  "votesByNominee": [
    {
      "nomineeId": "string",
      "nomineeName": "string",
      "categoryId": "string",
      "votes": "number"
    }
  ]
}
```

---

### GET /api/admin/votes/results/[categoryId]

Get results for a specific category (vote counts per nominee).

**Authentication:** Required (admin or manager role)

**Response:**
```json
{
  "categoryId": "string",
  "categoryTitle": "string",
  "totalVotes": "number",
  "nominees": [
    {
      "id": "string",
      "name": "string",
      "title": "string",
      "imageUrl": "string",
      "votes": "number",
      "percentage": "number"
    }
  ]
}
```

---

### GET /api/admin/votes/leaderboard

Get comprehensive leaderboard across all categories.

**Authentication:** Required (admin or manager role)

**Response:**
```json
[
  {
    "categoryId": "string",
    "categoryTitle": "string",
    "description": "string",
    "totalVotes": "number",
    "nominees": [
      {
        "id": "string",
        "name": "string",
        "title": "string",
        "imageUrl": "string",
        "categoryId": "string",
        "categoryTitle": "string",
        "votes": "number"
      }
    ]
  }
]
```

---

### GET /api/admin/votes/count/[nomineeId]

Get vote count for a specific nominee.

**Authentication:** Required (admin or manager role)

**Response:**
```json
{
  "nomineeId": "string",
  "count": "number"
}
```

---

### POST /api/admin/votes/invalidate

Invalidate a specific vote.

**Authentication:** Required (admin role only)

**Request Body:**
```json
{
  "email": "string",
  "categoryId": "string",
  "reason": "string"
}
```

**Response:**
```json
{
  "success": true
}
```

---

### POST /api/admin/votes/restore

Restore a previously invalidated vote.

**Authentication:** Required (admin role only)

**Request Body:**
```json
{
  "email": "string",
  "categoryId": "string"
}
```

**Response:**
```json
{
  "success": true
}
```

---

### DELETE /api/admin/votes/delete

Permanently delete a vote.

**Authentication:** Required (admin role only)

**Query Parameters:**
- `voteId`: ID of the vote to delete

**Response:**
```json
{
  "success": true
}
```

---

### POST /api/admin/votes/bulk-invalidate

Invalidate multiple votes based on criteria.

**Authentication:** Required (admin role only)

**Request Body:**
```json
{
  "criteria": {
    "ip": "string (optional)",
    "email": "string (optional)",
    "nomineeId": "string (optional)",
    "minAnomalyScore": "number (optional)"
  },
  "reason": "string"
}
```

**Response:**
```json
{
  "success": true,
  "count": "number"
}
```

---

## Data Models

### Vote
```typescript
interface Vote {
  id: string;
  email: string;
  categoryId: string;
  nomineeId: string;
  timestamp: number;
  ip?: string;
  userAgent?: string;
  anomalyScore?: number;
  flagged?: boolean;
  invalid?: boolean;
  invalidationReason?: string;
}
```

### VoteInput
```typescript
interface VoteInput {
  email: string;
  categoryId: string;
  nomineeId: string;
  ip?: string;
  userAgent?: string;
}
```

### VoteValidationResult
```typescript
interface VoteValidationResult {
  valid: boolean;
  error?: string;
  anomalyScore?: number;
  flagged?: boolean;
}
```

---

## Fraud Detection

The voting system implements several fraud detection mechanisms:

### 1. IP-based Detection
- Tracks number of votes from the same IP address
- Flags IPs with more than 5 votes (medium severity)
- Flags IPs with more than 10 votes (high severity)

### 2. Rapid Voting Detection
- Detects votes submitted within 1 second from the same IP (high severity, +90 anomaly score)
- Detects votes submitted within 3 seconds from the same IP (medium severity, +50 anomaly score)

### 3. Spike Detection
- Monitors vote spikes for specific nominees
- Alerts when a nominee receives more than 20 votes in one minute
- High alert for more than 50 votes in one minute

### 4. Anomaly Scoring
- Each vote receives an anomaly score (0-100+)
- Votes with score > 70 are automatically flagged
- Flagged votes remain valid but are highlighted for admin review

### 5. Audit Logging
- All suspicious activities are logged
- Admins can review audit logs for patterns
- Manual actions (invalidations, restorations) are logged

---## Best Practices

1. **Always validate before voting**: Use `/api/vote/validate` to pre-check if a vote is allowed
2. **Check vote status**: Use `/api/vote/status` to determine if user has already voted
3. **Monitor flagged votes**: Regularly review `/api/admin/votes/flagged` for suspicious activity
4. **Use bulk operations**: For mass invalidations, use `/api/admin/votes/bulk-invalidate`
5. **Review statistics**: Monitor `/api/admin/votes/stats` for voting patterns

---

## Security Features

- Email-based authentication required for all endpoints
- Role-based access control (admin vs manager)
- IP tracking and user agent logging
- Automatic fraud detection and flagging
- Comprehensive audit logging
- Poll locking capability
- One vote per category per user (enforced at DB level)

---

## Error Handling

All endpoints return consistent error responses:

```json
{
  "error": "Error message in Norwegian"
}
```

Common HTTP status codes:
- `200`: Success
- `400`: Bad request (missing or invalid data)
- `401`: Unauthorized (not logged in)
- `403`: Forbidden (insufficient permissions or poll locked)
- `404`: Not found
- `409`: Conflict (already voted)
- `500`: Internal server error
