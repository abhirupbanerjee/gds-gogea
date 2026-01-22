import psycopg2

# Connect to your PostgreSQL running in Docker
conn = psycopg2.connect(
    host="localhost",
    port="5432",
    dbname="postgres",   # default database name
    user="postgres",     # default username
    password="mysecretpassword"  # password you set during docker run
)

cur = conn.cursor()

# SQL for creating all tables
create_tables_query = """
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
    service_request_id UUID REFERENCES ServiceRequests(request_id),
    file_path TEXT,
    file_name TEXT,
    file_type TEXT,
    file_size_mb FLOAT CHECK (file_size_mb <= 10.0),
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
"""

# Execute the SQL
cur.execute(create_tables_query)

# Commit the transaction
conn.commit()

print("✅ Tables created successfully!")

# Clean up
cur.close()
conn.close()
