'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface Trip {
  id: string;
  bookingId: string;
  driverId: string;
  status: string;
  startedAt: string | null;
  completedAt: string | null;
  distanceM: number | null;
  durationS: number | null;
  createdAt: string;
  updatedAt: string;
}

interface Booking {
  id: string;
  bookingNumber?: string | null;
  customerId: string;
  assignedDriverId: string | null;
  vehicleId: string | null;
  status: string;
  scheduledPickupAt: string | null;
  estimatedDistanceM: number | null;
  estimatedDurationS: number | null;
  quotedFarePence: number | null;
  finalFarePence: number | null;
  currency: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

interface User {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  role: string;
}

export default function AdminTripsPage() {
  const router = useRouter();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [drivers, setDrivers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<string>('all');
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);

  useEffect(() => {
    loadData();
  }, [filter]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');
      
      const token = localStorage.getItem('admin_token');
      if (!token) {
        router.push('/tenants/admin');
        return;
      }

      // Fetch trips
      const tripUrl = filter === 'all' 
        ? '/admin/trips' 
        : `/admin/trips?status=${filter}`;
      
      const tripsRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}${tripUrl}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!tripsRes.ok) throw new Error('Failed to load trips');
      const tripsData = await tripsRes.json();
      setTrips(tripsData);

      // Fetch bookings
      const bookingsRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/admin/bookings`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!bookingsRes.ok) throw new Error('Failed to load bookings');
      const bookingsData = await bookingsRes.json();
      setBookings(bookingsData);

      // Fetch drivers
      const driversRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/admin/drivers`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!driversRes.ok) throw new Error('Failed to load drivers');
      const driversData = await driversRes.json();
      setDrivers(driversData);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const getBookingForTrip = (tripId: string, bookingId: string) => {
    return bookings.find(b => b.id === bookingId);
  };

  const getDriverName = (driverId: string) => {
    const driver = drivers.find(d => d.id === driverId);
    if (!driver) return driverId;
    return driver.firstName && driver.lastName 
      ? `${driver.firstName} ${driver.lastName}`
      : driver.email;
  };

  const formatDistance = (meters: number | null) => {
    if (!meters) return 'N/A';
    const miles = meters / 1609.34;
    return `${miles.toFixed(2)} mi`;
  };

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return 'N/A';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
  };

  const formatCurrency = (pence: number | null, currency: string = 'GBP') => {
    if (pence === null) return 'N/A';
    const amount = pence / 100;
    return new Intl.NumberFormat('en-GB', { style: 'currency', currency }).format(amount);
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleString('en-GB', {
      dateStyle: 'medium',
      timeStyle: 'short'
    });
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'Pending': 'bg-yellow-500',
      'Accepted': 'bg-blue-500',
      'InProgress': 'bg-purple-500',
      'Completed': 'bg-green-500',
      'Cancelled': 'bg-red-500',
      'Created': 'bg-gray-500',
      'DriverAssigned': 'bg-indigo-500',
      'Confirmed': 'bg-teal-500',
    };
    return colors[status] || 'bg-gray-400';
  };

  const viewTripDetails = (trip: Trip) => {
    setSelectedTrip(trip);
    const booking = getBookingForTrip(trip.id, trip.bookingId);
    setSelectedBooking(booking || null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-white text-2xl font-bold">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="inline-flex items-center gap-2 bg-primary/20 px-6 py-2 rounded-full mb-6">
            <span className="text-[11px] font-black text-primary tracking-[0.2em] uppercase">Admin Panel</span>
          </div>
          <h1 className="text-5xl md:text-6xl font-black text-white mb-4 leading-[0.9] tracking-tighter">
            Trip Management
            <br />
            <span className="text-primary italic font-display">Dashboard for Ken</span>
          </h1>
          <p className="text-slate-300 text-lg md:text-xl font-medium max-w-3xl mx-auto leading-relaxed">
            Monitor and manage all trips, bookings, and driver assignments in real-time.
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/20 border border-red-500 rounded-2xl text-white">
            {error}
          </div>
        )}

        {/* Filter Tabs */}
        <div className="mb-6 flex flex-wrap gap-3 justify-center">
          {['all', 'Pending', 'Accepted', 'InProgress', 'Completed', 'Cancelled'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-6 py-3 rounded-full font-bold uppercase text-xs tracking-wider transition-all ${
                filter === f
                  ? 'bg-primary text-white shadow-xl shadow-primary/30'
                  : 'bg-white/10 text-white hover:bg-white/20'
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-6 border border-white/20">
            <div className="text-4xl font-black text-white mb-2">{trips.length}</div>
            <div className="text-sm font-bold text-slate-300 uppercase tracking-wider">Total Trips</div>
          </div>
          <div className="bg-green-500/20 backdrop-blur-xl rounded-3xl p-6 border border-green-500/30">
            <div className="text-4xl font-black text-white mb-2">
              {trips.filter(t => t.status === 'Completed').length}
            </div>
            <div className="text-sm font-bold text-slate-300 uppercase tracking-wider">Completed</div>
          </div>
          <div className="bg-blue-500/20 backdrop-blur-xl rounded-3xl p-6 border border-blue-500/30">
            <div className="text-4xl font-black text-white mb-2">
              {trips.filter(t => t.status === 'InProgress').length}
            </div>
            <div className="text-sm font-bold text-slate-300 uppercase tracking-wider">In Progress</div>
          </div>
          <div className="bg-yellow-500/20 backdrop-blur-xl rounded-3xl p-6 border border-yellow-500/30">
            <div className="text-4xl font-black text-white mb-2">
              {trips.filter(t => t.status === 'Pending').length}
            </div>
            <div className="text-sm font-bold text-slate-300 uppercase tracking-wider">Pending</div>
          </div>
        </div>

        {/* Trips Table */}
        <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-6 border border-white/20 overflow-x-auto">
          <h2 className="text-2xl font-black text-white mb-6">All Trips</h2>
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/20">
                <th className="text-left py-3 px-4 text-xs font-black text-slate-300 uppercase tracking-wider">Trip ID</th>
                <th className="text-left py-3 px-4 text-xs font-black text-slate-300 uppercase tracking-wider">Status</th>
                <th className="text-left py-3 px-4 text-xs font-black text-slate-300 uppercase tracking-wider">Driver</th>
                <th className="text-left py-3 px-4 text-xs font-black text-slate-300 uppercase tracking-wider">Distance</th>
                <th className="text-left py-3 px-4 text-xs font-black text-slate-300 uppercase tracking-wider">Duration</th>
                <th className="text-left py-3 px-4 text-xs font-black text-slate-300 uppercase tracking-wider">Started</th>
                <th className="text-left py-3 px-4 text-xs font-black text-slate-300 uppercase tracking-wider">Completed</th>
                <th className="text-left py-3 px-4 text-xs font-black text-slate-300 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {trips.map((trip) => (
                <tr key={trip.id} className="border-b border-white/10 hover:bg-white/5 transition-colors">
                  <td className="py-4 px-4">
                    <div className="text-white font-mono text-xs">{trip.id.slice(0, 8)}</div>
                    <div className="text-slate-400 font-mono text-xs">Booking: {trip.bookingId.slice(0, 8)}</div>
                  </td>
                  <td className="py-4 px-4">
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold text-white ${getStatusColor(trip.status)}`}>
                      {trip.status}
                    </span>
                  </td>
                  <td className="py-4 px-4 text-white text-sm">{getDriverName(trip.driverId)}</td>
                  <td className="py-4 px-4 text-white text-sm font-mono">{formatDistance(trip.distanceM)}</td>
                  <td className="py-4 px-4 text-white text-sm font-mono">{formatDuration(trip.durationS)}</td>
                  <td className="py-4 px-4 text-slate-300 text-xs">{formatDate(trip.startedAt)}</td>
                  <td className="py-4 px-4 text-slate-300 text-xs">{formatDate(trip.completedAt)}</td>
                  <td className="py-4 px-4">
                    <button
                      onClick={() => viewTripDetails(trip)}
                      className="px-4 py-2 bg-primary hover:bg-primary-dark rounded-xl text-white text-xs font-bold uppercase tracking-wider transition-all"
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {trips.length === 0 && (
            <div className="text-center py-12 text-slate-400">No trips found</div>
          )}
        </div>

        {/* Trip Details Modal */}
        {selectedTrip && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={() => setSelectedTrip(null)}>
            <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-3xl p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-white/20" onClick={(e) => e.stopPropagation()}>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-black text-white">Trip Details</h2>
                <button
                  onClick={() => setSelectedTrip(null)}
                  className="text-white hover:text-primary text-3xl font-bold"
                >
                  ×
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Trip Information */}
                <div className="space-y-4">
                  <h3 className="text-xl font-black text-primary mb-4">Trip Information</h3>
                  
                  <div>
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Trip ID</label>
                    <div className="text-white font-mono text-sm mt-1">{selectedTrip.id}</div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Booking ID</label>
                    <div className="text-white font-mono text-sm mt-1">
                      {selectedBooking?.bookingNumber || selectedTrip.bookingId}
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Status</label>
                    <div className="mt-1">
                      <span className={`inline-block px-4 py-2 rounded-full text-sm font-bold text-white ${getStatusColor(selectedTrip.status)}`}>
                        {selectedTrip.status}
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Driver</label>
                    <div className="text-white text-sm mt-1">{getDriverName(selectedTrip.driverId)}</div>
                    <div className="text-slate-400 font-mono text-xs mt-1">{selectedTrip.driverId}</div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Distance</label>
                    <div className="text-white text-lg font-bold mt-1">{formatDistance(selectedTrip.distanceM)}</div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Duration</label>
                    <div className="text-white text-lg font-bold mt-1">{formatDuration(selectedTrip.durationS)}</div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Started At</label>
                    <div className="text-white text-sm mt-1">{formatDate(selectedTrip.startedAt)}</div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Completed At</label>
                    <div className="text-white text-sm mt-1">{formatDate(selectedTrip.completedAt)}</div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Created At</label>
                    <div className="text-white text-sm mt-1">{formatDate(selectedTrip.createdAt)}</div>
                  </div>
                </div>

                {/* Booking Information */}
                {selectedBooking && (
                  <div className="space-y-4">
                    <h3 className="text-xl font-black text-primary mb-4">Booking Information</h3>
                    
                    <div>
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Booking Status</label>
                      <div className="mt-1">
                        <span className={`inline-block px-4 py-2 rounded-full text-sm font-bold text-white ${getStatusColor(selectedBooking.status)}`}>
                          {selectedBooking.status}
                        </span>
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Customer ID</label>
                      <div className="text-white font-mono text-sm mt-1">{selectedBooking.customerId}</div>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Scheduled Pickup</label>
                      <div className="text-white text-sm mt-1">{formatDate(selectedBooking.scheduledPickupAt)}</div>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Estimated Distance</label>
                      <div className="text-white text-sm mt-1">{formatDistance(selectedBooking.estimatedDistanceM)}</div>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Estimated Duration</label>
                      <div className="text-white text-sm mt-1">{formatDuration(selectedBooking.estimatedDurationS)}</div>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Quoted Fare</label>
                      <div className="text-white text-lg font-bold mt-1">
                        {formatCurrency(selectedBooking.quotedFarePence, selectedBooking.currency)}
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Final Fare</label>
                      <div className="text-white text-lg font-bold mt-1">
                        {formatCurrency(selectedBooking.finalFarePence, selectedBooking.currency)}
                      </div>
                    </div>

                    {selectedBooking.vehicleId && (
                      <div>
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Vehicle ID</label>
                        <div className="text-white font-mono text-sm mt-1">{selectedBooking.vehicleId}</div>
                      </div>
                    )}

                    {selectedBooking.notes && (
                      <div>
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Notes</label>
                        <div className="text-white text-sm mt-1 bg-white/5 p-3 rounded-xl">{selectedBooking.notes}</div>
                      </div>
                    )}

                    <div>
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Booking Created</label>
                      <div className="text-white text-sm mt-1">{formatDate(selectedBooking.createdAt)}</div>
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-8 flex justify-end gap-4">
                <button
                  onClick={() => setSelectedTrip(null)}
                  className="px-6 py-3 bg-slate-700 hover:bg-slate-600 rounded-xl text-white font-bold uppercase text-sm tracking-wider transition-all"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(JSON.stringify(selectedTrip, null, 2));
                    alert('Trip data copied to clipboard!');
                  }}
                  className="px-6 py-3 bg-primary hover:bg-primary-dark rounded-xl text-white font-bold uppercase text-sm tracking-wider transition-all"
                >
                  Copy Data
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="mt-8 bg-white/10 backdrop-blur-xl rounded-3xl p-6 border border-white/20">
          <h2 className="text-2xl font-black text-white mb-4">Quick Actions</h2>
          <div className="flex flex-wrap gap-4">
            <button
              onClick={() => loadData()}
              className="px-6 py-3 bg-primary hover:bg-primary-dark rounded-xl text-white font-bold uppercase text-sm tracking-wider transition-all shadow-lg shadow-primary/30"
            >
              🔄 Refresh Data
            </button>
            <button
              onClick={() => router.push('/tenants/admin')}
              className="px-6 py-3 bg-slate-700 hover:bg-slate-600 rounded-xl text-white font-bold uppercase text-sm tracking-wider transition-all"
            >
              👤 User Management
            </button>
            <button
              onClick={() => {
                const data = trips.map(trip => ({
                  ...trip,
                  booking: bookings.find(b => b.id === trip.bookingId),
                  driver: drivers.find(d => d.id === trip.driverId)
                }));
                const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `trips-export-${new Date().toISOString()}.json`;
                a.click();
              }}
              className="px-6 py-3 bg-green-600 hover:bg-green-700 rounded-xl text-white font-bold uppercase text-sm tracking-wider transition-all"
            >
              📥 Export Data
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
