# Admin Trip Management Dashboard

## For Administrator: Ken

This is a comprehensive admin web interface for managing all trips, bookings, and driver assignments in the Project transportation system.

---

## 🚀 Quick Start

### Option 1: Using PowerShell (Windows)
```powershell
.\scripts\run-admin-dashboard.ps1
```

### Option 2: Using Bash (Linux/Mac)
```bash
chmod +x ./scripts/run-admin-dashboard.sh
./scripts/run-admin-dashboard.sh
```

### Option 3: Manual Start
```bash
cd frontend
npm install
npm run dev -- --port 3000
```

---

## 🌐 Access Points

Once the server is running:

- **Admin Trip Dashboard**: http://localhost:3000/(admin)/trips
- **Login Page**: http://localhost:3000/tenants/admin
- **API Backend**: http://localhost:3001 (must be running separately)

---

## 📊 Dashboard Features

### 1. **Trip Overview**
- View all trips in the system
- Real-time status updates
- Filter by status: All, Pending, Accepted, InProgress, Completed, Cancelled
- Statistics dashboard with trip counts

### 2. **Trip Information Display**
Each trip shows:
- ✅ Trip ID and Booking ID
- ✅ Current status with color coding
- ✅ Assigned driver information
- ✅ Distance traveled (in miles)
- ✅ Trip duration
- ✅ Start and completion timestamps
- ✅ Created and updated timestamps

### 3. **Booking Information**
For each trip, view associated booking:
- Customer ID
- Booking status
- Scheduled pickup time
- Estimated vs actual distance/duration
- Quoted fare vs final fare (in GBP)
- Vehicle ID
- Special notes
- Promotion information

### 4. **Driver Management**
- View driver names and emails
- See all drivers in the system
- Track driver assignments

### 5. **Quick Actions**
- 🔄 **Refresh Data**: Reload all trips and bookings
- 👤 **User Management**: Navigate to user admin page
- 📥 **Export Data**: Download all trip data as JSON
- 📋 **Copy Data**: Copy individual trip details to clipboard

### 6. **Detailed Trip View**
Click "View" on any trip to see:
- Complete trip information
- Full booking details
- Driver information
- Fare calculations
- Timeline of events
- Export trip data as JSON

---

## 🎨 Status Color Coding

- 🟡 **Pending**: Yellow - Trip assigned but not accepted
- 🔵 **Accepted**: Blue - Driver accepted the trip
- 🟣 **InProgress**: Purple - Trip is currently active
- 🟢 **Completed**: Green - Trip finished successfully
- 🔴 **Cancelled**: Red - Trip was cancelled
- ⚪ **Created**: Gray - Booking created but not assigned
- 🟦 **DriverAssigned**: Indigo - Driver assigned to booking
- 🟦 **Confirmed**: Teal - Booking confirmed

---

## 🔐 Authentication

1. **First Time Setup**:
   - Navigate to http://localhost:3000/tenants/admin
   - Use the Bootstrap feature to create a super admin account
   - Required fields:
     - Email
     - Password
     - First Name
     - Last Name

2. **Login**:
   - Email: Your registered admin email
   - Password: Your admin password
   - Token is stored in browser localStorage as `admin_token`

3. **Permissions**:
   - Only Admin and SuperAdmin roles can access the dashboard
   - Driver and Customer roles will be denied access

---

## 📡 API Endpoints Used

The dashboard connects to these backend endpoints:

### Trip Endpoints
- `GET /admin/trips` - List all trips
- `GET /admin/trips?status={status}` - Filter trips by status
- `GET /trips/:tripId` - Get specific trip details

### Booking Endpoints
- `GET /admin/bookings` - List all bookings
- `GET /bookings/:id` - Get specific booking details

### Driver Endpoints
- `GET /admin/drivers` - List all drivers
- `GET /admin/users?role=Driver` - Get driver users

### Authentication
- `POST /admin/bootstrap` - Create initial super admin
- `POST /auth/login` - Admin login

---

## 🛠️ Technical Details

### Technology Stack
- **Framework**: Next.js 14 (React)
- **Styling**: Tailwind CSS
- **API**: RESTful backend (NestJS)
- **Database**: PostgreSQL with TypeORM
- **Real-time**: Socket.io for live updates

### Port Configuration
- **Frontend**: Port 3000 (configurable via PORT env variable)
- **Backend**: Port 3001 (default API URL)

### Environment Variables
Create a `.env.local` file in the frontend directory:

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
PORT=3000
```

---

## 📋 Data Fields Reference

### Trip Entity
```typescript
{
  id: string;              // UUID
  bookingId: string;       // UUID reference
  driverId: string;        // UUID reference
  status: TripStatus;      // Enum
  startedAt: Date | null;
  completedAt: Date | null;
  distanceM: number | null; // Distance in meters
  durationS: number | null; // Duration in seconds
  createdAt: Date;
  updatedAt: Date;
}
```

### Booking Entity
```typescript
{
  id: string;                    // UUID
  customerId: string;            // UUID reference
  assignedDriverId: string | null;
  vehicleId: string | null;
  status: BookingStatus;         // Enum
  scheduledPickupAt: Date | null;
  estimatedDistanceM: number | null;
  estimatedDurationS: number | null;
  quotedFarePence: number | null; // Amount in pence
  finalFarePence: number | null;
  currency: string;               // ISO 4217 (e.g., GBP)
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}
```

---

## 🐛 Troubleshooting

### Dashboard Won't Load
1. Check if backend is running on port 3001
2. Verify admin token in localStorage
3. Check browser console for errors
4. Ensure CORS is configured on backend

### No Trips Showing
1. Verify backend has trip data in database
2. Check authentication token is valid
3. Try refreshing the data
4. Check network tab for failed API calls

### Login Issues
1. Ensure super admin was created via bootstrap
2. Check credentials are correct
3. Verify backend /auth/login endpoint is working
4. Clear localStorage and try again

### Port Already in Use
```bash
# Find process using port 3000
netstat -ano | findstr :3000  # Windows
lsof -ti:3000                 # Mac/Linux

# Kill the process or use a different port
npm run dev -- --port 3005
```

---

## 📞 Support

For technical support or feature requests:
1. Check backend logs in `backend/` directory
2. Review frontend logs in browser console
3. Check API documentation in `docs/API.md`
4. Review deployment guide in `docs/DEPLOYMENT.md`

---

## 🔄 Updates and Maintenance

### Refresh Trip Data
The dashboard automatically loads data on:
- Initial page load
- Status filter change
- Manual refresh button click

### Data Export
- Click "Export Data" to download all trip information
- Format: JSON with nested booking and driver data
- Filename includes timestamp for versioning

### Real-time Updates
The backend uses Socket.io for real-time trip updates. The dashboard will automatically reflect changes when:
- Trip status changes
- Driver accepts/starts/completes trip
- Booking is updated

---

## 🎯 Key Performance Indicators

Monitor these metrics on the dashboard:
1. **Total Trips**: Overall trip count
2. **Completed Trips**: Successfully finished trips
3. **In Progress**: Active trips currently running
4. **Pending Trips**: Trips waiting for driver action

---

## 📱 Responsive Design

The dashboard is fully responsive and works on:
- Desktop computers (optimal)
- Tablets (landscape mode recommended)
- Mobile devices (portrait scrollable tables)

---

**Dashboard Version**: 1.0.0  
**Last Updated**: December 31, 2025  
**Administrator**: Ken
