-- Migration: Add booking_number column to bookings table
-- This script adds the booking_number field and generates numbers for existing PAID bookings only
-- Booking numbers are only assigned to confirmed/paid bookings (status >= 'confirmed')

-- Step 1: Add the column (if it doesn't exist)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='bookings' AND column_name='booking_number'
    ) THEN
        ALTER TABLE bookings ADD COLUMN booking_number varchar(20) UNIQUE;
    END IF;
END $$;

-- Step 2: Generate booking numbers ONLY for confirmed/paid bookings (starting from B203)
-- Unpaid bookings will get their number when payment is confirmed
DO $$ 
DECLARE
    booking_record RECORD;
    counter INTEGER := 203; -- Start from B203 as requested
BEGIN
    -- Loop through confirmed/paid bookings without a booking_number, ordered by creation date
    FOR booking_record IN 
        SELECT id FROM bookings 
        WHERE booking_number IS NULL 
        AND status IN ('confirmed', 'driver_assigned', 'driver_arriving', 'in_progress', 'completed')
        ORDER BY created_at ASC
    LOOP
        -- Update each booking with B203, B204, B205, etc.
        UPDATE bookings 
        SET booking_number = 'B' || counter 
        WHERE id = booking_record.id;
        
        counter := counter + 1;
    END LOOP;
END $$;

-- Step 3: Verify the migration
SELECT 
    COUNT(*) as total_bookings,
    COUNT(booking_number) as bookings_with_numbers,
    COUNT(CASE WHEN status IN ('confirmed', 'driver_assigned', 'driver_arriving', 'in_progress', 'completed') THEN 1 END) as paid_bookings,
    MIN(booking_number) as first_booking_number,
    MAX(booking_number) as last_booking_number
FROM bookings;
