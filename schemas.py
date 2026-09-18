from pydantic import BaseModel, Field


class ProductCreate(BaseModel):
    name: str = Field(min_length=1)
    price: float = Field(ge=0)
    quantity: int = Field(ge=0)
    category: str = Field(min_length=1)


class ProductUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1)
    price: float | None = Field(default=None, ge=0)
    quantity: int | None = Field(default=None, ge=0)
    category: str | None = Field(default=None, min_length=1)


class UserCreate(BaseModel):
    name: str = Field(min_length=1)
    email: str = Field(min_length=1)
    password: str = Field(min_length=6)


class ProductResponse(BaseModel):
    id: int
    name: str
    price: float
    quantity: int
    category: str


class UserResponse(BaseModel):
    id: int
    name: str
    email: str
    products: list[ProductResponse]


class CategoryStock(BaseModel):
    category: str
    total_quantity: int


class DashboardAnalytics(BaseModel):
    total_inventory_value: float
    total_products: int
    category_wise_stock: list[CategoryStock]
    low_stock_products: list[ProductResponse]


class AIQueryRequest(BaseModel):
    query: str


class AIQueryResponse(BaseModel):
    answer: str


class DemandPredictionItem(BaseModel):
    product_id: int
    name: str
    current_quantity: int
    suggested_reorder_quantity: int
    reason: str


class DemandPredictionResponse(BaseModel):
    recommendations: list[DemandPredictionItem]