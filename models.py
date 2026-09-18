from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from database import Base


class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True)
    name = Column(String)
    price = Column(Float)
    quantity = Column(Integer)
    category = Column(String)

    user_id = Column(Integer, ForeignKey("users.id"))
    user = relationship("User", back_populates="products")
    transactions = relationship("StockTransaction", back_populates="product", cascade="all, delete-orphan")


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True)
    name = Column(String)
    email = Column(String, unique=True)
    password = Column(String)

    products = relationship("Product", back_populates="user")


class StockTransaction(Base):
    __tablename__ = "stock_transactions"

    id = Column(Integer, primary_key=True)
    product_id = Column(Integer, ForeignKey("products.id"))
    quantity_change = Column(Integer)
    transaction_type = Column(String) # "in" or "out"
    timestamp = Column(DateTime, default=func.now())

    product = relationship("Product", back_populates="transactions")