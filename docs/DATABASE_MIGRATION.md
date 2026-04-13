# Database Migration Guide - VoteOTP Model

This guide will help you migrate your database to add the VoteOTP model for email verification.

## Migration Overview

**What's being added:**
- New `VoteOTP` table for storing pending votes with OTP codes
- Indexes for optimal performance
- Unique constraints to prevent duplicate OTP requests

## Prerequisites

- PostgreSQL database running
- Database connection configured in `.env`
- Prisma CLI installed (`npm install prisma --save-dev`)

## Migration Steps

### Step 1: Verify Current Schema

Check your current Prisma schema includes the VoteOTP model:

```bash
# View schema
cat prisma/schema.prisma | grep -A 15 "model VoteOTP"
```

You should see:
```prisma
model VoteOTP {
  id         String @id @default(uuid())
  email      String
  categoryId String
  nomineeId  String
  code       String
  expires    BigInt
  ip         String?
  userAgent  String?
  createdAt  BigInt
  verified   Boolean @default(false)

  @@unique([email, categoryId])
  @@index([email])
  @@index([expires])
}
```

### Step 2: Generate Prisma Client

```bash
npx prisma generate
```

This updates the Prisma Client with the new VoteOTP model.

### Step 3: Create Migration

#### Development Environment

```bash
npx prisma migrate dev --name add-vote-otp-model
```

This will:
1. Generate SQL migration file
2. Apply migration to database
3. Regenerate Prisma Client

#### Production Environment

```bash
# Generate migration (without applying)
npx prisma migrate dev --create-only --name add-vote-otp-model

# Review the generated SQL in prisma/migrations/

# Apply migration
npx prisma migrate deploy
```

### Step 4: Verify Migration

```bash
# Check migration status
npx prisma migrate status

# View database
npx prisma studio
```

## Generated SQL

The migration will create this table:

```sql
-- CreateTable
CREATE TABLE "VoteOTP" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "nomineeId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "expires" BIGINT NOT NULL,
    "ip" TEXT,
    "userAgent" TEXT,
    "createdAt" BIGINT NOT NULL,
    "verified" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "VoteOTP_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "VoteOTP_email_idx" ON "VoteOTP"("email");

-- CreateIndex
CREATE INDEX "VoteOTP_expires_idx" ON "VoteOTP"("expires");

-- CreateIndex
CREATE UNIQUE INDEX "VoteOTP_email_categoryId_key" ON "VoteOTP"("email", "categoryId");
```

## Manual Migration (if needed)

If automatic migration fails, you can run the SQL manually:

### Connect to Database

```bash
# Using psql
psql $DATABASE_URL

# Or using Prisma Studio
npx prisma studio
```

### Run SQL

```sql
-- Create VoteOTP table
CREATE TABLE IF NOT EXISTS "VoteOTP" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "nomineeId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "expires" BIGINT NOT NULL,
    "ip" TEXT,
    "userAgent" TEXT,
    "createdAt" BIGINT NOT NULL,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "VoteOTP_pkey" PRIMARY KEY ("id")
);

-- Create indexes
CREATE INDEX IF NOT EXISTS "VoteOTP_email_idx" ON "VoteOTP"("email");
CREATE INDEX IF NOT EXISTS "VoteOTP_expires_idx" ON "VoteOTP"("expires");
CREATE UNIQUE INDEX IF NOT EXISTS "VoteOTP_email_categoryId_key" 
  ON "VoteOTP"("email", "categoryId");
```

## Verification Checklist

After migration, verify:

- [ ] `VoteOTP` table exists
- [ ] Table has all required columns
- [ ] Indexes are created (email, expires)
- [ ] Unique constraint exists (email + categoryId)
- [ ] Prisma Client regenerated
- [ ] No migration errors in logs

## Testing

### Test 1: Create VoteOTP

```typescript
import { prisma } from '@/lib/prisma';

const testOTP = await prisma.voteOTP.create({
  data: {
    email: 'test@example.com',
    categoryId: 'test-cat-id',
    nomineeId: 'test-nom-id',
    code: '123456',
    expires: BigInt(Date.now() + 15 * 60 * 1000),
    createdAt: BigInt(Date.now()),
    verified: false,
  },
});

console.log('Test OTP created:', testOTP);
```

### Test 2: Unique Constraint

```typescript
// This should fail (duplicate email + categoryId)
try {
  await prisma.voteOTP.create({
    data: {
      email: 'test@example.com',
      categoryId: 'test-cat-id', // Same as above
      nomineeId: 'different-nom-id',
      code: '654321',
      expires: BigInt(Date.now() + 15 * 60 * 1000),
      createdAt: BigInt(Date.now()),
    },
  });
} catch (error) {
  console.log('✓ Unique constraint working:', error.code); // P2002
}
```

### Test 3: Cleanup

```typescript
// Delete test data
await prisma.voteOTP.deleteMany({
  where: { email: 'test@example.com' },
});
```

## Rollback (if needed)

If you need to rollback the migration:

### Development

```bash
# Rollback last migration
npx prisma migrate reset

# This will:
# 1. Drop database
# 2. Create database
# 3. Apply all migrations except the last one
```

### Production

```bash
# Manual rollback (connect to DB and run)
DROP TABLE IF EXISTS "VoteOTP";
```

Then update your Prisma schema to remove the VoteOTP model and run:

```bash
npx prisma generate
```

## Troubleshooting

### Error: Database connection failed

**Solution:**
```bash
# Verify DATABASE_URL
echo $DATABASE_URL

# Test connection
npx prisma db pull
```

### Error: Migration already applied

**Solution:**
```bash
# Mark migration as applied
npx prisma migrate resolve --applied "MIGRATION_NAME"
```

### Error: Unique constraint violation

**Solution:**
```sql
-- Clear existing data
DELETE FROM "VoteOTP";
```

### Error: Prisma Client out of sync

**Solution:**
```bash
# Regenerate client
npx prisma generate
```

## Post-Migration Tasks

1. **Update Environment**
   - Configure email provider (SMTP or Resend)
   - Test email sending

2. **Test OTP Flow**
   - Request OTP via API
   - Verify email received
   - Confirm vote with OTP

3. **Setup Cleanup Job**
   ```bash
   # Add to cron or task scheduler
   curl -X POST https://your-app.com/api/admin/votes/cleanup-otps
   ```

4. **Monitor Performance**
   - Check query performance on VoteOTP table
   - Verify indexes are being used
   - Monitor database size

## Database Maintenance

### Regular Cleanup

```sql
-- Delete expired OTPs (older than 1 hour)
DELETE FROM "VoteOTP" 
WHERE "expires" < EXTRACT(EPOCH FROM NOW()) * 1000 - 3600000;
```

### Performance Monitoring

```sql
-- Check table size
SELECT 
  pg_size_pretty(pg_total_relation_size('"VoteOTP"')) as total_size;

-- Check row count
SELECT COUNT(*) FROM "VoteOTP";

-- Check index usage
SELECT 
  schemaname,
  tablename,
  indexname,
  idx_scan
FROM pg_stat_user_indexes
WHERE tablename = 'VoteOTP';
```

## Next Steps

After successful migration:

1. ✅ Test OTP request endpoint
2. ✅ Test OTP verification endpoint
3. ✅ Configure email provider
4. ✅ Update frontend to use OTP flow
5. ✅ Setup cleanup cron job
6. ✅ Monitor OTP usage

## Support

If you encounter issues:

1. Check migration logs: `prisma/migrations/`
2. Review Prisma documentation: https://www.prisma.io/docs
3. Check database logs
4. Verify schema.prisma syntax
5. Test database connection

---

**Migration Date:** April 10, 2026  
**Migration Name:** `add-vote-otp-model`  
**Status:** ✅ Ready to Apply
