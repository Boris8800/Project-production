# Admin Users Setup Script

This script creates or updates admin users with secure credentials and rate limiting protection.

## 🔐 Credentials

### Super Admin
- **Email**: admin@Project.com
- **Password**: @::*&gjbBby
- **Role**: SuperAdmin
- **Name**: Admin User

### Ken (Administrator)
- **Email**: ken@Project.com
- **Password**: YuGb78!'g44
- **Role**: Admin
- **Name**: Ken Administrator

## 🛡️ Security Features

### IP-Based Rate Limiting
- **Maximum Attempts**: 10 failed login attempts
- **Block Duration**: 5 minutes
- **Tracking Window**: 15 minutes
- **Automatic Reset**: Cleared on successful login

### Protection Details
1. **Failed Attempt Tracking**: Each failed login is recorded by IP address
2. **Progressive Blocking**: After 10 failed attempts, IP is blocked for 5 minutes
3. **Clear on Success**: Successful login clears the attempt counter
4. **Redis Storage**: All tracking data stored in Redis with automatic expiration
5. **IP Detection**: Supports X-Forwarded-For, X-Real-IP, and direct socket IP

### Block Response
When blocked, API returns:
```json
{
  "statusCode": 429,
  "message": "Too many failed login attempts. Your IP is blocked for 5 minute(s).",
  "error": "Rate Limit Exceeded",
  "blockedUntil": 1735689600000
}
```

## 🚀 Usage

### Run Setup Script

```bash
# From project root
cd backend
node ../scripts/setup-admin-users.js
```

Or with environment variables:
```bash
POSTGRES_HOST=localhost \
POSTGRES_PORT=5432 \
POSTGRES_DB=Project \
POSTGRES_USER=postgres \
POSTGRES_PASSWORD=your_password \
node ../scripts/setup-admin-users.js
```

### Manual Database Setup

If you prefer to run SQL directly:

```sql
-- For admin@Project.com
INSERT INTO users (email, password_hash, first_name, last_name, role, status, created_at, updated_at)
VALUES (
  'admin@Project.com',
  '$2b$12$[bcrypt_hash_of_@::*&gjbBby]',
  'Admin',
  'User',
  'SuperAdmin',
  'Active',
  NOW(),
  NOW()
)
ON CONFLICT (email) DO UPDATE
SET password_hash = EXCLUDED.password_hash,
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    role = EXCLUDED.role,
    status = EXCLUDED.status,
    updated_at = NOW();

-- For ken@Project.com
INSERT INTO users (email, password_hash, first_name, last_name, role, status, created_at, updated_at)
VALUES (
  'ken@Project.com',
  '$2b$12$[bcrypt_hash_of_YuGb78!\'g44]',
  'Ken',
  'Administrator',
  'Admin',
  'Active',
  NOW(),
  NOW()
)
ON CONFLICT (email) DO UPDATE
SET password_hash = EXCLUDED.password_hash,
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    role = EXCLUDED.role,
    status = EXCLUDED.status,
    updated_at = NOW();
```

## 🔄 Testing Rate Limiting

### Test Failed Attempts

```bash
# Try logging in with wrong password 10 times
for i in {1..10}; do
  curl -X POST http://localhost:3001/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"admin@Project.com","password":"wrongpassword"}' \
    -w "\nAttempt $i: %{http_code}\n"
  sleep 1
done

# The 10th attempt should return 429 (Too Many Requests)
```

### Test Successful Login Clears Attempts

```bash
# Make a few failed attempts
for i in {1..3}; do
  curl -X POST http://localhost:3001/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"ken@Project.com","password":"wrongpassword"}'
done

# Now login successfully - this should clear the counter
curl -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"ken@Project.com","password":"YuGb78!'\''g44"}'

# Try wrong password again - counter should be reset
curl -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"ken@Project.com","password":"wrongpassword"}'
```

### Check Redis for Rate Limit Data

```bash
# Connect to Redis CLI
redis-cli

# Check blocked IPs
KEYS ratelimit:blocked:*

# Check attempt counters
KEYS ratelimit:attempts:*

# View specific IP attempts
GET ratelimit:attempts:127.0.0.1

# Check TTL (time to live)
TTL ratelimit:blocked:127.0.0.1
```

## 📊 Rate Limit Configuration

Configuration is in `backend/src/common/guards/rate-limit.guard.ts`:

```typescript
private readonly MAX_ATTEMPTS = 10;              // Max failed attempts
private readonly BLOCK_DURATION_SECONDS = 5 * 60; // 5 minutes block
private readonly ATTEMPT_WINDOW_SECONDS = 15 * 60; // 15 min tracking
```

To modify these values, edit the guard file and restart the backend.

## 🔍 Monitoring

### Check Login Attempts in Logs

The backend will log rate limit events. Check your logs:

```bash
# If using PM2
pm2 logs backend

# If running with npm
# Check terminal output

# Docker logs
docker logs Project-backend
```

### View Blocked IPs

Create an admin endpoint to view blocked IPs:

```bash
curl http://localhost:3001/admin/rate-limit/blocked \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

## 🛠️ Troubleshooting

### Issue: IP Always Shows as 127.0.0.1

**Solution**: Ensure your reverse proxy (nginx) is forwarding the real client IP:

```nginx
proxy_set_header X-Real-IP $remote_addr;
proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
```

### Issue: Rate Limit Not Working

**Checks**:
1. Ensure Redis is running: `redis-cli ping`
2. Check Redis connection in backend logs
3. Verify guard is applied to login route
4. Test with different IPs to confirm IP detection

### Issue: Accidentally Blocked Yourself

**Solution**: Clear the block in Redis:

```bash
redis-cli
DEL ratelimit:blocked:YOUR_IP_ADDRESS
DEL ratelimit:attempts:YOUR_IP_ADDRESS
```

Or wait 5 minutes for automatic expiration.

### Issue: Want to Whitelist an IP

Modify the guard to check against a whitelist:

```typescript
private readonly WHITELIST_IPS = ['192.168.1.100', '10.0.0.1'];

async canActivate(context: ExecutionContext): Promise<boolean> {
  const request = context.switchToHttp().getRequest<Request>();
  const ip = this.getClientIp(request);
  
  // Skip rate limiting for whitelisted IPs
  if (ip && this.WHITELIST_IPS.includes(ip)) {
    return true;
  }
  
  // ... rest of the code
}
```

## 📝 Notes

- Passwords are hashed with bcrypt (12 rounds)
- Rate limiting uses Redis for distributed tracking
- IP detection works with reverse proxies
- All timestamps are in UTC
- Failed attempts are tracked per IP, not per user
- Successful login from any account clears that IP's counter

## 🔒 Security Best Practices

1. **Change Default Passwords**: After first login, change to unique passwords
2. **Use Strong Passwords**: Minimum 12 characters with mixed case, numbers, symbols
3. **Enable 2FA**: Consider adding two-factor authentication
4. **Monitor Logs**: Regularly check for suspicious login attempts
5. **Rotate Passwords**: Change passwords every 90 days
6. **Limit Admin Access**: Only grant admin role to trusted users
7. **Use HTTPS**: Always use SSL/TLS in production

## 📞 Support

For issues or questions about rate limiting:
- Check backend logs for detailed error messages
- Verify Redis is running and accessible
- Review nginx/proxy configuration for IP forwarding
- Test with curl to isolate client-side issues
