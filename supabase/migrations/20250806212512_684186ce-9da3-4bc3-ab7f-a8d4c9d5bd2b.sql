-- Enable pgcrypto extension explicitly
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- List functions that might be using gen_salt
SELECT proname, prosrc 
FROM pg_proc 
WHERE prosrc LIKE '%gen_salt%';

-- Check if gen_salt function exists
SELECT proname 
FROM pg_proc 
WHERE proname = 'gen_salt';