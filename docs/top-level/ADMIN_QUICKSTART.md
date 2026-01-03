# Quick Start Guide - Admin Dashboard for Ken

## 🚀 Start the Admin Dashboard

### Windows (PowerShell - Recommended)
```powershell
.\scripts\run-admin-dashboard.ps1
```

### Windows (Command Prompt)
```cmd
scripts\run-admin-dashboard.bat
```

### Linux/Mac
```bash
chmod +x ./scripts/run-admin-dashboard.sh
./scripts/run-admin-dashboard.sh
```

---

## 🌐 Access URLs

Once running, access at:
- **Trip Management**: http://localhost:3000/(admin)/trips
- **Login Page**: http://localhost:3000/tenants/admin

---

## 📝 First Time Setup

1. **Start Backend** (in separate terminal):
   ```bash
   cd backend
   npm install
   npm run start:dev
   ```

2. **Start Admin Dashboard**:
   ```bash
   # Use one of the commands above
   ```

3. **Create Admin Account**:
   - Go to http://localhost:3000/tenants/admin
   - Click "Bootstrap" to create first admin
   - Fill in:
     - Email: ken@Project.com
     - Password: (your secure password)
     - First Name: Ken
     - Last Name: (your last name)

4. **Login**:
   - Use your email and password
   - You'll be redirected to admin area

5. **Access Trip Dashboard**:
   - Navigate to http://localhost:3000/(admin)/trips
   - Or click "Trip Management" in the navigation

---

## 📊 What You Can Do

✅ **View All Trips** - See every trip in the system
✅ **Filter by Status** - Pending, Active, Completed, etc.
✅ **View Details** - Click any trip to see full information
✅ **Monitor Bookings** - See associated booking data
✅ **Track Drivers** - View driver assignments
✅ **Export Data** - Download trip data as JSON
✅ **Real-time Updates** - Dashboard refreshes automatically

---

## 🎯 Key Features

- **Trip Statistics**: Total, Completed, In Progress, Pending
- **Detailed Views**: Full trip and booking information
- **Driver Management**: See all drivers and assignments
- **Quick Actions**: Refresh, Export, Navigate
- **Responsive Design**: Works on desktop, tablet, mobile

---

## 📞 Need Help?

See full documentation: [docs/ADMIN_DASHBOARD.md](docs/ADMIN_DASHBOARD.md)

---

**Port**: 3000 (Frontend) | 3001 (Backend)  
**Admin**: Ken  
**Version**: 1.0.0
