import { useEffect, useState } from "react";
import "./App.css";
import AIAssistant from "./AIAssistant";
import DashboardCharts from "./DashboardCharts";

const API_URL =
  import.meta.env.VITE_API_URL || `http://${window.location.hostname}:8000`;

function App() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [products, setProducts] = useState([]);
  const [message, setMessage] = useState("");
  const [loggedIn, setLoggedIn] = useState(false);
  const [userName, setUserName] = useState(
    localStorage.getItem("user_name") || ""
  );
  const [loading, setLoading] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [authMode, setAuthMode] = useState("login");
  const [name, setName] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [typedWord, setTypedWord] = useState("");
  const [route, setRoute] = useState(() => window.location.pathname || "/");
  const [aboutGlow, setAboutGlow] = useState({ x: 50, y: 50 });
  const [landingGlow, setLandingGlow] = useState({ x: 50, y: 50 });
  const brandLetters = "StockVault".split("");
  const [wordIndex, setWordIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  const [productName, setProductName] = useState("");
  const [productPrice, setProductPrice] = useState("");
  const [productQuantity, setProductQuantity] = useState("");
  const [productCategory, setProductCategory] = useState("");
  const [editingProductId, setEditingProductId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [isCategorySidebarOpen, setIsCategorySidebarOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [isAddProductModalOpen, setIsAddProductModalOpen] = useState(false);
  const PAGE_SIZE = 10;

  const normalizeCategory = (category = "") => {
    const trimmed = category.trim();

    if (!trimmed) {
      return "";
    }

    return trimmed
      .toLowerCase()
      .replace(/\s+/g, " ")
      .replace(/\b(accessaries|accesaries|accesories|accessorys)\b/g, "accessories");
  };

  const navigate = (nextPath) => {
    window.history.pushState({}, "", nextPath);
    setRoute(nextPath);
  };

  const logout = async () => {
    try {
      await fetch(`${API_URL}/logout`, {
        method: "POST",
        credentials: "include",
      });
    } catch (error) {
      console.error("Logout error:", error);
    }

    localStorage.removeItem("user_name");
    setUserName("");
    setLoggedIn(false);
    setProducts([]);
    setMessage("");
    setShowLogin(false);
    setAuthMode("login");
    setEmail("");
    setPassword("");
    setConfirmPassword("");
    setName("");
    navigate("/login");
  };

  const resetProductForm = () => {
    setProductName("");
    setProductPrice("");
    setProductQuantity("");
    setProductCategory("");
    setEditingProductId(null);
  };

  const handleEditProduct = (product) => {
    setEditingProductId(product.id);
    setProductName(product.name);
    setProductPrice(String(product.price));
    setProductQuantity(String(product.quantity));
    setProductCategory(product.category);
    setIsAddProductModalOpen(true);
    setMessage("");
  };

  useEffect(() => {
    const words = ["stock smarter", "operations smoother", "inventory clearer"];
    const currentWord = words[wordIndex % words.length];

    const typingSpeed = isDeleting ? 75 : 120;

    const timeout = setTimeout(() => {
      if (!isDeleting) {
        setTypedWord(currentWord.slice(0, typedWord.length + 1));

        if (typedWord.length + 1 === currentWord.length) {
          setTimeout(() => setIsDeleting(true), 900);
        }
      } else {
        setTypedWord(currentWord.slice(0, typedWord.length - 1));

        if (typedWord.length - 1 === 0) {
          setIsDeleting(false);
          setWordIndex((prev) => (prev + 1) % words.length);
        }
      }
    }, typingSpeed);

    return () => clearTimeout(timeout);
  }, [typedWord, isDeleting, wordIndex]);

  useEffect(() => {
    const checkSession = async () => {
      try {
        const response = await fetch(`${API_URL}/protected`, {
          method: "GET",
          credentials: "include",
        });

        if (response.ok) {
          setLoggedIn(true);
          fetchProducts(false);
        } else {
          setLoggedIn(false);
          if (window.location.pathname === "/dashboard") {
            navigate("/login");
          }
        }
      } catch (error) {
        setLoggedIn(false);
        if (window.location.pathname === "/dashboard") {
          navigate("/login");
        }
      }
    };

    checkSession();
  }, []);

  useEffect(() => {
    if (loggedIn) {
      fetchProducts(false);
    }
  }, [loggedIn]);

  useEffect(() => {
    const handlePopState = () => {
      setRoute(window.location.pathname || "/");
    };

    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, []);

  const openAuth = (mode) => {
    setAuthMode(mode);
    setShowLogin(true);
    setMessage("");
    navigate("/login");
  };

  const openAddProductModal = () => {
    setMessage("");
    setIsAddProductModalOpen(true);
  };

  const closeAddProductModal = () => {
    setIsAddProductModalOpen(false);
    resetProductForm();
  };

  const switchAuthMode = (mode) => {
    setAuthMode(mode);
    setPassword("");
    setConfirmPassword("");
    setName("");
  };

  const handleLogin = async (e) => {
    e.preventDefault();

    setLoading(true);
    setMessage("Logging in...");

    const formData = new URLSearchParams();

    formData.append("username", email);
    formData.append("password", password);

    try {
      const response = await fetch(`${API_URL}/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        credentials: "include",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.detail || "Login failed");
        setLoading(false);
        return;
      }

      const storedName = localStorage.getItem("user_name");
      const greetingName =
        (storedName && storedName.trim()) ||
        email.split("@")[0].replace(/[._-]/g, " ").trim() ||
        "there";

      localStorage.setItem("user_name", greetingName);
      setUserName(greetingName);
      setLoggedIn(true);
      setShowLogin(false);
      setMessage("");
      navigate("/dashboard");
    } catch (error) {
      setMessage("Unable to connect to the API.");
    }

    setLoading(false);
  };

  const handleSignup = async (e) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      setMessage("Passwords do not match.");
      return;
    }

    if (password.length < 6) {
      setMessage("Password must be at least 6 characters long.");
      return;
    }

    setLoading(true);
    setMessage("Creating account...");

    try {
      const response = await fetch(`${API_URL}/users`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          email,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.detail === "Email already registered") {
          setAuthMode("login");
          setMessage("Email already registered. Please log in instead.");
          setLoading(false);
          return;
        }

        setMessage(data.detail || "Sign up failed.");
        setLoading(false);
        return;
      }

      const displayName = (name || email.split("@")[0]).trim() || "there";
      localStorage.setItem("user_name", displayName);
      setUserName(displayName);

      setMessage("Account created successfully! Logging you in...");

      const formData = new URLSearchParams();
      formData.append("username", email);
      formData.append("password", password);

      const loginResponse = await fetch(`${API_URL}/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        credentials: "include",
        body: formData,
      });

      const loginData = await loginResponse.json();

      if (!loginResponse.ok) {
        setAuthMode("login");
        setMessage(loginData.detail || "Account created, but login failed. Please try logging in.");
        setLoading(false);
        return;
      }

      setLoggedIn(true);
      setShowLogin(false);
      setAuthMode("login");
      setName("");
      setPassword("");
      setConfirmPassword("");
      setMessage("");
      setLoading(false);
      navigate("/dashboard");
    } catch (error) {
      setMessage("Unable to connect to the API.");
      setLoading(false);
    }
  };

  const fetchProducts = async (showMessage = true) => {
    try {
      const response = await fetch(`${API_URL}/products`, {
        method: "GET",
        credentials: "include",
        cache: "no-store",
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          logout();
          return;
        }

        setMessage(data.detail || "Failed to refresh products");
        return;
      }

      setProducts(
        data.map((product) => ({
          ...product,
          category: normalizeCategory(product.category),
        }))
      );

      if (showMessage) {
        setMessage("Products refreshed successfully!");

        setTimeout(() => {
          setMessage("");
        }, 2000);
      }
    } catch (error) {
      console.error("Refresh error:", error);
      setMessage("Unable to connect to the API.");
    }
  };

  const handleAddProduct = async (e) => {
    e.preventDefault();

    setMessage(editingProductId ? "Updating product..." : "Adding product...");

    const productData = {
      name: productName,
      price: Number(productPrice),
      quantity: Number(productQuantity),
      category: normalizeCategory(productCategory),
    };

    try {
      const response = await fetch(
        editingProductId
          ? `${API_URL}/products/${editingProductId}`
          : `${API_URL}/products`,
        {
          method: editingProductId ? "PUT" : "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify(productData),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setMessage(
          data.detail ||
            (editingProductId ? "Failed to update product" : "Failed to add product")
        );
        return;
      }

      const wasEditing = Boolean(editingProductId);

      resetProductForm();
      setMessage(
        wasEditing ? "Product updated successfully!" : "Product added successfully!"
      );

      setTimeout(() => {
        setMessage("");
      }, 2000);

      await fetchProducts(false);
      setIsAddProductModalOpen(false);
    } catch (error) {
      setMessage("Unable to connect to the API.");
    }
  };

  const categoryOptions = [
    "All",
    ...Array.from(
      new Set(
        products
          .map((product) => normalizeCategory(product.category))
          .filter((category) => category && category.trim() !== "")
      )
    ),
  ];

  const lowStockProducts = products.filter(
    (product) => product.quantity <= 10
  );

  const totalQuantity = products.reduce(
    (total, product) => total + product.quantity,
    0
  );

  const totalInventoryValue = products.reduce(
    (total, product) => total + product.price * product.quantity,
    0
  );

  const categorySummary = Object.values(
    products.reduce((accumulator, product) => {
      const normalizedCategory = normalizeCategory(product.category) || "uncategorized";

      if (!accumulator[normalizedCategory]) {
        accumulator[normalizedCategory] = {
          name: normalizedCategory,
          stock: 0,
          value: 0,
        };
      }

      accumulator[normalizedCategory].stock += product.quantity;
      accumulator[normalizedCategory].value += product.price * product.quantity;

      return accumulator;
    }, {})
  )
    .map((category) => ({
      ...category,
      share:
        totalQuantity > 0 ? (category.stock / totalQuantity) * 100 : 0,
    }))
    .sort((a, b) => b.stock - a.stock);

  const topCategory = categorySummary[0];

  const filteredProducts = products.filter((product) => {
    const normalizedProductCategory = normalizeCategory(product.category);
    const matchesCategory =
      selectedCategory === "All" || normalizedProductCategory === selectedCategory;

    if (!matchesCategory) {
      return false;
    }

    const searchValue = searchTerm.trim().toLowerCase();

    if (!searchValue) {
      return true;
    }

    return [
      product.name,
      product.category,
      String(product.id),
      String(product.quantity),
      String(product.price),
    ].some((value) => value.toLowerCase().includes(searchValue));
  });

  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / PAGE_SIZE));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const pageNumbers = Array.from({ length: totalPages }, (_, index) => index + 1);
  const paginatedProducts = filteredProducts
    .slice((safeCurrentPage - 1) * PAGE_SIZE, safeCurrentPage * PAGE_SIZE)
    .map((product, index) => ({
      ...product,
      displayNumber: (safeCurrentPage - 1) * PAGE_SIZE + index + 1,
    }));

  const handleDeleteProduct = async (productId) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete product #${productId}?`
    );

    if (!confirmed) {
      return;
    }

    try {
      const response = await fetch(`${API_URL}/products/${productId}`, {
        method: "DELETE",
        credentials: "include",
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.detail || "Failed to delete product");
        return;
      }

      setMessage("Product deleted successfully!");

      const productsResponse = await fetch(`${API_URL}/products`, {
        method: "GET",
        credentials: "include",
        cache: "no-store",
      });

      const updatedProducts = await productsResponse.json();

      if (productsResponse.ok) {
        setProducts([...updatedProducts]);
      }

      setTimeout(() => {
        setMessage("");
      }, 2000);
    } catch (error) {
      console.error("Delete error:", error);
      setMessage("Unable to connect to the API.");
    }
  };

  if (route === "/dashboard" && loggedIn) {
    return (
      <div className="dashboard">
        <nav className="navbar">
          <div>
            <button
              type="button"
              className="brand-button"
              onClick={() => {
                setMessage("");
                setShowLogin(false);
                navigate("/");
              }}
            >
              <h2>StockVault</h2>
            </button>
            <span>Inventory Management System</span>
          </div>

          <button className="logout-button" onClick={logout}>
            Logout
          </button>
        </nav>
        <main className="dashboard-content">
          <div className="dashboard-layout">
            {isCategorySidebarOpen && (
              <aside className="category-sidebar">
                <div className="category-sidebar-header">
                  <h3>Categories</h3>
                  <span>{categoryOptions.length - 1} items</span>
                </div>

                <div className="category-list">
                  {categoryOptions.map((category) => (
                    <button
                      key={category}
                      type="button"
                      className={`category-button ${
                        selectedCategory === category ? "active" : ""
                      }`}
                      onClick={() => {
                        setSelectedCategory(category);
                        setCurrentPage(1);
                      }}
                    >
                      {category === "All" ? "Categories" : category}
                    </button>
                  ))}
                </div>
              </aside>
            )}

            <div className="dashboard-main-panel">
              <div className="dashboard-header">
                <div className="dashboard-header-copy">
                  <p className="dashboard-greeting">Hi {userName || "there"} 👋</p>
                  <h1>Here is your dashboard</h1>
                  <p className="dashboard-subtitle">Manage your inventory</p>
                </div>

              </div>

              <div className="summary-grid">
                <div className="summary-card">
                  <h3>Total Products</h3>
                  <p>{products.length}</p>
                </div>

                <div className="summary-card">
                  <h3>Total Quantity</h3>
                  <p>{totalQuantity}</p>
                </div>

                <div className="summary-card">
                  <h3>Total Inventory Value</h3>
                  <p>₹{totalInventoryValue.toLocaleString("en-IN")}</p>
                </div>

                <div className="summary-card">
                  <h3>Low Stock</h3>
                  <p>{lowStockProducts.length}</p>
                </div>
              </div>

              <div className="analytics-grid">
                <div className="category-panel">
                  <div className="section-header">
                    <h2>Category Insights</h2>
                    <span>{categorySummary.length} categories</span>
                  </div>

                  <div className="category-list-compact">
                    {categorySummary.slice(0, 4).map((category) => (
                      <div className="category-row" key={category.name}>
                        <div className="category-row-top">
                          <div>
                            <strong>{category.name}</strong>
                            <span>{category.stock} units</span>
                          </div>

                          <strong>{category.share.toFixed(0)}%</strong>
                        </div>

                        <div className="category-meter">
                          <span
                            style={{
                              width: `${Math.max(category.share, 10)}%`,
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <DashboardCharts categorySummary={categorySummary} />

                  {topCategory && (
                    <div className="top-category-banner">
                      <span>Top category</span>
                      <strong>{topCategory.name}</strong>
                    </div>
                  )}
                </div>

                <div className="low-stock-card">
                  <div className="section-header">
                    <h2>Low Stock Products</h2>
                    <span>{lowStockProducts.length} items</span>
                  </div>

                  {lowStockProducts.length === 0 ? (
                    <p className="no-low-stock">
                      ✅ All products have sufficient stock.
                    </p>
                  ) : (
                    <div className="low-stock-list">
                      {lowStockProducts.map((product) => (
                        <div className="low-stock-item" key={product.id}>
                          <div>
                            <strong>{product.name}</strong>
                            <p>{product.category}</p>
                          </div>

                          <span className="stock-warning">
                            {product.quantity} left
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <AIAssistant />

              {isAddProductModalOpen && (
                <div className="modal-overlay" onClick={closeAddProductModal}>
                  <div
                    className="modal-card"
                    onClick={(event) => event.stopPropagation()}
                  >
                    <div className="modal-header">
                      <div>
                        <p className="eyebrow">Inventory</p>
                        <h2>
                          {editingProductId ? "Update Product" : "Add Product"}
                        </h2>
                      </div>

                      <button
                        type="button"
                        className="modal-close-button"
                        onClick={closeAddProductModal}
                        aria-label="Close modal"
                      >
                        ✕
                      </button>
                    </div>

                    <form onSubmit={handleAddProduct} className="modal-form">
                      <div className="modal-fields">
                        <div className="form-group">
                          <label>Product Name</label>
                          <input
                            type="text"
                            placeholder="Enter product name"
                            value={productName}
                            onChange={(e) => setProductName(e.target.value)}
                            required
                          />
                        </div>

                        <div className="form-group">
                          <label>Price</label>
                          <input
                            type="number"
                            placeholder="Enter price"
                            min="0"
                            step="0.01"
                            value={productPrice}
                            onChange={(e) => setProductPrice(e.target.value)}
                            required
                          />
                        </div>

                        <div className="form-group">
                          <label>Quantity</label>
                          <input
                            type="number"
                            placeholder="Enter quantity"
                            min="0"
                            value={productQuantity}
                            onChange={(e) => setProductQuantity(e.target.value)}
                            required
                          />
                        </div>

                        <div className="form-group">
                          <label>Category</label>
                          <input
                            type="text"
                            placeholder="Enter category"
                            value={productCategory}
                            onChange={(e) => setProductCategory(e.target.value)}
                            required
                          />
                        </div>
                      </div>

                      <div className="modal-actions">
                        <button
                          type="button"
                          className="cancel-button"
                          onClick={closeAddProductModal}
                        >
                          Cancel
                        </button>
                        <button className="add-button" type="submit">
                          {editingProductId ? "Save Changes" : "+ Add Product"}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}

              {message && <p className="product-message">{message}</p>}

              <div className="products-card">
                <div className="products-header">
                  <div className="products-heading">
                    <h2>Your Products</h2>
                    <span>{filteredProducts.length} items</span>
                  </div>

                  <div className="products-toolbar">
                    <div className="products-search-wrap">
                      <span className="search-icon">⌕</span>
                      <input
                        type="text"
                        className="products-search"
                        placeholder="Search products"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>

                    <select
                      className="products-select"
                      value={selectedCategory}
                      onChange={(event) => {
                        setSelectedCategory(event.target.value);
                        setCurrentPage(1);
                      }}
                    >
                      {categoryOptions.map((category) => (
                        <option key={category} value={category}>
                          {category === "All" ? "Categories" : category}
                        </option>
                      ))}
                    </select>

                    <button
                      type="button"
                      className="primary-button"
                      onClick={openAddProductModal}
                    >
                      + Add Product
                    </button>

                    <button
                      className="refresh-button"
                      onClick={() => {
                        fetchProducts();
                        setProductName("");
                        setProductPrice("");
                        setProductQuantity("");
                        setProductCategory("");
                        setMessage("");
                      }}
                    >
                      ↻ Refresh
                    </button>
                  </div>
                </div>

                {filteredProducts.length === 0 ? (
                  <div className="empty-state">
                    <h3>No products found</h3>
                    <p>
                      {searchTerm
                        ? "Try a different search term."
                        : selectedCategory === "All"
                          ? "Your inventory is currently empty."
                          : `No products found in ${selectedCategory}.`}
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="table-container">
                      <table>
                        <thead>
                          <tr>
                            <th>ID</th>
                            <th>Product</th>
                            <th>Category</th>
                            <th>Price</th>
                            <th>Quantity</th>
                            <th>Value</th>
                            <th>Actions</th>
                          </tr>
                        </thead>

                        <tbody>
                          {paginatedProducts.map((product) => (
                            <tr key={product.id}>
                              <td>#{product.displayNumber}</td>
                              <td className="product-name">{product.name}</td>
                              <td>
                                <span className="category">{product.category}</span>
                              </td>
                              <td>₹{product.price.toLocaleString("en-IN")}</td>
                              <td>{product.quantity}</td>
                              <td>
                                ₹
                                {(product.price * product.quantity).toLocaleString("en-IN")}
                              </td>

                              <td className="actions">
                                <button
                                  className="edit-button"
                                  onClick={() => handleEditProduct(product)}
                                >
                                  ✏️ Edit
                                </button>

                                <button
                                  className="delete-button"
                                  onClick={() => handleDeleteProduct(product.id)}
                                >
                                  🗑️ Delete
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {filteredProducts.length > PAGE_SIZE && (
                      <div className="pagination">
                        <button
                          className="pagination-button"
                          disabled={safeCurrentPage === 1}
                          onClick={() => setCurrentPage((page) => Math.max(page - 1, 1))}
                          aria-label="Previous page"
                        >
                          «
                        </button>

                        <div className="pagination-numbers">
                          {pageNumbers.map((page) => (
                            <button
                              key={page}
                              className={`pagination-number ${
                                page === safeCurrentPage ? "active" : ""
                              }`}
                              onClick={() => setCurrentPage(page)}
                            >
                              {page}
                            </button>
                          ))}
                        </div>

                        <button
                          className="pagination-button"
                          disabled={safeCurrentPage === totalPages}
                          onClick={() =>
                            setCurrentPage((page) => Math.min(page + 1, totalPages))
                          }
                          aria-label="Next page"
                        >
                          »
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (route === "/login") {

    return (
      <div className="auth-page">
        <div className="auth-shell">
          <div className="auth-visual">
            <div className="auth-visual-header">
              <span className="auth-badge">Smart tracking</span>
              <span className="auth-badge">Secure access</span>
            </div>

            <img
              src="https://images.unsplash.com/photo-1556740749-887f6717d7e4?auto=format&fit=crop&w=900&q=80"
              alt="Inventory management preview"
            />

            <div className="auth-visual-card glass-card">
              <strong>12,480</strong>
              <span>items tracked this week</span>
            </div>

            <div className="auth-visual-card small-card">
              <strong>98.4%</strong>
              <span>stock accuracy</span>
            </div>
          </div>

          <div className="login-card auth-card">
            <button
              type="button"
              className="back-home-button"
              onClick={() => {
                setShowLogin(false);
                switchAuthMode("login");
                navigate("/");
              }}
            >
              ← Back to home
            </button>

            <div className="auth-intro">
              <p className="eyebrow auth-eyebrow">
                {authMode === "login" ? "WELCOME BACK" : "CREATE ACCOUNT"}
              </p>
              <h1>{authMode === "login" ? "StockVault" : "Join StockVault"}</h1>
              <p className="subtitle">
                {authMode === "login"
                  ? "Track inventory, move faster, and stay in control from one smart workspace."
                  : "Create your account and start managing products, stock, and reports in minutes."}
              </p>
            </div>

            <form onSubmit={authMode === "login" ? handleLogin : handleSignup}>
              {authMode === "signup" && (
                <>
                  <label>Full Name</label>
                  <input
                    type="text"
                    placeholder="Enter your full name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </>
              )}

              <label>Email</label>
              <input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />

              <label>Password</label>
              <input
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />

              {authMode === "signup" && (
                <>
                  <label>Confirm Password</label>
                  <input
                    type="password"
                    placeholder="Confirm your password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                </>
              )}

              <button type="submit" disabled={loading}>
                {loading
                  ? authMode === "login"
                    ? "Logging in..."
                    : "Creating account..."
                  : authMode === "login"
                    ? "Login"
                    : "Create Account"}
              </button>
            </form>

            <div className="auth-switch">
              {authMode === "login" ? (
                <>
                  <span>New here?</span>
                  <button
                    type="button"
                    className="auth-link-button"
                    onClick={() => switchAuthMode("signup")}
                  >
                    Sign up
                  </button>
                </>
              ) : (
                <>
                  <span>Already have an account?</span>
                  <button
                    type="button"
                    className="auth-link-button"
                    onClick={() => switchAuthMode("login")}
                  >
                    Login
                  </button>
                </>
              )}
            </div>

            {message && <p className="message">{message}</p>}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="landing-page">
      <header className="landing-header visible">
        <div className="brand-wrap">
          <div className="brand-mark">S</div>
          <div>
            <div className="brand-name">
              {brandLetters.map((letter, index) => (
                <span key={`${letter}-${index}`} className={`brand-letter brand-letter-${index % 5}`}>
                  {letter}
                </span>
              ))}
            </div>
            <div className="brand-subtitle">Inventory Management</div>
          </div>
        </div>

        <div className="header-actions">
          <nav className="landing-nav">
            <a href="#features">Features</a>
            <a href="#about">About</a>
            <a href="#contact">Contact</a>
          </nav>

          <button className="nav-login visible" onClick={() => openAuth("login")}>
            Login
          </button>
        </div>
      </header>

      <main className="landing-main">
        <section className="hero-section">
          <div className="hero-copy">
            <div className="hero-badges">
              <span>Inventory Control</span>
              <span>Live Dashboard</span>
              <span>Secure Access</span>
            </div>

            <p className="eyebrow">SMART INVENTORY FOR MODERN BUSINESSES</p>
            <h1>
              Run your
              <span className="typed-line"> {typedWord}</span>
              <span className="cursor" aria-hidden="true">|</span>
            </h1>
            <p className="hero-text">
              StockVault helps you track products, monitor stock levels, and manage
              inventory with confidence from one elegant dashboard.
            </p>

            <div className="hero-actions">
              <button className="primary-button" onClick={() => openAuth("signup")}>
                Get Started
              </button>
              <a className="secondary-button" href="#features">
                Explore Features
              </a>
            </div>

            <div className="hero-stats">
              <div>
                <strong>5x</strong>
                <span>Faster inventory checks</span>
              </div>
              <div>
                <strong>24/7</strong>
                <span>Live visibility</span>
              </div>
              <div>
                <strong>100%</strong>
                <span>Secure access</span>
              </div>
            </div>
          </div>

          <div className="hero-visual">
            <div
              className="dashboard-preview"
              style={{
                "--pointer-x": `${landingGlow.x}%`,
                "--pointer-y": `${landingGlow.y}%`,
              }}
              onMouseMove={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const x = ((e.clientX - rect.left) / rect.width) * 100;
                const y = ((e.clientY - rect.top) / rect.height) * 100;
                setLandingGlow({ x, y });
              }}
              onMouseLeave={() => setLandingGlow({ x: 50, y: 50 })}
            >
              <div className="preview-topbar">
                <span />
                <span />
                <span />
              </div>

              <div className="preview-content">
                <div className="preview-panel preview-panel-large">
                  <small>Total Inventory</small>
                  <strong>₹2,48,900</strong>
                </div>

                <div className="preview-panels">
                  <div className="preview-panel">
                    <small>Products</small>
                    <strong>180</strong>
                  </div>
                  <div className="preview-panel">
                    <small>Low Stock</small>
                    <strong>14</strong>
                  </div>
                </div>

                <div className="preview-table">
                  <div className="preview-row heading">
                    <span>Item</span>
                    <span>Qty</span>
                  </div>
                  <div className="preview-row">
                    <span>Wireless Mouse</span>
                    <span>48</span>
                  </div>
                  <div className="preview-row">
                    <span>USB Cable</span>
                    <span>32</span>
                  </div>
                  <div className="preview-row">
                    <span>Keyboard</span>
                    <span>17</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="features" className="feature-section">
          <div className="section-heading">
            <p className="eyebrow">WHY STOCKVAULT</p>
            <h2>Everything you need to manage stock with confidence.</h2>
          </div>

          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">📦</div>
              <h3>Smart Product Tracking</h3>
              <p>Track every item with product names, quantities, pricing, and categories.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">📈</div>
              <h3>Inventory Insights</h3>
              <p>See stock value, totals, and movement at a glance across your catalog.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🔒</div>
              <h3>Secure Access</h3>
              <p>Role-based protection ensures your inventory stays safe and private.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">⚡</div>
              <h3>Fast Operations</h3>
              <p>Add, update, delete, and refresh inventory records in seconds.</p>
            </div>
          </div>
        </section>

        <section id="about" className="about-section">
          <div
            className="about-card"
            style={{
              "--pointer-x": `${aboutGlow.x}%`,
              "--pointer-y": `${aboutGlow.y}%`,
            }}
            onMouseMove={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const x = ((e.clientX - rect.left) / rect.width) * 100;
              const y = ((e.clientY - rect.top) / rect.height) * 100;
              setAboutGlow({ x, y });
            }}
            onMouseLeave={() => setAboutGlow({ x: 50, y: 50 })}
          >
            <div className="about-copy">
              <p className="eyebrow">ABOUT US</p>
              <h2>Built for businesses that want clean, controlled stock management.</h2>
              <p>
                StockVault brings together lightweight inventory control, clear reporting,
                and a streamlined experience so you can spend less time chasing records and
                more time growing your store or business.
              </p>
            </div>

            <div className="about-points">
              <div>
                <strong>01</strong>
                <span>Organized inventory management</span>
              </div>
              <div>
                <strong>02</strong>
                <span>Real-time dashboard visibility</span>
              </div>
              <div>
                <strong>03</strong>
                <span>Simple and secure login access</span>
              </div>
            </div>
          </div>
        </section>

        <section id="contact" className="cta-section">
          <div className="cta-box">
            <div className="contact-copy">
              <p className="eyebrow">CONTACT US</p>
              <h2>Take control of your inventory today.</h2>
            </div>

            <div className="contact-details">
              <div className="contact-item">
                <span className="contact-label">Phone</span>
                <a href="tel:+919876543210">+91 98765 43210</a>
              </div>
              <div className="contact-item">
                <span className="contact-label">Email</span>
                <a href="mailto:support@stockvault.in">support@stockvault.in</a>
              </div>
            </div>

            <button className="primary-button" onClick={() => openAuth("login")}>
              Login to Dashboard
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}

export default App;

