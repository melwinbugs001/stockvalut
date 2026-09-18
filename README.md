# StockVault - Inventory Management System

StockVault is a modern, full-stack inventory management application. It allows businesses to track products, monitor stock levels in real-time, and leverage advanced AI features to predict demand and ask natural language questions about their inventory.

## 🚀 Features

### Core Capabilities
- **User Authentication:** Secure signup and login with JWT-based authentication.
- **Inventory Management:** Full CRUD (Create, Read, Update, Delete) operations for products.
- **Search & Filter:** Find products quickly by name, category, or price range.
- **Analytics Dashboard:** Visual insights into total inventory value, category-wise stock distribution, and low-stock alerts.

### AI Features (Powered by Google Gemini)
- **AI Inventory Assistant:** A chat interface where you can ask natural language questions about your stock (e.g., *"Which products are running low?"*).
- **Demand Prediction:** Uses AI to analyze current stock levels and suggest which products need to be reordered and by how much.

---

## 🛠️ Tech Stack

**Backend:**
- **Framework:** FastAPI (Python)
- **Database:** SQLite with SQLAlchemy ORM
- **Migrations:** Alembic
- **AI Integration:** Google GenAI (`google-genai`)
- **Security:** Passlib (Bcrypt) & Python-JOSE (JWT)

**Frontend:**
- **Framework:** React + Vite
- **Styling:** Custom CSS (Light theme)
- **Charts:** Recharts

---

## ⚙️ Setup Instructions

### 1. Backend Setup

1. Open a terminal in the `inventory_api` folder.
2. Ensure you have a Python Virtual Environment (`.venv`) set up. 
3. Install the required Python packages (if not already installed):
   ```bash
   pip install fastapi uvicorn sqlalchemy pydantic alembic python-dotenv passlib[bcrypt] python-jose[cryptography] google-genai
   ```
4. Create a `.env` file in the root directory and add your secret keys:
   ```env
   SECRET_KEY=my-super-secret-key
   GEMINI_API_KEY=your_google_gemini_api_key_here
   ```
   *(Get your Gemini API key from [Google AI Studio](https://aistudio.google.com/))*
5. Apply database migrations:
   ```bash
   alembic upgrade head
   ```
6. **Start the Backend:** Use the provided startup script:
   ```bash
   .\run_backend.bat
   ```
   *The backend will be available at `http://127.0.0.1:8000`*

### 2. Frontend Setup

1. Open a new terminal and navigate to the `frontend` folder:
   ```bash
   cd frontend
   ```
2. Install the required Node packages:
   ```bash
   npm install
   ```
3. **Start the Frontend:**
   ```bash
   npm run dev
   ```
   *The frontend will be available at `http://localhost:5173` (or the port Vite provides).*

---

## 📡 API Endpoints

### Authentication
- `POST /users` - Create a new user account.
- `POST /login` - Get a JWT access token.

### Products
- `GET /products` - List all products for the logged-in user.
- `POST /products` - Add a new product.
- `PUT /products/{id}` - Fully update a product.
- `PATCH /products/{id}` - Partially update a product.
- `DELETE /products/{id}` - Remove a product.
- `GET /products/search` - Search products by name.
- `GET /products/filter` - Filter products by price range.

### Analytics & AI
- `GET /analytics/dashboard` - Get aggregated dashboard metrics and low-stock alerts.
- `POST /analytics/ask` - Ask the AI a question about your inventory.
- `GET /analytics/predict-demand` - Get AI-generated reorder recommendations.
