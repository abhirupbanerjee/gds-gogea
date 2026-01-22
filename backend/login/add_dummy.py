import psycopg2
import uuid
from datetime import datetime

# # Connect to your PostgreSQL
# conn = psycopg2.connect(
#     host="localhost",
#     port="5432",
#     dbname="postgres",
#     user="postgres",
#     password="mysecretpassword"
# )

# cur = conn.cursor()

# # Generate UUIDs for foreign keys
# user_id = str(uuid.uuid4())
# service_id = str(uuid.uuid4())
# request_id = str(uuid.uuid4())
# file_id = str(uuid.uuid4())

# # Insert into Users table
# cur.execute("""
# INSERT INTO Users (user_id, name, email, password_hash, role, organisation, created_at, updated_at)
# VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
# """, (
#     user_id,
#     'John Doe',
#     'johndoe@example.com',
#     'hashedpassword123',
#     'user',
#     'ExampleOrg',
#     datetime.now(),
#     datetime.now()
# ))

# # Insert into Services table
# cur.execute("""
# INSERT INTO Services (service_id, name, description, delivery_timeline_days, created_at)
# VALUES (%s, %s, %s, %s, %s)
# """, (
#     service_id,
#     'Data Analysis Service',
#     'We analyze your data and provide insights.',
#     7,
#     datetime.now()
# ))

# # Insert into ServiceRequests table
# cur.execute("""
# INSERT INTO ServiceRequests (request_id, submitter_id, representative_name, representative_email, contact_number, ministry_name, service_id, reason, notes, additional_info, status, created_at, updated_at)
# VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
# """, (
#     request_id,
#     user_id,
#     'Jane Representative',
#     'jane.representative@example.com',
#     '123-456-7890',
#     'Ministry of Testing',
#     service_id,
#     'Need detailed analysis of quarterly data.',
#     'Priority project for Q2.',
#     'Sensitive financial data involved.',
#     'Submitted',
#     datetime.now(),
#     datetime.now()
# ))

# # Insert into RequestFiles table
# cur.execute("""
# INSERT INTO RequestFiles (file_id, service_request_id, file_path, file_name, file_type, file_size_mb, uploaded_at)
# VALUES (%s, %s, %s, %s, %s, %s, %s)
# """, (
#     file_id,
#     request_id,
#     '/uploads/reports/q2_data.xlsx',
#     'q2_data.xlsx',
#     'xlsx',
#     5.5,
#     datetime.now()
# ))

# # Commit the inserts
# conn.commit()

# print("✅ Dummy data inserted successfully!")

# # Clean up
# cur.close()
# conn.close()


# Connect to your PostgreSQL database
# conn = psycopg2.connect(
#     host="localhost",
#     port="5432",
#     dbname="postgres",
#     user="postgres",
#     password="mysecretpassword"
# )

# cur = conn.cursor()

# # Query to fetch all table names in the database
# cur.execute("""
#     SELECT table_name
#     FROM information_schema.tables
#     WHERE table_schema = 'public'
# """)

# # Fetch all results
# tables = cur.fetchall()

# # Print the list of tables
# print("Tables in the database:")
# for table in tables:
#     print(table[0])
#     cur.execute (f""" 
#     SELECT * FROM {table[0]}
#     """)
#     Data=cur.fetchall()
#     print(Data)

# # Clean up
# cur.close()
# conn.close()






# from passlib.context import CryptContext

# # Initialize the CryptContext
# pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# # Hash the password before saving it
# password = "hashedpassword123"  # This is the plain password
# hashed_password = pwd_context.hash(password)

# # Now you can store `hashed_password` in the database
# print(f"Hashed password: {hashed_password}")


# cur.execute("""
#     UPDATE users
#     SET password_hash = %s
#     WHERE email = %s
# """, (hashed_password, "johndoe@example.com"))

#cur.fetchall()




# from passlib.context import CryptContext
# import psycopg2

# # Initialize the CryptContext with bcrypt
# pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# # Function to hash a new password
# def hash_password(password: str) -> str:
#     return pwd_context.hash(password)

# # Function to update password in the database
# def update_password_in_db(email: str, password: str):
#     conn = None  # Initialize conn to None before the try block
#     try:
#         # Your code to connect to the database and execute the update
#         conn = psycopg2.connect(
#             dbname="postgres",
#             user="postgres",
#             password="mysecretpassword",
#             host="localhost",  # Or your DB server's IP
#             port="5432"
#         )
#         cur = conn.cursor()

#         # Update the password for the given email
#         hashed_password = hash_password(password)
#         cur.execute("""
#             UPDATE users
#             SET password_hash = %s
#             WHERE email = %s
#         """, (hashed_password, email))

#         # Commit and close
#         conn.commit()
#         print("Password updated successfully.")

#     except Exception as e:
#         print(f"Error: {e}")
    
#     finally:
#         if conn:
#             cur.close()
#             conn.close()


# # Call the function with a new password for a user
# email = "johndoe@example.com"
# new_password = "new_secure_password123"
# update_password_in_db(email, new_password)



#Connect to your PostgreSQL database
# conn = psycopg2.connect(
#     host="localhost",
#     port="5432",
#     dbname="postgres",
#     user="postgres",
#     password="mysecretpassword"
# )

# cur = conn.cursor()

# # Query to fetch all table names in the database
# cur.execute("""
#     SELECT table_name
#     FROM information_schema.tables
#     WHERE table_schema = 'public'
# """)

# # Fetch all results
# tables = cur.fetchall()

# # Print the list of tables
# print("Tables in the database:")
# for table in tables:
#     print(table[0])
#     cur.execute (f""" 
#     SELECT * FROM {table[0]}
#     """)
#     Data=cur.fetchall()
#     print(Data)

# # Clean up
# cur.close()
# conn.close()



import psycopg2
from passlib.context import CryptContext
from datetime import datetime
import uuid

# Initialize password hasher
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

# Database connection
conn = psycopg2.connect(
    host="localhost",
    port="5432",
    dbname="postgres",
    user="postgres",
    password="mysecretpassword"
)
cur = conn.cursor()

# Prepare dummy admin user data
admin_id = str(uuid.uuid4())  # Generate a unique UUID
name = "Admin User"
email = "admin@example.com"
plain_password = "adminpassword123"  # Plain password
password_hash = hash_password(plain_password)  # Hashed password
role = "admin"
organisation = "AdminOrg"
created_at = datetime.utcnow()
updated_at = datetime.utcnow()

# Insert dummy admin user into users table
cur.execute("""
    INSERT INTO users (user_id, name, email, password_hash, role, organization, created_at, updated_at)
    VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
""", (admin_id, name, email, password_hash, role, organisation, created_at, updated_at))

# Commit and clean up
conn.commit()
print("Dummy admin user inserted successfully!")

cur.close()
conn.close()
