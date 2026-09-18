import os
from google import genai
from sqlalchemy import func
from fastapi import FastAPI, Depends, HTTPException, Query, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from database import get_db
from models import Product, User
from schemas import (
    ProductCreate,
    ProductUpdate,
    UserCreate,
    UserResponse,
    ProductResponse,
    DashboardAnalytics,
    CategoryStock,
    AIQueryRequest,
    AIQueryResponse,
    DemandPredictionResponse,
    DemandPredictionItem
)
from security import (
    hash_password,
    verify_password,
    create_access_token,
    verify_token
)


app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def get_current_user(request: Request):
    token = request.cookies.get("access_token")

    if not token:
        auth_header = request.headers.get("authorization", "")
        if auth_header.lower().startswith("bearer "):
            token = auth_header.split(" ", 1)[1]

    if not token:
        raise HTTPException(
            status_code=401,
            detail="Not authenticated"
        )

    payload = verify_token(token)

    if payload is None:
        raise HTTPException(
            status_code=401,
            detail="Invalid or expired token"
        )

    return payload


# -------------------- PRODUCTS --------------------

@app.post("/products", response_model=ProductResponse)
def create_product(
    product: ProductCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    new_product = Product(
        name=product.name,
        price=product.price,
        quantity=product.quantity,
        category=product.category,
        user_id=current_user["user_id"]
    )

    db.add(new_product)
    db.commit()
    db.refresh(new_product)

    return new_product


@app.get("/products", response_model=list[ProductResponse])
def get_products(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    products = db.query(Product).filter(
        Product.user_id == current_user["user_id"]
    ).all()

    return products


@app.get("/products/search", response_model=list[ProductResponse])
def search_products(
    name: str = Query(..., min_length=1),
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    products = db.query(Product).filter(
        Product.name.ilike(f"%{name}%"),
        Product.user_id == current_user["user_id"]
    ).all()

    return products


@app.get("/products/filter", response_model=list[ProductResponse])
def filter_products(
    min_price: float = Query(..., ge=0),
    max_price: float = Query(..., ge=0),
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    if min_price > max_price:
        raise HTTPException(
            status_code=400,
            detail="min_price must be less than or equal to max_price"
        )

    products = db.query(Product).filter(
        Product.price.between(min_price, max_price),
        Product.user_id == current_user["user_id"]
    ).all()

    return products


@app.get("/products/sort", response_model=list[ProductResponse])
def sort_products(
    order: str = Query("asc", pattern="^(asc|desc)$"),
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    if order.lower() == "desc":
        products = db.query(Product).filter(
            Product.user_id == current_user["user_id"]
        ).order_by(Product.price.desc()).all()
    else:
        products = db.query(Product).filter(
            Product.user_id == current_user["user_id"]
        ).order_by(Product.price.asc()).all()

    return products


@app.get("/products/page", response_model=list[ProductResponse])
def get_products_page(
    page: int = Query(1, ge=1),
    limit: int = Query(2, ge=1),
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    skip = (page - 1) * limit

    products = db.query(Product).filter(
        Product.user_id == current_user["user_id"]
    ).offset(skip).limit(limit).all()

    return products


@app.put("/products/{product_id}", response_model=ProductResponse)
def update_product(
    product_id: int,
    product: ProductCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    existing_product = db.query(Product).filter(
        Product.id == product_id
    ).first()

    if not existing_product:
        raise HTTPException(
            status_code=404,
            detail="Product not found"
        )

    if existing_product.user_id != current_user["user_id"]:
        raise HTTPException(
            status_code=403,
            detail="You do not have permission to update this product"
        )

    existing_product.name = product.name
    existing_product.price = product.price
    existing_product.quantity = product.quantity
    existing_product.category = product.category

    db.commit()
    db.refresh(existing_product)

    return existing_product


@app.patch("/products/{product_id}", response_model=ProductResponse)
def patch_product(
    product_id: int,
    product: ProductUpdate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    existing_product = db.query(Product).filter(
        Product.id == product_id
    ).first()

    if not existing_product:
        raise HTTPException(
            status_code=404,
            detail="Product not found"
        )

    if existing_product.user_id != current_user["user_id"]:
        raise HTTPException(
            status_code=403,
            detail="You do not have permission to update this product"
        )

    if product.name is not None:
        existing_product.name = product.name

    if product.price is not None:
        existing_product.price = product.price

    if product.quantity is not None:
        existing_product.quantity = product.quantity

    if product.category is not None:
        existing_product.category = product.category

    db.commit()
    db.refresh(existing_product)

    return existing_product


@app.delete("/products/{product_id}")
def delete_product(
    product_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    existing_product = db.query(Product).filter(
        Product.id == product_id
    ).first()

    if not existing_product:
        raise HTTPException(
            status_code=404,
            detail="Product not found"
        )

    if existing_product.user_id != current_user["user_id"]:
        raise HTTPException(
            status_code=403,
            detail="You do not have permission to delete this product"
        )

    db.delete(existing_product)
    db.commit()

    return {
        "message": "Product deleted",
        "product_id": product_id
    }


# -------------------- USERS --------------------

@app.post("/users", response_model=UserResponse)
def create_user(
    user: UserCreate,
    db: Session = Depends(get_db)
):
    existing_user = db.query(User).filter(
        User.email == user.email
    ).first()

    if existing_user:
        raise HTTPException(
            status_code=400,
            detail="Email already registered"
        )

    hashed_password = hash_password(user.password)

    new_user = User(
        name=user.name,
        email=user.email,
        password=hashed_password
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return new_user


@app.post("/login")
def login(
    response: Response,
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(
        User.email == form_data.username
    ).first()

    if not user:
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password"
        )

    if not verify_password(
        form_data.password,
        user.password
    ):
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password"
        )

    access_token = create_access_token({
        "user_id": user.id
    })

    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        samesite="lax",
        secure=False,
        path="/",
        max_age=1800
    )

    return {
        "message": "Login successful"
    }


@app.post("/logout")
def logout(response: Response):
    response.delete_cookie("access_token", path="/")
    return {"message": "Logged out"}


@app.get("/protected")
def protected_route(
    current_user: dict = Depends(get_current_user)
):
    return {
        "message": "You are authenticated",
        "user_id": current_user["user_id"]
    }


@app.get(
    "/users/{user_id}/products",
    response_model=list[ProductResponse]
)
def get_user_products(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    if user_id != current_user["user_id"]:
        raise HTTPException(
            status_code=403,
            detail="You do not have permission to view these products"
        )

    user = db.query(User).filter(
        User.id == user_id
    ).first()

    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )

    return user.products


@app.get("/users/{user_id}", response_model=UserResponse)
def get_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    if user_id != current_user["user_id"]:
        raise HTTPException(
            status_code=403,
            detail="You do not have permission to view this user"
        )

    user = db.query(User).filter(
        User.id == user_id
    ).first()

    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )

    return user


# -------------------- ANALYTICS & AI --------------------

genai_client = genai.Client(api_key=os.getenv("GEMINI_API_KEY")) if os.getenv("GEMINI_API_KEY") else None

@app.get("/analytics/dashboard", response_model=DashboardAnalytics)
def get_dashboard_analytics(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    user_id = current_user["user_id"]
    
    # Total inventory value
    total_value = db.query(func.sum(Product.price * Product.quantity)).filter(Product.user_id == user_id).scalar() or 0.0
    
    # Total products count
    total_products = db.query(func.count(Product.id)).filter(Product.user_id == user_id).scalar() or 0
    
    # Category-wise stock
    category_stock_rows = db.query(Product.category, func.sum(Product.quantity)).filter(Product.user_id == user_id).group_by(Product.category).all()
    category_wise_stock = [CategoryStock(category=row[0], total_quantity=row[1]) for row in category_stock_rows]
    
    # Low stock products
    low_stock_threshold = 5
    low_stock_products = db.query(Product).filter(Product.user_id == user_id, Product.quantity <= low_stock_threshold).all()
    
    return DashboardAnalytics(
        total_inventory_value=total_value,
        total_products=total_products,
        category_wise_stock=category_wise_stock,
        low_stock_products=low_stock_products
    )


@app.post("/analytics/ask", response_model=AIQueryResponse)
def ask_ai_assistant(
    request: AIQueryRequest,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    user_id = current_user["user_id"]
    products = db.query(Product).filter(Product.user_id == user_id).all()
    
    inventory_context = "\n".join([
        f"- {p.name}: {p.quantity} in stock (Category: {p.category}, Price: ₹{p.price:,.2f})"
        for p in products
    ])
    
    prompt = f"""You are an AI Inventory Assistant. Use the following inventory data to answer the user's query.

Reply in a compact, dashboard-friendly format.
Rules:
- Keep the answer short and scannable.
- Prefer 3 to 6 bullets max.
- Start directly with the answer.
- No long introductions or closing remarks.
- Use brief labels like "Low stock", "Category", "Recommended action".
- If helpful, format as bullet points with short lines.

Inventory Data:
{inventory_context}

User Query: {request.query}
"""
    
    try:
        if genai_client is None:
            answer = "Error generating response: GEMINI_API_KEY is not configured."
        else:
            response = genai_client.models.generate_content(
                model="gemini-3.6-flash",
                contents=prompt,
            )
            answer = response.text
    except Exception as e:
        answer = f"Error generating response: {str(e)}"
        
    return AIQueryResponse(answer=answer)


@app.get("/analytics/predict-demand", response_model=DemandPredictionResponse)
def predict_demand(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    user_id = current_user["user_id"]
    products = db.query(Product).filter(Product.user_id == user_id).all()
    
    inventory_context = "\n".join([f"- ID:{p.id} {p.name}: {p.quantity} in stock" for p in products])
    
    prompt = f"""You are an AI Demand Prediction Assistant. Based on the following inventory data, predict which products might need reordering soon.
Give a reason and a suggested reorder quantity for products that have low stock (e.g., under 10). If none are low, suggest 0 for reorder.
Output your response as JSON in the exact following format without markdown blocks:
[
  {{"product_id": 1, "suggested_reorder_quantity": 50, "reason": "Low stock level"}}, ...
]

Inventory Data:
{inventory_context}
"""
    try:
        if genai_client is None:
            raise Exception("GEMINI_API_KEY is not configured.")

        response = genai_client.models.generate_content(
            model="gemini-3.6-flash",
            contents=prompt,
        )
        text_resp = response.text
        import json
        text_resp = text_resp.replace('```json', '').replace('```', '').strip()
        predictions = json.loads(text_resp)
        
        recommendations = []
        for p in products:
            for pred in predictions:
                if pred.get("product_id") == p.id:
                    recommendations.append(DemandPredictionItem(
                        product_id=p.id,
                        name=p.name,
                        current_quantity=p.quantity,
                        suggested_reorder_quantity=pred.get("suggested_reorder_quantity", 0),
                        reason=pred.get("reason", "")
                    ))
    except Exception as e:
        recommendations = [
            DemandPredictionItem(
                product_id=p.id,
                name=p.name,
                current_quantity=p.quantity,
                suggested_reorder_quantity=max(0, 20 - p.quantity),
                reason="Low stock (rule-based fallback)"
            ) for p in products if p.quantity < 10
        ]
        
    return DemandPredictionResponse(recommendations=recommendations)