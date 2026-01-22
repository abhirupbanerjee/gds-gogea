from passlib.context import CryptContext

# Setup the password context with bcrypt (recommended)
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash_password(password: str) -> str:
    """
    Hash a plain text password.

    :param password: The plain password to hash
    :return: The hashed password
    """
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verify a plain password against a hashed password.

    :param plain_password: The plain password to verify
    :param hashed_password: The hashed password to compare against
    :return: True if the password matches, False otherwise
    """
    return pwd_context.verify(plain_password, hashed_password)



plain = "my_secret_password"
hashed = hash_password(plain)

print("Hashed password:", hashed)

# Now verify
is_valid = verify_password("my_secret_password", hashed)
print("Is valid:", is_valid)  # Should print True

print(pwd_context.verify("your_input_password", "$2b$12$GPEmfJc6HR6cc/j9BU4DZ.gPSEeiLNsjTzl9QzpRVFkEsIcjPan7i"))
