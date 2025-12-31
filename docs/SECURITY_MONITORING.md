# 🔒 Security Monitoring System - Complete Guide

## Overview

The Security Monitoring System provides real-time visibility into login attempts, user activity, and IP blocking capabilities to protect your application from brute force attacks and unauthorized access.

---

## 🌐 Access the Security Dashboard

**URL**: http://localhost:3000/(admin)/security

**Login Required**:
- Email: `admin@Project.com` or `ken@Project.com`
- Must have Admin or SuperAdmin role

---

## 📊 Features

### 1. **Real-Time Statistics**

Monitor security metrics at a glance:
- **Total Login Attempts** - All login attempts in the last 7 days
- **Successful Logins** - Successful authentication count
- **Failed Attempts** - Failed login count (potential attacks)
- **Unique IPs** - Number of different IP addresses
- **Online Now** - Currently active users (last 15 minutes)

### 2. **Online/Offline User Status**

See who is currently using the system:
- ✅ **Online Users** - Active in the last 15 minutes
- 📊 **User Cards** - Display name, email, role, and last seen time
- 🔄 **Auto-Refresh** - Updates every 10 seconds

**How it works**:
- Users are considered "online" if they logged in within the last 15 minutes
- `lastLoginAt` timestamp is updated on each successful login
- Green indicator shows active users

### 3. **Login Attempt Tracking**

Every login attempt is logged with:
- ✅/✗ **Status** - Success or Failed
- 📧 **Email** - User attempting to login
- 🌐 **IP Address** - Source IP
- ⏰ **Timestamp** - When the attempt occurred
- 🖥️ **User Agent** - Browser/device information

**Use Cases**:
- Identify suspicious login patterns
- Track failed attempts from specific IPs
- Monitor brute force attack attempts
- Audit successful logins

### 4. **Manual IP Blocking**

Block malicious IP addresses manually:

**Block Options**:
- **IP Address** - The IP to block (e.g., 192.168.1.100)
- **Reason** - Why the IP is being blocked
- **Duration**:
  - 30 minutes
  - 1 hour
  - 2 hours
  - 6 hours
  - 24 hours
  - 7 days

**Quick Block Button**:
- Click "Block This IP" next to failed login attempts
- Auto-fills IP and reason
- One-click protection

### 5. **Blocked IP Management**

View and manage all blocked IPs:
- 🚫 **IP Address** - The blocked IP
- 📝 **Reason** - Why it was blocked
- ⏰ **Blocked At** - When the block started
- ⏳ **Expires** - When the block will end
- 🔧 **Type** - Manual (admin) or Auto (rate limiter)
- ✅ **Unblock** - Remove the block immediately

---

## 🔧 How to Use

### View Real-Time Activity

1. Navigate to http://localhost:3000/(admin)/security
2. Dashboard loads automatically
3. Enable "Auto-refresh" for live updates
4. Click "🔄 Refresh Now" for manual refresh

### Monitor Login Attempts

1. Scroll to "Recent Login Attempts" section
2. Look for patterns of failed attempts
3. Check IP addresses and timestamps
4. Identify suspicious activity

### Block an IP Address

**Method 1: Manual Entry**
```
1. Enter IP address in the "Block IP Address" section
2. Add a reason (optional)
3. Select duration
4. Click "🔒 Block IP"
```

**Method 2: Quick Block from Failed Attempt**
```
1. Find failed login attempt in the table
2. Click "Block This IP" button
3. IP and reason auto-filled
4. Adjust duration if needed
5. Click "🔒 Block IP"
```

### Unblock an IP Address

```
1. Find the IP in "Blocked IP Addresses" table
2. Click "Unblock" button
3. Confirm action
4. IP is immediately unblocked
```

### Check Who's Online

```
1. View "Online Users" section at top
2. See name, email, role, last seen
3. Green indicator = currently active
4. Time shows "Xs ago", "Xm ago", etc.
```

---

## 📡 API Endpoints

### Get Login Attempts
```http
GET /security/login-attempts?limit=50
Authorization: Bearer {admin-token}
```

### Get Login Statistics
```http
GET /security/login-attempts/stats?days=7
Authorization: Bearer {admin-token}
```

### Get Blocked IPs
```http
GET /security/blocked-ips
Authorization: Bearer {admin-token}
```

### Get Online Users
```http
GET /security/online-users
Authorization: Bearer {admin-token}
```

### Block IP
```http
POST /security/block-ip
Authorization: Bearer {admin-token}
Content-Type: application/json

{
  "ip": "192.168.1.100",
  "reason": "Multiple failed login attempts",
  "duration": 60
}
```

### Unblock IP
```http
DELETE /security/block-ip/{ip}
Authorization: Bearer {admin-token}
```

---

## 🔍 Detecting Brute Force Attacks

### Warning Signs

1. **Multiple Failed Attempts**
   - Same IP, different emails
   - Same email, multiple IPs
   - Rapid succession (seconds apart)

2. **Suspicious Patterns**
   - Attempts outside business hours
   - Unusual user agents
   - Sequential IP addresses

3. **High Volume**
   - More than 5 failed attempts in 1 minute
   - More than 20 attempts in 1 hour
   - More than 50 attempts in 1 day

### Response Actions

**Immediate**:
1. Block the offending IP manually
2. Set block duration based on severity
3. Monitor for additional attempts from new IPs

**Investigation**:
1. Check all attempts from that IP
2. Look for targeted accounts
3. Review user agent patterns
4. Check if legitimate user might be locked out

**Prevention**:
1. The automatic rate limiter blocks after 10 failed attempts
2. Use manual blocks for persistent threats
3. Consider longer block durations for repeat offenders

---

## 💾 Data Storage

### Login Attempts
- **Storage**: Redis
- **Retention**: 7 days
- **Keys**: `login:attempt:YYYY-MM-DD:{id}`

### Blocked IPs
- **Storage**: Redis
- **Retention**: Until expiration or manual removal
- **Keys**: 
  - `ratelimit:blocked:{ip}` - Rate limiter
  - `manual:blocked:ips` - Manual blocks list

### Online Users
- **Storage**: PostgreSQL (users table)
- **Field**: `lastLoginAt` timestamp
- **Threshold**: 15 minutes

---

## 🎯 Best Practices

### Regular Monitoring

1. **Daily Review**
   - Check failed attempts each day
   - Look for patterns
   - Review blocked IPs

2. **Weekly Analysis**
   - Review 7-day statistics
   - Identify trends
   - Adjust security policies

### Block Management

1. **Use Appropriate Durations**
   - 30 min - 1 hour: Testing/mistakes
   - 2-6 hours: Minor attacks
   - 24 hours: Persistent attacks
   - 7 days: Serious threats

2. **Document Reasons**
   - Always provide clear reason
   - Include detection method
   - Note severity level

### Response Procedures

1. **Low Severity** (< 10 attempts)
   - Monitor only
   - No immediate action needed

2. **Medium Severity** (10-50 attempts)
   - Block IP for 1-6 hours
   - Monitor for new IPs
   - Document in logs

3. **High Severity** (> 50 attempts)
   - Block IP for 24 hours - 7 days
   - Check for distributed attack
   - Consider reporting to abuse contacts

---

## 🔔 Alerts and Notifications

### Manual Monitoring Points

Check these regularly:
- Failed attempts > 10 from single IP
- Failed attempts > 50 in 24 hours
- New IPs with immediate failed attempts
- Blocked IPs trying to reconnect

### Future Enhancements

Consider implementing:
- Email alerts for suspicious activity
- Webhook notifications
- Slack/Discord integration
- Automated IP reputation checking

---

## 🛠️ Troubleshooting

### No Data Showing

**Check**:
1. Backend is running
2. Redis is running
3. Admin token is valid
4. Login attempts have occurred

**Solution**:
```bash
# Check Redis
redis-cli ping

# Check backend logs
cd backend
npm run start:dev

# Try logging in to generate data
```

### Auto-Refresh Not Working

**Check**:
1. "Auto-refresh" checkbox is enabled
2. No browser errors in console
3. Network connectivity

**Solution**:
- Disable and re-enable auto-refresh
- Click "Refresh Now" manually
- Check browser console for errors

### Can't Block IP

**Check**:
1. IP address format is correct
2. Admin token is valid
3. Backend is running

**Solution**:
```bash
# Valid IP formats
192.168.1.100
10.0.0.1
172.16.0.1

# Invalid formats
192.168.1 (incomplete)
192.168.1.256 (invalid range)
```

### Online Users Not Updating

**Check**:
1. Users have logged in recently (< 15 minutes)
2. Database `lastLoginAt` is being updated
3. Time sync on server

**Solution**:
- Have a user log in
- Check database: `SELECT email, last_login_at FROM users;`
- Verify system time is correct

---

## 📊 Example Scenarios

### Scenario 1: Brute Force Detection

**What You See**:
```
IP: 203.0.113.100
Failed Attempts: 15
Timespan: 2 minutes
Emails: admin@*, ken@*, test@*
```

**Action**:
1. Click "Block This IP" on any failed attempt
2. Set duration: 24 hours
3. Reason: "Brute force attack - 15 failed attempts in 2 minutes"
4. Click "🔒 Block IP"
5. Monitor for additional IPs from same attacker

### Scenario 2: Legitimate User Lockout

**What You See**:
```
User: john@company.com
IP: 192.168.1.50
Failed Attempts: 3
Last: 10 minutes ago
```

**Action**:
1. Contact user to verify
2. User confirms forgot password
3. Unblock IP if currently blocked
4. Provide password reset link
5. Monitor for additional attempts

### Scenario 3: Distributed Attack

**What You See**:
```
Multiple IPs (10+)
All failed attempts
Same target: admin@Project.com
Different countries
```

**Action**:
1. Block each offending IP (24 hours)
2. Consider blocking entire IP ranges if needed
3. Enable additional rate limiting
4. Report to hosting provider
5. Consider adding captcha

---

## 🔐 Security Recommendations

### Immediate Actions

1. ✅ Enable auto-refresh on security dashboard
2. ✅ Check security page daily
3. ✅ Block IPs with > 10 failed attempts
4. ✅ Review blocked IPs weekly
5. ✅ Document all security incidents

### Long-term Improvements

1. **Implement Email Alerts**
   - Notify on suspicious activity
   - Alert on IP blocks
   - Summary reports

2. **Add Geo-blocking**
   - Block countries not in your user base
   - Allow whitelisting for travel

3. **Enhance Logging**
   - Store longer history
   - Add more metadata
   - Export capabilities

4. **User Notifications**
   - Alert users of failed login attempts
   - Notify on successful login from new IP
   - 2FA implementation

---

## 📞 Support

For security incidents or questions:
1. Review this documentation
2. Check backend logs: `backend/logs/`
3. Check Redis data: `redis-cli KEYS security:*`
4. Review network logs
5. Contact system administrator

---

**🔒 Stay Secure! Monitor Regularly!**

**Last Updated**: December 31, 2025  
**Version**: 1.0.0
