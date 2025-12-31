# 🔐 QUICK REFERENCE - Admin Security

## 👥 USER CREDENTIALS

```
┌──────────────────────────────────────────────────┐
│ ADMIN ACCOUNT (SuperAdmin)                      │
├──────────────────────────────────────────────────┤
│ Email:    admin@Project.com                    │
│ Password: @::*&gjbBby                            │
│ Role:     SuperAdmin                             │
│ Name:     Admin User                             │
└──────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────┐
│ KEN'S ACCOUNT (Admin)                            │
├──────────────────────────────────────────────────┤
│ Email:    ken@Project.com                        │
│ Password: YuGb78!'g44                            │
│ Role:     Admin                                  │
│ Name:     Ken Administrator                      │
└──────────────────────────────────────────────────┘
```

## 🛡️ RATE LIMIT RULES

```
┌─────────────────────────────────────────┐
│ Maximum Failed Attempts:      10        │
│ Block Duration:               5 min     │
│ Tracking Window:              15 min    │
│ Auto-Clear on Success:        Yes       │
│ Storage:                      Redis     │
└─────────────────────────────────────────┘
```

## 🚀 QUICK SETUP

```bash
# Create users
.\scripts\setup-admins.ps1

# Or manually
cd backend
node ../scripts/setup-admin-users.js
```

## 🔍 QUICK COMMANDS

```bash
# Test login
curl -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@Project.com","password":"@::*&gjbBby"}'

# Check Redis blocks
redis-cli KEYS ratelimit:blocked:*

# Check attempts
redis-cli KEYS ratelimit:attempts:*

# Clear IP block
redis-cli DEL ratelimit:blocked:YOUR_IP
```

## 📱 ACCESS DASHBOARD

```
Login:     http://localhost:3000/tenants/admin
Dashboard: http://localhost:3000/(admin)/trips
```

## 📝 FILES REFERENCE

- **Rate Limit Guard**: `backend/src/common/guards/rate-limit.guard.ts`
- **Setup Script**: `scripts/setup-admin-users.js`
- **Full Docs**: `docs/ADMIN_USERS_SETUP.md`
- **Summary**: `SECURITY_SUMMARY.md`

---
**Keep this reference handy! 📌**
