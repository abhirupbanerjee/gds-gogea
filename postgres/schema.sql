-- USERS TABLE
CREATE TABLE IF NOT EXISTS Users (
    user_id UUID PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT CHECK (role IN ('admin', 'user')) NOT NULL,
    organisation TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- SERVICES TABLE
CREATE TABLE IF NOT EXISTS Services (
    service_id UUID PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    delivery_timeline_days INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- SERVICE REQUESTS TABLE
CREATE TABLE IF NOT EXISTS ServiceRequests (
    request_id UUID PRIMARY KEY,
    submitter_id UUID REFERENCES Users(user_id),
    representative_name TEXT,
    representative_email TEXT,
    contact_number TEXT,
    ministry_name TEXT,
    service_id UUID REFERENCES Services(service_id),
    reason TEXT,
    notes TEXT,
    additional_info TEXT,
    status TEXT CHECK (status IN ('Draft', 'Submitted', 'Active', 'Completed')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- REQUEST FILES TABLE
CREATE TABLE IF NOT EXISTS RequestFiles (
    file_id UUID PRIMARY KEY,
    request_id UUID REFERENCES ServiceRequests(request_id),
    file_path TEXT,
    file_name TEXT,
    file_type TEXT,
    file_size_mb FLOAT CHECK (file_size_mb <= 10.0),
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- PENDING USERS TABLE
CREATE TABLE IF NOT EXISTS pendingusers (
    temp_user_id UUID PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT CHECK (role IN ('admin', 'user')) NOT NULL,
    organisation TEXT,
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);



-- Insert default admin user if not exists
CREATE EXTENSION IF NOT EXISTS pgcrypto;
INSERT INTO Users (user_id, name, email, password_hash, role, organisation)
SELECT
  gen_random_uuid(),
  'Admin',
  'admin@test.com',
  '$2b$12$cTxPwY.0jFFeVSHO4yGoqejqnlqrYMItgE6dIV3nt9IG0tteT42.C', --admin_GOG@08072025
  'admin',
  'System'
WHERE NOT EXISTS (
  SELECT 1 FROM Users WHERE email = 'admin@test.com'
);
