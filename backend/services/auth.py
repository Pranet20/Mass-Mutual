import os
import hashlib
import jwt
import datetime
import time
from typing import Optional, List
from fastapi import HTTPException, Header, Depends, Query, status
from database.models import SessionLocal, User, EmployeeMaster

# Load JWT Secret securely from environment
SECRET_KEY = os.environ.get("JWT_SECRET_KEY")
if not SECRET_KEY:
    if os.environ.get("ENV") == "production":
        raise RuntimeError("CRITICAL SECURITY CONFIGURATION ERROR: JWT_SECRET_KEY environment variable must be set in production mode.")
    SECRET_KEY = "travel_analytics_enterprise_jwt_secret_2026"

ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_HOURS = int(os.environ.get("ACCESS_TOKEN_EXPIRE_HOURS", "12"))

# In-memory sliding window rate limiter for login attempts: ip -> list of timestamps
LOGIN_ATTEMPTS = {}
RATE_LIMIT_MAX_ATTEMPTS = 15
RATE_LIMIT_WINDOW_SECONDS = 60

def check_login_rate_limit(client_ip: str = "default_client") -> None:
    now = time.time()
    attempts = LOGIN_ATTEMPTS.get(client_ip, [])
    valid_attempts = [t for t in attempts if now - t < RATE_LIMIT_WINDOW_SECONDS]
    if len(valid_attempts) >= RATE_LIMIT_MAX_ATTEMPTS:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Too many login attempts. Please wait {RATE_LIMIT_WINDOW_SECONDS} seconds before trying again."
        )
    valid_attempts.append(now)
    LOGIN_ATTEMPTS[client_ip] = valid_attempts

def hash_password(password: str, salt: Optional[str] = None) -> str:
    if not salt:
        salt = os.urandom(16).hex()
    key = hashlib.pbkdf2_hmac('sha256', password.encode('utf-8'), salt.encode('utf-8'), 100000)
    return f"{salt}${key.hex()}"

def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        salt, _ = hashed_password.split("$")
        return hash_password(plain_password, salt) == hashed_password
    except Exception:
        return False

def create_access_token(data: dict, expires_delta: Optional[datetime.timedelta] = None) -> str:
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.datetime.now(datetime.timezone.utc) + expires_delta
    else:
        expire = datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(hours=ACCESS_TOKEN_EXPIRE_HOURS)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def decode_access_token(token: str) -> dict:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token has expired. Please log in again.")
    except (jwt.InvalidTokenError, Exception):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid authorization token.")

def get_current_user(
    authorization: Optional[str] = Header(None),
    token: Optional[str] = Query(None)
) -> User:
    """
    FastAPI dependency validating Bearer JWT and returning current active User record.
    Supports either standard 'Authorization: Bearer <token>' header or '?token=<token>' query parameter.
    """
    extracted_token = None
    if authorization:
        parts = authorization.split()
        if len(parts) == 2 and parts[0].lower() == "bearer":
            extracted_token = parts[1]
    elif token:
        extracted_token = token
        
    if not extracted_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authorization credential required (Bearer <token> header or ?token query parameter)",
            headers={"WWW-Authenticate": "Bearer"}
        )
    
    payload = decode_access_token(extracted_token)
    email = payload.get("sub")
    if not email:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token payload missing subject.")
    
    session = SessionLocal()
    user = session.query(User).filter_by(email=email).first()
    session.close()
    
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found.")
    
    return user


def require_role(allowed_roles: List[str]):
    """
    RBAC Dependency factory returning dependency that checks user role.
    """
    def role_checker(current_user: User = Depends(get_current_user)):
        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied. Allowed roles: {', '.join(allowed_roles)}. Your role: {current_user.role}"
            )
        return current_user
    return role_checker

def authenticate_user(email: str, password: str):
    session = SessionLocal()
    user = session.query(User).filter_by(email=email.strip()).first()
    session.close()
    if not user:
        return None
    if not verify_password(password, user.password_hash):
        return None
    return user

def register_user(email: str, password: str, name: str, role: str = "employee", employee_id: str = None, business_unit: str = "Global Technology", department: str = "Software Engineering", designation: str = "Senior Engineer") -> tuple:
    session = SessionLocal()
    existing = session.query(User).filter_by(email=email.strip()).first()
    if existing:
        session.close()
        return None, "Email address already registered."
        
    pwd_hash = hash_password(password)
    
    if not employee_id:
        emp_count = session.query(EmployeeMaster).count()
        employee_id = f"EMP-{emp_count + 1001}"
        
    new_user = User(
        email=email.strip(),
        password_hash=pwd_hash,
        name=name.strip(),
        role="employee", # Strictly enforced: public registration always creates employee role
        employee_id=employee_id
    )
    session.add(new_user)
    
    emp = session.query(EmployeeMaster).filter_by(employee_id=employee_id).first()
    if not emp:
        emp_obj = EmployeeMaster(
            employee_id=employee_id,
            employee_name=name.strip(),
            email=email.strip(),
            business_unit=business_unit,
            department=department,
            designation=designation,
            location="Bengaluru",
            manager_id="MGR-5001",
            effective_start_date="2026-01-01",
            effective_end_date="9999-12-31",
            quarterly_allowance_inr=150000.0,
            is_current=1
        )
        session.add(emp_obj)
        
    session.commit()
    session.close()
    
    return new_user, "User registered successfully."
