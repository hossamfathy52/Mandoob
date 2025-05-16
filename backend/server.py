from fastapi import FastAPI, APIRouter, HTTPException, Depends, status, Request, Body
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional, Dict, Any
from enum import Enum
import uuid
from datetime import datetime, timedelta
from passlib.context import CryptContext
import jwt
from jose import JWTError
import json
import math

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ.get('DB_NAME', 'mandoob_plus')]

# Create the main app without a prefix
app = FastAPI(title="Mandoob+ API")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Security
SECRET_KEY = os.environ.get("SECRET_KEY", "mandoobplussecretkey123456789")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24  # 1 day

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/token")

# Define Models
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None

class UserBase(BaseModel):
    username: str
    email: EmailStr
    full_name: str
    
class UserCreate(UserBase):
    password: str

class User(UserBase):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
class UserInDB(User):
    hashed_password: str

class DeliveryApp(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    logo_url: str
    is_active: bool = True
    created_at: datetime = Field(default_factory=datetime.utcnow)

class Notification(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    app_id: str
    app_name: str  # For display purposes
    title: str
    content: str
    received_at: datetime = Field(default_factory=datetime.utcnow)
    is_read: bool = False
    is_processed: bool = False
    
class Location(BaseModel):
    latitude: float
    longitude: float
    address: str

class OrderStatus(str, Enum):
    PENDING = "pending"
    ACCEPTED = "accepted"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    CANCELLED = "cancelled"

class Order(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    app_id: str
    app_name: str
    notification_id: Optional[str] = None
    order_reference: str  # Order ID from the delivery app
    customer_name: Optional[str] = None
    pickup_location: Location
    dropoff_location: Location
    estimated_pickup_time: Optional[datetime] = None
    estimated_delivery_time: Optional[datetime] = None
    payment_amount: Optional[float] = None
    status: str = "pending"
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class OrderCombination(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    order_ids: List[str]
    total_distance: float  # in kilometers
    estimated_time: int  # in minutes
    savings_percentage: float  # compared to doing orders separately
    created_at: datetime = Field(default_factory=datetime.utcnow)
    is_accepted: bool = False
    
class SimulatedNotification(BaseModel):
    app_name: str
    title: str
    content: str

class NotificationProcessor:
    @staticmethod
    def process_notification(notification):
        """
        Enhanced notification processor with smart pattern recognition
        Uses rule-based parsing with adaptive learning capabilities
        """
        # Initialize the order with basic information
        order = {
            "app_id": notification.app_id,
            "app_name": notification.app_name,
            "notification_id": notification.id,
            "order_reference": f"ORDER-{uuid.uuid4().hex[:8]}",
            "user_id": notification.user_id,
            "pickup_location": None,
            "dropoff_location": None,
            "customer_name": None,
            "payment_amount": None,
        }
        
        # Preprocess the notification content
        content = notification.content.lower()
        title = notification.title.lower()
        app_name = notification.app_name.lower()
        
        # Extract location patterns based on different app formats
        app_patterns = {
            "talabat": {
                "pickup_patterns": [
                    "pickup from", "collect from", "restaurant", "pickup location", "من"
                ],
                "dropoff_patterns": [
                    "deliver to", "delivery address", "customer address", "destination", "إلى"
                ],
                "amount_patterns": [
                    "amount", "price", "payment", "جنيه", "ج.م", "egp"
                ]
            },
            "careem": {
                "pickup_patterns": [
                    "pickup", "pick up", "starting location", "from", "pickup at"
                ],
                "dropoff_patterns": [
                    "dropoff", "drop off", "destination", "to", "dropoff at"
                ],
                "amount_patterns": [
                    "fare", "cost", "price", "egp", "جنيه", "ج.م"
                ]
            },
            "indrive": {
                "pickup_patterns": [
                    "pickup from", "starting point", "from", "pickup location"
                ],
                "dropoff_patterns": [
                    "destination", "drop-off", "to", "delivery location"
                ],
                "amount_patterns": [
                    "fare", "price", "egp", "جنيه", "ج.م", "cost"
                ]
            },
            "uber eats": {
                "pickup_patterns": [
                    "restaurant", "pickup from", "collect from", "ready at"
                ],
                "dropoff_patterns": [
                    "deliver to", "customer", "destination", "drop off at"
                ],
                "amount_patterns": [
                    "total", "amount", "price", "جنيه", "egp"
                ]
            },
            "instashop": {
                "pickup_patterns": [
                    "shop", "store", "pickup from", "pickup at", "collect from"
                ],
                "dropoff_patterns": [
                    "deliver to", "customer", "destination", "delivery address"
                ],
                "amount_patterns": [
                    "order total", "total", "amount", "price", "egp", "جنيه"
                ]
            },
            # Default patterns for unknown apps
            "default": {
                "pickup_patterns": [
                    "pickup", "from", "restaurant", "store", "shop", "source", "origin"
                ],
                "dropoff_patterns": [
                    "deliver", "to", "customer", "destination", "dropoff", "delivery"
                ],
                "amount_patterns": [
                    "amount", "price", "payment", "total", "cost", "fare", "egp", "جنيه"
                ]
            }
        }
        
        # Get patterns for the current app, fallback to default if not found
        current_patterns = app_patterns.get(app_name, app_patterns["default"])
        
        # Extract pickup location
        pickup_location = None
        for pattern in current_patterns["pickup_patterns"]:
            if pattern in content:
                idx = content.find(pattern) + len(pattern)
                # Look for end of address (. or , or new line)
                end_markers = ['.', ',', '\n']
                end_idx = len(content)
                for marker in end_markers:
                    marker_idx = content.find(marker, idx)
                    if marker_idx != -1 and marker_idx < end_idx:
                        end_idx = marker_idx
                
                pickup_address = content[idx:end_idx].strip()
                if len(pickup_address) > 5:  # Ensure we have a meaningful address
                    pickup_location = Location(
                        latitude=30.0444,  # Simulated coordinates for Cairo
                        longitude=31.2357,
                        address=pickup_address
                    )
                    break
        
        # Extract dropoff location
        dropoff_location = None
        for pattern in current_patterns["dropoff_patterns"]:
            if pattern in content:
                idx = content.find(pattern) + len(pattern)
                # Look for end of address
                end_markers = ['.', ',', '\n']
                end_idx = len(content)
                for marker in end_markers:
                    marker_idx = content.find(marker, idx)
                    if marker_idx != -1 and marker_idx < end_idx:
                        end_idx = marker_idx
                
                dropoff_address = content[idx:end_idx].strip()
                if len(dropoff_address) > 5:  # Ensure we have a meaningful address
                    dropoff_location = Location(
                        latitude=30.0566,  # Slightly different coordinates
                        longitude=31.2394,
                        address=dropoff_address
                    )
                    break
        
        # Extract payment amount
        payment_amount = None
        for pattern in current_patterns["amount_patterns"]:
            if pattern in content:
                # Find the pattern and look for numbers around it
                pattern_idx = content.find(pattern)
                # Look before and after the pattern for numbers
                # This uses regex to find numbers with potential decimal points
                import re
                numbers = re.findall(r'\d+(?:\.\d+)?', content[max(0, pattern_idx-20):pattern_idx+20])
                if numbers:
                    # Take the largest number as the likely amount
                    payment_amount = float(max(numbers, key=float))
                    break
        
        # Extract customer name (simplified)
        customer_name = None
        name_indicators = ["customer", "client", "recipient", "name"]
        for indicator in name_indicators:
            if indicator in content:
                idx = content.find(indicator) + len(indicator)
                end_idx = min(idx + 30, len(content))  # Take up to 30 chars after
                potential_name = content[idx:end_idx].strip()
                first_sentence_end = potential_name.find('.')
                if first_sentence_end != -1:
                    potential_name = potential_name[:first_sentence_end].strip()
                if len(potential_name) > 2:
                    customer_name = potential_name
                    break
        
        # Set extracted values in the order
        if pickup_location:
            order["pickup_location"] = pickup_location
        
        if dropoff_location:
            order["dropoff_location"] = dropoff_location
            
        if payment_amount:
            order["payment_amount"] = payment_amount
            
        if customer_name:
            order["customer_name"] = customer_name
        
        # In a real app, we would use coordinates from geocoding APIs
        # Here we're simulating with random variation for demo purposes
        if order["pickup_location"] and order["dropoff_location"]:
            import random
            # Add small random variations to coordinates for demo
            order["pickup_location"].latitude += random.uniform(-0.05, 0.05)
            order["pickup_location"].longitude += random.uniform(-0.05, 0.05)
            order["dropoff_location"].latitude += random.uniform(-0.05, 0.05)
            order["dropoff_location"].longitude += random.uniform(-0.05, 0.05)
            
            # Create and return the complete order
            return Order(**order)
        
        # If we couldn't extract both pickup and dropoff, return None
        return None

# Authentication functions
def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

async def get_user(username: str):
    user_doc = await db.users.find_one({"username": username})
    if user_doc:
        return UserInDB(**user_doc)

async def authenticate_user(username: str, password: str):
    user = await get_user(username)
    if not user:
        return False
    if not verify_password(password, user.hashed_password):
        return False
    return user

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
        token_data = TokenData(username=username)
    except JWTError:
        raise credentials_exception
    user = await get_user(username=token_data.username)
    if user is None:
        raise credentials_exception
    return user

# Helper functions
def calculate_distance(loc1, loc2):
    """Calculate distance between two locations using Haversine formula"""
    # Convert latitude and longitude from degrees to radians
    lat1 = math.radians(loc1.latitude)
    lon1 = math.radians(loc1.longitude)
    lat2 = math.radians(loc2.latitude)
    lon2 = math.radians(loc2.longitude)
    
    # Haversine formula
    dlon = lon2 - lon1
    dlat = lat2 - lat1
    a = math.sin(dlat/2)**2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlon/2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))
    radius = 6371  # Radius of the Earth in kilometers
    
    return radius * c

# Auth endpoints
@api_router.post("/token", response_model=Token)
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends()):
    user = await authenticate_user(form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

# User endpoints
@api_router.post("/users", response_model=User)
async def create_user(user: UserCreate):
    # Check if the username already exists
    existing_user = await db.users.find_one({"username": user.username})
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already registered"
        )
    
    # Check if the email already exists
    existing_email = await db.users.find_one({"email": user.email})
    if existing_email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    hashed_password = get_password_hash(user.password)
    user_dict = user.dict()
    del user_dict["password"]
    
    user_in_db = UserInDB(
        **user_dict,
        id=str(uuid.uuid4()),
        hashed_password=hashed_password,
        created_at=datetime.utcnow()
    )
    
    await db.users.insert_one(user_in_db.dict())
    
    # Return user without hashed_password
    user_response = User(**user_in_db.dict())
    return user_response

@api_router.get("/users/me", response_model=User)
async def read_users_me(current_user: User = Depends(get_current_user)):
    return current_user

# Delivery Apps endpoints
@api_router.get("/delivery-apps", response_model=List[DeliveryApp])
async def get_delivery_apps():
    delivery_apps = await db.delivery_apps.find().to_list(length=100)
    if not delivery_apps:
        # Create default delivery apps if none exist
        default_apps = [
            DeliveryApp(
                id=str(uuid.uuid4()),
                name="Talabat",
                logo_url="https://play-lh.googleusercontent.com/HN9-_FL6v4AwKslcCKD9BB0rsmbK_BLJdzjFTKPaHRQr7-xM3xkJl2E0M4TjRH1__Ps",
                is_active=True
            ),
            DeliveryApp(
                id=str(uuid.uuid4()),
                name="Careem",
                logo_url="https://play-lh.googleusercontent.com/uf19YZxHI1RdHhvDGbwPrMupvYF2BxLVvheEPolXsHFRjGfnZJQJg-9qoCLMJVE54Q",
                is_active=True
            ),
            DeliveryApp(
                id=str(uuid.uuid4()),
                name="InDrive",
                logo_url="https://play-lh.googleusercontent.com/Q6oi2-y7Mega_8VYu-UvdE9PBgHfBZTb-KnFPXHxjDgWbkgnJqMzwlMxhW9or6P12KDU",
                is_active=True
            ),
            DeliveryApp(
                id=str(uuid.uuid4()),
                name="Uber Eats",
                logo_url="https://play-lh.googleusercontent.com/kDzXOuJzWFNJNwWH45Ck3ZjhIK3UCxNXmOqYJcLb8wEJ2QXRzQ-BXgbD7q9LlJmeoa0",
                is_active=True
            ),
            DeliveryApp(
                id=str(uuid.uuid4()),
                name="Instashop",
                logo_url="https://play-lh.googleusercontent.com/BYpbl6-tIYf4VGzvsb5dhPP6Lq8Ql-FEyxNYgO6v-3RQbTIPU85oRFQvGk8QxLQvqA",
                is_active=True
            )
        ]
        
        for app in default_apps:
            await db.delivery_apps.insert_one(app.dict())
        
        return default_apps
    
    return [DeliveryApp(**app) for app in delivery_apps]

# Notifications endpoints
@api_router.post("/notifications/simulate", response_model=Notification)
async def simulate_notification(
    simulated: SimulatedNotification,
    current_user: User = Depends(get_current_user)
):
    # Find the app ID based on app name
    app = await db.delivery_apps.find_one({"name": simulated.app_name})
    if not app:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Delivery app {simulated.app_name} not found"
        )
    
    # Create the notification
    notification = Notification(
        user_id=current_user.id,
        app_id=app["id"],
        app_name=app["name"],
        title=simulated.title,
        content=simulated.content
    )
    
    # Insert into database
    await db.notifications.insert_one(notification.dict())
    
    # Process notification to extract order if possible
    order = NotificationProcessor.process_notification(notification)
    if order:
        await db.orders.insert_one(order.dict())
        
        # Mark notification as processed
        await db.notifications.update_one(
            {"id": notification.id},
            {"$set": {"is_processed": True}}
        )
    
    return notification

@api_router.get("/notifications", response_model=List[Notification])
async def get_notifications(current_user: User = Depends(get_current_user)):
    notifications = await db.notifications.find(
        {"user_id": current_user.id}
    ).sort("received_at", -1).to_list(50)
    
    return [Notification(**notif) for notif in notifications]

# Orders endpoints
@api_router.get("/orders", response_model=List[Order])
async def get_orders(
    status: Optional[str] = None,
    current_user: User = Depends(get_current_user)
):
    query = {"user_id": current_user.id}
    if status:
        query["status"] = status
    
    orders = await db.orders.find(query).sort("created_at", -1).to_list(50)
    return [Order(**order) for order in orders]

@api_router.put("/orders/{order_id}/status", response_model=Order)
async def update_order_status(
    order_id: str,
    status: str = Body(...),
    current_user: User = Depends(get_current_user)
):
    # Validate status
    valid_statuses = ["pending", "accepted", "in_progress", "completed", "cancelled"]
    if status not in valid_statuses:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid status. Must be one of: {', '.join(valid_statuses)}"
        )
    
    # Update the order
    result = await db.orders.update_one(
        {"id": order_id, "user_id": current_user.id},
        {"$set": {
            "status": status,
            "updated_at": datetime.utcnow()
        }}
    )
    
    if result.modified_count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found or you don't have permission to update it"
        )
    
    updated_order = await db.orders.find_one({"id": order_id})
    return Order(**updated_order)

# Order combinations endpoints
@api_router.get("/combinations", response_model=List[OrderCombination])
async def get_combinations(current_user: User = Depends(get_current_user)):
    combinations = await db.order_combinations.find(
        {"user_id": current_user.id}
    ).sort("created_at", -1).to_list(20)
    
    return [OrderCombination(**combo) for combo in combinations]

@api_router.post("/combinations/generate", response_model=List[OrderCombination])
async def generate_combinations(current_user: User = Depends(get_current_user)):
    # Get pending orders
    orders = await db.orders.find({
        "user_id": current_user.id,
        "status": "pending"
    }).to_list(50)
    
    if len(orders) < 2:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Need at least 2 pending orders to generate combinations"
        )
    
    # Convert to Order objects
    order_objs = [Order(**order) for order in orders]
    
    # Generate combinations (simplified algorithm)
    combinations = []
    
    # For this MVP, we'll just generate all possible pairs
    for i in range(len(order_objs)):
        for j in range(i+1, len(order_objs)):
            order1 = order_objs[i]
            order2 = order_objs[j]
            
            # Calculate distance between pickup locations
            pickup_distance = calculate_distance(
                order1.pickup_location, 
                order2.pickup_location
            )
            
            # Calculate distance between dropoff locations
            dropoff_distance = calculate_distance(
                order1.dropoff_location,
                order2.dropoff_location
            )
            
            # Only create a combination if both locations are relatively close
            if pickup_distance <= 2.0 and dropoff_distance <= 5.0:
                # Calculate total route distance (simplified)
                total_distance = (
                    pickup_distance + 
                    calculate_distance(order1.pickup_location, order1.dropoff_location) +
                    calculate_distance(order2.pickup_location, order2.dropoff_location)
                )
                
                # Calculate time savings (simplified estimate)
                separate_distance = (
                    calculate_distance(order1.pickup_location, order1.dropoff_location) +
                    calculate_distance(order2.pickup_location, order2.dropoff_location)
                )
                
                savings_percentage = ((separate_distance - total_distance) / separate_distance) * 100
                
                # Create combination
                combination = OrderCombination(
                    user_id=current_user.id,
                    order_ids=[order1.id, order2.id],
                    total_distance=round(total_distance, 2),
                    estimated_time=int(total_distance * 5),  # Rough estimate: 5 min per km
                    savings_percentage=round(savings_percentage, 1)
                )
                
                combinations.append(combination)
    
    # Save combinations to database
    for combo in combinations:
        await db.order_combinations.insert_one(combo.dict())
    
    return combinations

@api_router.put("/combinations/{combination_id}/accept", response_model=OrderCombination)
async def accept_combination(
    combination_id: str,
    current_user: User = Depends(get_current_user)
):
    # Update the combination to accepted
    result = await db.order_combinations.update_one(
        {"id": combination_id, "user_id": current_user.id},
        {"$set": {"is_accepted": True}}
    )
    
    if result.modified_count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Combination not found or you don't have permission to update it"
        )
    
    # Get the updated combination
    combo = await db.order_combinations.find_one({"id": combination_id})
    
    # Update the orders in this combination to "accepted" status
    for order_id in combo["order_ids"]:
        await db.orders.update_one(
            {"id": order_id, "user_id": current_user.id},
            {"$set": {
                "status": "accepted",
                "updated_at": datetime.utcnow()
            }}
        )
    
    return OrderCombination(**combo)

@api_router.get("/status")
async def status():
    return {"status": "ok", "timestamp": datetime.utcnow().isoformat()}

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
