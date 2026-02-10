-- Run this in your Supabase SQL Editor to update your database schema

ALTER TABLE public.attendance ADD COLUMN IF NOT EXISTS transcript TEXT;

-- Verify the change
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'attendance';
