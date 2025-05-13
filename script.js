// Safe wrapper for localStorage.setItem using JSON.stringify
function saveToStorage(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.warn(`Error saving "${key}" to localStorage:`, e);
    }
  }
  
  /** Safe wrapper for localStorage.getItem using JSON.parse */
  function loadFromStorage(key) {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : null;
    } catch (e) {
      console.warn(`Error loading "${key}" from localStorage:`, e);
      // If data is corrupted JSON, remove it to avoid looping on bad data
      localStorage.removeItem(key);
      return null;
    }
  }
  
  // ----- Application State -----
  
  // In-memory copies of our data (will be synced with localStorage)
  let users = [];
  let products = [];
  let orders = [];
  
  // Current logged-in user (object or null). Also track current username and admin status.
  let currentUser = null;
  
  // For product listing pages:
  let currentCategory = null;
  let currentSort = "price-asc";    // default sort for product listings (price ascending)
  let showNewOnly = false;          // flag for "New" page or filtering new arrivals
  
  // ----- Initialize Data on First Load -----
  
  (function initData() {
    // Load any existing data from localStorage (if not present, we'll create defaults)
    const storedUsers = loadFromStorage("users");
    const storedProducts = loadFromStorage("products");
    const storedOrders = loadFromStorage("orders");
  
    if (storedUsers && storedProducts && storedOrders) {
      // Data exists from previous sessions
      users = storedUsers;
      products = storedProducts;
      orders = storedOrders;
    } else {
      // No data found, initialize with some sample data
      users = [
        // Default admin account
        { username: "admin@example.com", password: "admin123", isAdmin: true },
        // A sample regular user (could be used for demo order)
        { username: "testuser@example.com", password: "test1234", isAdmin: false }
      ];
      // Initialize some products (with sample image URLs and varying categories)
      products = [
        { id: 1, name: "Rainbow Dress", category: "Dress", price: 90, image: "images/rainbow-dress.webp", isNew: true, description: "A colorful rainbow-patterned dress, perfect for summer." },
        { id: 2, name: "Peach Dress", category: "Dress", price: 120, image: "images/peach-dress.webp", isNew: true, description: "Elegant peach-toned formal dress for special occasions." },
        { id: 3, name: "Glitter Sandals", category: "Shoes", price: 80, image: "images/glitter-sandals.webp", isNew: false, description: "Shiny glitter sandals to add sparkle to any outfit." },
        { id: 4, name: "Multi Marble Sandals", category: "Shoes", price: 60, image: "images/multi-marble-sandals.webp", isNew: false, description: "Trendy multi-color marble design sandals for casual wear." }
      ];
      
      // Example: mark some products as "New This Week"
      // (Already done via isNew property above for id 1 and 3)
      // Initialize orders (empty or a sample order for demo)
      orders = [];
      // Create a sample order by testuser for demonstration (with id 1)
      const sampleOrderItems = [
        { productId: 1, name: "Rainbow Dress", category: "Dress", price: 90, quantity: 1 },
        { productId: 3, name: "Glitter Sandals", category: "Shoes", price: 80, quantity: 2 }
      ];
      
      orders.push({
        id: 1,
        user: "testuser@example.com",
        date: new Date().toISOString().split("T")[0],  // current date YYYY-MM-DD
        items: sampleOrderItems,
        total: sampleOrderItems.reduce((sum, item) => sum + item.price * item.quantity, 0),
        shipping: { name: "Jane Doe", address: "123 Main St, Anytown" }
      });
      // Save initial data to localStorage
      saveToStorage("users", users);
      saveToStorage("products", products);
      saveToStorage("orders", orders);
    }
  
    // Load current user session if exists
    const sessionUser = loadFromStorage("currentUser");
    if (sessionUser) {
      // Find the user object for the session username
      currentUser = users.find(u => u.username === sessionUser) || null;
    }
  })();
  
  // ----- Utility Functions -----
  
  /** Generate the next product ID (max id + 1) */
  function getNextProductId() {
    return products.length ? Math.max(...products.map(p => p.id)) + 1 : 1;
  }
  
  /** Generate the next order ID */
  function getNextOrderId() {
    return orders.length ? Math.max(...orders.map(o => o.id)) + 1 : 1;
  }
  
  /** Format a number as a price string (e.g., 49.99 -> "$49.99") */
  function formatPrice(num) {
    return "AED " + num.toFixed(2);
  }
  
  
  /** Simple email format check */
  function isValidEmail(email) {
    return /\S+@\S+\.\S+/.test(email);
  }
  
  // ----- Authentication Functions -----
  
  function registerUser(email, password) {
    // Basic validation
    if (!email || !password) {
      alert("Please enter both email and password to register.");
      return false;
    }
    if (!isValidEmail(email)) {
      alert("Please enter a valid email address.");
      return false;
    }
    // Check if email is already taken
    if (users.find(u => u.username === email)) {
      alert("An account with that email already exists.");
      return false;
    }
    // Create new user object
    const newUser = { username: email, password: password, isAdmin: false };
    users.push(newUser);
    saveToStorage("users", users);
    // Auto-login the user after registration
    currentUser = newUser;
    saveToStorage("currentUser", currentUser.username);
    updateNav();  // update navigation bar for logged-in state
    return true;
  }
  
  function loginUser(email, password) {
    if (!email || !password) {
      alert("Please enter email and password.");
      return false;
    }
    const user = users.find(u => u.username === email);
    if (!user) {
      alert("No account found with that email.");
      return false;
    }
    if (user.password !== password) {
      alert("Incorrect password. Please try again.");
      return false;
    }
    // Successful login
    currentUser = user;
    saveToStorage("currentUser", currentUser.username);
    // If there was a guest cart, migrate it to this user
    const guestCart = loadFromStorage("cart_guest");
    if (guestCart && guestCart.length) {
      const userCartKey = "cart_" + currentUser.username;
      const existingCart = loadFromStorage(userCartKey);
      if (!existingCart || existingCart.length === 0) {
        // If user had no saved cart, use the guest cart
        saveToStorage(userCartKey, guestCart);
      }
      localStorage.removeItem("cart_guest");
    }
    updateNav();
    return true;
  }
  
  function logoutUser() {
    if (currentUser) {

      currentUser = null;
      localStorage.removeItem("currentUser");
      updateNav();
      document.getElementById("logout-link").addEventListener("click", (e) => {
        e.preventDefault();
        logoutUser();
        location.hash = "#home";
      });
      
      window.addEventListener("hashchange", handleRoute);
    }
  }
  
  // ----- Update Navigation UI based on login state -----
  function updateNav() {
    const navUserSpan = document.getElementById("nav-user");
    const navLogoutSpan = document.getElementById("nav-logout");
    const navUsername = document.getElementById("nav-username");
    const adminLinkItem = document.getElementById("admin-link");
    if (currentUser) {
      // Logged in state
      navUserSpan.style.display = "none";
      navLogoutSpan.style.display = "inline";
      if (navUsername) navUsername.textContent = currentUser.username.split("@")[0];  // show part of email as name
      // If user is admin, show Admin link in nav (if not already present)
      if (currentUser.isAdmin) {
        if (!adminLinkItem) {
          const adminLink = document.createElement("a");
          adminLink.href = "#admin";
          adminLink.id = "admin-link";
          adminLink.className = "nav-item";
          adminLink.textContent = "Admin";
          // Insert admin link before user span (so it's on the left side, not in the user span)
          navUserSpan.parentNode.insertBefore(adminLink, navUserSpan);
        }
      }
    } else {
      // Logged out state
      navUserSpan.style.display = "inline";
      navLogoutSpan.style.display = "none";
      // Remove admin link if it exists
      const existingAdminLink = document.getElementById("admin-link");
      if (existingAdminLink) {
        existingAdminLink.remove();
      }
    }
  }
  
  // ----- Product Management (Admin) -----
  
  function addProduct(productData) {
    // productData is expected to be an object with name, category, price, image, isNew, description
    if (!productData.name || !productData.category || productData.price == null || productData.image == null) {
      alert("Please fill out all product fields.");
      return false;
    }
    const priceNum = parseFloat(productData.price);
    if (isNaN(priceNum) || priceNum < 0) {
      alert("Please enter a valid price.");
      return false;
    }
    // Create new product object
    const newProduct = {
      id: getNextProductId(),
      name: productData.name,
      category: productData.category,
      price: priceNum,
      image: productData.image || "https://via.placeholder.com/200?text=No+Image",
      isNew: productData.isNew || false,
      description: productData.description || ""
    };
    products.push(newProduct);

    saveToStorage("products", products);
    return true;
  }
  
  function updateProduct(productId, updatedData) {
    const prod = products.find(p => p.id === productId);
    if (!prod) return false;
    // Update fields if provided in updatedData
    if (updatedData.name) prod.name = updatedData.name;
    if (updatedData.category) prod.category = updatedData.category;
    if (updatedData.price != null) {
      const priceNum = parseFloat(updatedData.price);
      if (isNaN(priceNum) || priceNum < 0) {
        alert("Invalid price value.");
        return false;
      }
      prod.price = priceNum;
    }
    if (updatedData.image) prod.image = updatedData.image;
    prod.isNew = !!updatedData.isNew;
    if (updatedData.description) prod.description = updatedData.description;
    saveToStorage("products", products);
    return true;
  }
  
  function deleteProduct(productId) {
    products = products.filter(p => p.id !== productId);
    saveToStorage("products", products);
    return true;
  }
  
  // ----- Cart Functions -----
  
  function getCartKey() {
    return currentUser ? "cart_" + currentUser.username : "cart_guest";
  }
  
  function getCartItems() {
    const cart = loadFromStorage(getCartKey());
    return cart ? cart : [];
  }
  
  function addToCart(productId, quantity = 1) {
    const cartKey = getCartKey();
    let cart = getCartItems();
    const product = products.find(p => p.id === productId);
    if (!product) {
      alert("Product not found.");
      return;
    }
    const existingItem = cart.find(item => item.productId === productId);
    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      cart.push({ productId: productId, quantity: quantity });
    }
    saveToStorage(cartKey, cart);
    alert("Added to cart!");


    alert("Added to cart!");
location.hash = "#cart";  // Force user to cart view


  }
  
  function updateCartQuantity(productId, newQuantity) {
    let cart = getCartItems();
    const item = cart.find(it => it.productId === productId);
    if (!item) return;
    if (newQuantity <= 0) {
      // Remove item if quantity is zero or negative
      cart = cart.filter(it => it.productId !== productId);
    } else {
      item.quantity = newQuantity;
    }
    saveToStorage(getCartKey(), cart);
  }
  
  function removeFromCart(productId) {
    updateCartQuantity(productId, 0);
  }
  
  // ----- Order / Checkout Functions -----
  
  function placeOrder(shippingInfo, paymentInfo) {
    // Ensure user is logged in (should be, because we block checkout if not)
    if (!currentUser) {
      alert("You must be logged in to place an order.");
      return false;
    }
    // Validate shippingInfo fields (expecting shippingInfo = { name, address, city, zip, cardNumber })
    if (!shippingInfo.name || !shippingInfo.address || !shippingInfo.city || !shippingInfo.zip || !paymentInfo.cardNumber) {
      alert("Please fill in all shipping and payment details.");
      return false;
    }
    if (paymentInfo.cardNumber.length < 12) {
      alert("Please enter a valid credit card number.");
      return false;
    }
    // Build order from cart
    const cartItems = getCartItems();
    if (cartItems.length === 0) {
      alert("Your cart is empty.");
      return false;
    }
    const orderId = getNextOrderId();
    const orderItems = cartItems.map(ci => {
      const prod = products.find(p => p.id === ci.productId);
      return {
        productId: ci.productId,
        name: prod ? prod.name : "Unknown Product",
        category: prod ? prod.category : "",
        price: prod ? prod.price : 0,
        quantity: ci.quantity
      };
    });
    const orderTotal = orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const orderRecord = {
      id: orderId,
      user: currentUser.username,
      date: new Date().toISOString().split("T")[0],
      items: orderItems,
      total: orderTotal,
      shipping: {
        name: shippingInfo.name,
        address: `${shippingInfo.address}, ${shippingInfo.city}, ${shippingInfo.zip}`
      }
      // We won't store payment info for security; assume payment is processed
    };
    orders.push(orderRecord);
    saveToStorage("orders", orders);
    // Clear the user's cart
    localStorage.removeItem(getCartKey());
    // Store last order ID to show confirmation
    saveToStorage("lastOrder", orderId);
    return true;
  }
  
  // ----- View Rendering Functions -----
  
  const mainView = document.getElementById("main-view");
  
  // Helper: render category sidebar links (dynamic categories)
  function renderCategoryMenu() {
    const sidebar = document.getElementById("sidebar");
    if (!sidebar) return;
    sidebar.innerHTML = "";  // clear current links
    // Get unique categories from products
    const categories = [...new Set(products.map(p => p.category))];
    // sort categories alphabetically or by some predefined order)
    categories.sort();
    // Add an "All" category link at top
    const allLink = document.createElement("a");
    allLink.href = "#collection";
    allLink.className = "category-link";
    allLink.innerHTML = `<span class="icon">📦</span><span class="label">All</span>`;
    sidebar.appendChild(allLink);
    categories.forEach(cat => {
      const link = document.createElement("a");
      link.href = `#collection-${cat}`;
      link.className = "category-link";
      // Use an emoji icon as placeholder (dress/shoe), real implementation could use images/icons
      let emoji = "📦";
      if (cat.toLowerCase().includes("dress")) emoji = "👗";
      else if (cat.toLowerCase().includes("shoe")) emoji = "👟";
      link.innerHTML = `<span class="icon">${emoji}</span><span class="label">${cat}</span>`;
      sidebar.appendChild(link);
    });
  }
  
  // Render Home page (#home): show welcome and maybe New This Week section
  function renderHome() {
    currentCategory = null;
    showNewOnly = false;
    document.title = "Home - E-Commerce";
    let html = `<h2>New This Week</h2>`;
    // Filter products that are marked as new
    const newProducts = products.filter(p => p.isNew);
    if (newProducts.length === 0) {
      html += `<p>No new arrivals this week. Check back later!</p>`;
    } else {
      html += `<div class="product-grid">`;
      newProducts.forEach(prod => {
        html += `
          <div class="product-card">
            <img src="${prod.image}" alt="${prod.name}" />
            ${prod.isNew ? `<div class="new-label">NEW</div>` : ""}
            <div class="name">${prod.name}</div>
            <div class="price">${formatPrice(prod.price)}</div>
            <button onclick="location.hash='#product-${prod.id}'">View</button>
          </div>`;
      });
      html += `</div>`;
    }
    mainView.innerHTML = html;
  }
  
  // Render Collection page (#collection or #collection-Category): list products, with optional filter and sort
  function renderCollection(category = null, newOnly = false) {
    currentCategory = category;
    showNewOnly = newOnly;
    document.title = "Collection - E-Commerce";
    // Heading for the section
    let heading = "All Products";
    if (newOnly) {
      heading = "New Arrivals";
    } else if (category) {
      heading = category + (category.endsWith("s") ? "" : "s");  // e.g. "Dress" -> "Dresss"? We'll assume categories are plural or adjust accordingly
      heading = category + " Collection";
    }
    let html = `<h2>${heading}</h2>`;
    // Filter products based on category/newOnly
    let filtered = products.slice();  // clone full list
    if (category) {
      filtered = filtered.filter(p => p.category === category);
    }
    if (newOnly) {
      filtered = filtered.filter(p => p.isNew);
    }
    // Sort products based on currentSort
    if (currentSort === "price-asc") {
      filtered.sort((a, b) => a.price - b.price);
    } else if (currentSort === "price-desc") {
      filtered.sort((a, b) => b.price - a.price);
    } else if (currentSort === "name-asc") {
      filtered.sort((a, b) => a.name.localeCompare(b.name));
    } else if (currentSort === "name-desc") {
      filtered.sort((a, b) => b.name.localeCompare(a.name));
    }
    // Sort dropdown
    html += `
      <div style="margin: 0.5em 0;">
        Sort by: 
        <select id="sortSelect">
          <option value="price-asc" ${currentSort === "price-asc" ? "selected" : ""}>Price: Low to High</option>
          <option value="price-desc" ${currentSort === "price-desc" ? "selected" : ""}>Price: High to Low</option>
          <option value="name-asc" ${currentSort === "name-asc" ? "selected" : ""}>Name: A to Z</option>
          <option value="name-desc" ${currentSort === "name-desc" ? "selected" : ""}>Name: Z to A</option>
        </select>
      </div>`;
    // Products grid
    html += `<div class="product-grid">`;
    filtered.forEach(prod => {
      html += `
        <div class="product-card">
          <img src="${prod.image}" alt="${prod.name}" />
          ${prod.isNew ? `<div class="new-label">NEW</div>` : ""}
          <div class="name">${prod.name}</div>
          <div class="price">${formatPrice(prod.price)}</div>
          <button onclick="location.hash='#product-${prod.id}'">View</button>
        </div>`;
    });
    if (filtered.length === 0) {
      html += `<p>No products found.</p>`;
    }
    html += `</div>`;
    mainView.innerHTML = html;
    // Attach event for sort select
    const sortSelect = document.getElementById("sortSelect");
    if (sortSelect) {
      sortSelect.addEventListener("change", (e) => {
        currentSort = e.target.value;
        // Re-render the collection with same category/new filter
        renderCollection(currentCategory, showNewOnly);
      });
    }
  }
  
  // Render "New Arrivals" page (#new) – essentially filter isNew = true
  function renderNewPage() {
    renderCollection(null, true);
  }
  
  // Render Product Detail page (#product-{id})
  function renderProductDetail(productId) {
    const prod = products.find(p => p.id === productId);
    if (!prod) {
      mainView.innerHTML = `<p>Product not found.</p>`;
      return;
    }
    document.title = prod.name + " - E-Commerce";
    let html = `
      <div class="product-detail">
        <img src="${prod.image}" alt="${prod.name}" />
        <div class="details">
          <h2>${prod.name}</h2>
          <div class="price">${formatPrice(prod.price)}</div>
          <p>${prod.description || ""}</p>
          <label for="qty">Quantity: </label>
          <select id="qty-select">`;
    // Quantity selector 1-5
    for (let i = 1; i <= 5; i++) {
      html += `<option value="${i}">${i}</option>`;
    }
    html += `</select>
          <button id="addCartBtn">Add to Cart</button>
        </div>
      </div>`;
    mainView.innerHTML = html;
    // Attach event to Add to Cart button
    const qtySelect = document.getElementById("qty-select");
    const addBtn = document.getElementById("addCartBtn");
    addBtn.addEventListener("click", () => {
      const qty = parseInt(qtySelect.value);
      if (!currentUser) {
        // If not logged in, force login
        const proceed = confirm("You are not logged in. You can add items to cart as guest, but will need to login to checkout. Continue?");
        if (!proceed) return;
      }
      addToCart(productId, qty);
    });
  }
  
  // Render Cart page (#cart) --------------------------------------

  function renderCart() {
    document.title = "Your Cart - E-Commerce";
    const cartItems = getCartItems();
    let html = `<h2>Your Cart</h2>`;
  
    if (cartItems.length === 0) {
      html += `<p>Your shopping cart is empty.</p>`;
      mainView.innerHTML = html;
      return;
    }
  
    html += `<table class="cart-table"><thead>
      <tr><th>Product</th><th>Price</th><th>Qty</th><th>Subtotal</th><th></th></tr>
    </thead><tbody>`;
  
    let total = 0;
    cartItems.forEach(item => {
      const prod = products.find(p => p.id === item.productId);
      const name = prod ? prod.name : "Product " + item.productId;
      const price = prod ? prod.price : 0;
      const subTotal = price * item.quantity;
      total += subTotal;
  
      html += `<tr>
        <td class="item-name">${name}</td>
        <td>${formatPrice(price)}</td>
        <td class="quantity-controls">
          <button class="qty-decrease" data-prod="${item.productId}">-</button>
          <span>${item.quantity}</span>
          <button class="qty-increase" data-prod="${item.productId}">+</button>
        </td>
        <td>${formatPrice(subTotal)}</td>
        <td><button class="remove-btn" data-prod="${item.productId}">Remove</button></td>
      </tr>`;
    });
  
    html += `</tbody></table>`;
    html += `<p class="cart-total">Total: <strong>${formatPrice(total)}</strong></p>`;
    html += `<p><button id="checkout-btn">Proceed to Checkout</button></p>`;
    mainView.innerHTML = html;
  
    // Attach button events
    const cartTable = document.querySelector(".cart-table");
    cartTable.addEventListener("click", (e) => {
      const prodId = e.target.getAttribute("data-prod");
      if (!prodId) return;
      const prodIdNum = parseInt(prodId);
      if (e.target.classList.contains("qty-increase")) {
        updateCartQuantity(prodIdNum, getCartItems().find(it => it.productId === prodIdNum).quantity + 1);
        renderCart();
      } else if (e.target.classList.contains("qty-decrease")) {
        updateCartQuantity(prodIdNum, getCartItems().find(it => it.productId === prodIdNum).quantity - 1);
        renderCart();
      } else if (e.target.classList.contains("remove-btn")) {
        removeFromCart(prodIdNum);
        renderCart();
      }
    });
  
    // Checkout button logic
    const checkoutBtn = document.getElementById("checkout-btn");
    if (checkoutBtn) {
      checkoutBtn.addEventListener("click", () => {
        if (!currentUser) {
          alert("You need to log in to proceed to checkout.");
          location.hash = "#login";
        } else {
          location.hash = "#checkout";
        }
      });
    }
  }
  
  

  //------------------------
  // Render Checkout page (#checkout)
  function renderCheckout() {
    if (!currentUser) {
      location.hash = "#login";
      return;
    }
    document.title = "Checkout - E-Commerce";
    // Simple checkout form for shipping and payment
    let html = `<h2>Checkout</h2>
      <form id="checkout-form" class="checkout-form">
        <div class="form-section">
          <h3>Shipping Information</h3>
          <label for="shipName">Full Name:</label>
          <input type="text" id="shipName" required />
          <label for="shipAddress">Address:</label>
          <input type="text" id="shipAddress" required />
          <label for="shipCity">City:</label>
          <input type="text" id="shipCity" required />
          <label for="shipZip">Postal Code/ZIP:</label>
          <input type="text" id="shipZip" required />
        </div>
        <div class="form-section">
          <h3>Payment Information</h3>
          <label for="cardNumber">Card Number:</label>
          <input type="text" id="cardNumber" required maxlength="16" />
        </div>
        <button type="submit">Place Order</button>
      </form>`;
    mainView.innerHTML = html;
    // Attach form submit event
    const checkoutForm = document.getElementById("checkout-form");
    checkoutForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const shippingInfo = {
        name: document.getElementById("shipName").value.trim(),
        address: document.getElementById("shipAddress").value.trim(),
        city: document.getElementById("shipCity").value.trim(),
        zip: document.getElementById("shipZip").value.trim()
      };
      const paymentInfo = {
        cardNumber: document.getElementById("cardNumber").value.trim()
      };
      const success = placeOrder(shippingInfo, paymentInfo);
      if (success) {
        // Navigate to order confirmation
        location.hash = "#confirmation";
      }
    });
  }
  
  // Render Order Confirmation page (#confirmation)
  function renderConfirmation() {
    document.title = "Order Confirmation - E-Commerce";
    const lastOrderId = loadFromStorage("lastOrder");
    if (!lastOrderId) {
      mainView.innerHTML = "<p>No recent order to confirm.</p>";
      return;
    }
    const order = orders.find(o => o.id === lastOrderId);
    if (!order) {
      mainView.innerHTML = "<p>Order not found.</p>";
      return;
    }
    // Only allow user to see their own order confirmation (or admin any)
    if (!currentUser || (!currentUser.isAdmin && currentUser.username !== order.user)) {
      mainView.innerHTML = "<p>You are not authorized to view this order.</p>";
      return;
    }
    // Compose confirmation details
    let html = `<div class="order-confirmation">
      <h2>Thank you for your order!</h2>
      <p>Order #<strong>${order.id}</strong> has been placed on ${order.date}.</p>
      <p><strong>Shipping to:</strong> ${order.shipping.name}, ${order.shipping.address}</p>
      <p><strong>Total Paid:</strong> ${formatPrice(order.total)}</p>
      <h3>Order Details:</h3>
      <ul>`;
    order.items.forEach(item => {
      html += `<li>${item.name} (x${item.quantity}) - ${formatPrice(item.price * item.quantity)}</li>`;
    });
    html += `</ul>
      <p>Your order will be processed shortly. An email confirmation has been sent.</p>
    </div>`;
    mainView.innerHTML = html;
    // clear lastOrder from storage so refresh doesn't duplicate (not strictly necessary)
    localStorage.removeItem("lastOrder");
  }
  
  // Render User's Orders page (#orders)
  function renderUserOrders() {
    if (!currentUser) {
      location.hash = "#login";
      return;
    }
    document.title = "My Orders - E-Commerce";
    let html = `<h2>My Orders</h2>`;
    const userOrders = orders.filter(o => o.user === currentUser.username);
    if (userOrders.length === 0) {
      html += `<p>You have not placed any orders yet.</p>`;
    } else {
      html += `<div class="orders-list"><table><thead>
        <tr><th>Order #</th><th>Date</th><th>Total</th><th>Status</th></tr>
        </thead><tbody>`;
      userOrders.forEach(o => {
        html += `<tr>
          <td><a href="#order-${o.id}">${o.id}</a></td>
          <td>${o.date}</td>
          <td>${formatPrice(o.total)}</td>
          <td>Confirmed</td>
        </tr>`;
      });
      html += `</tbody></table></div>`;
      html += `<p>(Click an Order # to view details)</p>`;
    }
    mainView.innerHTML = html;
  }
  
  // Render Order Details page (#order-{id}) – for viewing a specific order (admin or owner)
  function renderOrderDetails(orderId) {
    const order = orders.find(o => o.id === orderId);
    if (!order) {
      mainView.innerHTML = `<p>Order not found.</p>`;
      return;
    }
    // Authorization: owner or admin can view
    if (!currentUser || (!currentUser.isAdmin && currentUser.username !== order.user)) {
      mainView.innerHTML = `<p>You are not authorized to view this order.</p>`;
      return;
    }
    document.title = `Order ${order.id} Details - E-Commerce`;
    let html = `<h2>Order #${order.id} Details</h2>
      <p><strong>Date:</strong> ${order.date}</p>
      <p><strong>Customer:</strong> ${order.user}</p>
      <p><strong>Shipping Address:</strong> ${order.shipping.name}, ${order.shipping.address}</p>
      <p><strong>Total:</strong> ${formatPrice(order.total)}</p>
      <h3>Items:</h3>
      <ul>`;
    order.items.forEach(item => {
      html += `<li>${item.name} - ${item.quantity} x ${formatPrice(item.price)} = ${formatPrice(item.price * item.quantity)}</li>`;
    });
    html += `</ul>`;
    mainView.innerHTML = html;
  }
  
  // Render Admin Dashboard page (#admin)
  function renderAdminDashboard() {
    if (!currentUser || !currentUser.isAdmin) {
      mainView.innerHTML = "<p>You must be an admin to view this page.</p>";
      return;
    }
    document.title = "Admin Dashboard - E-Commerce";
    // Metrics
    const totalProducts = products.length;
    const totalUsers = users.length;
    const totalOrders = orders.length;
    const totalSales = orders.reduce((sum, o) => sum + o.total, 0);
    let html = `<h2>Admin Dashboard</h2>
      <div class="metrics">
        <div class="metric-card"><h3>Products</h3><div class="metric-value">${totalProducts}</div></div>
        <div class="metric-card"><h3>Orders</h3><div class="metric-value">${totalOrders}</div></div>
        <div class="metric-card"><h3>Sales</h3><div class="metric-value">${formatPrice(totalSales)}</div></div>
        <div class="metric-card"><h3>Users</h3><div class="metric-value">${totalUsers}</div></div>
      </div>
      <h3>Sales by Category</h3>
      <canvas id="salesChart" width="400" height="200"></canvas>
      <div class="admin-tables">
        <!-- Products table + Add form -->
        <div class="table-container">
          <h3>Product Management</h3>
          <form id="product-form">
            <input type="hidden" id="editProductId" value="" />
            <div><input type="text" id="prodName" placeholder="Name" required /></div>
            <div><input type="text" id="prodCategory" placeholder="Category" required /></div>
            <div><input type="number" step="0.01" id="prodPrice" placeholder="Price" required /></div>
            <div><input type="text" id="prodImage" placeholder="Image URL" /></div>
            <div><input type="text" id="prodDesc" placeholder="Description" /></div>
            <div>
              <label><input type="checkbox" id="prodNew" /> New Arrival</label>
            </div>
            <button type="submit">Add Product</button>
            <button type="button" id="cancelEditBtn" style="display:none;">Cancel</button>
          </form>
          <table>
            <thead><tr><th>ID</th><th>Name</th><th>Category</th><th>Price</th><th>New</th><th>Actions</th></tr></thead>
            <tbody>`;
    products.forEach(p => {
      html += `<tr>
        <td>${p.id}</td>
        <td>${p.name}</td>
        <td>${p.category}</td>
        <td>${formatPrice(p.price)}</td>
        <td>${p.isNew ? "Yes" : "No"}</td>
        <td class="actions">
          <button class="edit-btn" data-id="${p.id}">Edit</button>
          <button class="delete-btn" data-id="${p.id}">Delete</button>
        </td>
      </tr>`;
    });
    html += `</tbody></table>
        </div>
        <!-- Orders table -->
        <div class="table-container">
          <h3>All Orders</h3>
          <table>
            <thead><tr><th>ID</th><th>User</th><th>Date</th><th>Total</th></tr></thead>
            <tbody>`;
    orders.forEach(o => {
      html += `<tr>
        <td>${o.id}</td>
        <td>${o.user}</td>
        <td>${o.date}</td>
        <td>${formatPrice(o.total)}</td>
      </tr>`;
    });
    html += `</tbody></table>
        </div>
      </div>`;
    mainView.innerHTML = html;
    // Draw the sales chart using Chart.js if available
    if (window.Chart) {
      const ctx = document.getElementById("salesChart").getContext('2d');
      // Compute sales by category
      const categories = [...new Set(products.map(p => p.category))];
      categories.sort();
      const salesData = categories.map(cat => {
        let sum = 0;
        orders.forEach(o => {
          o.items.forEach(it => {
            if (it.category === cat) {
              sum += it.price * it.quantity;
            }
          });
        });
        return sum;
      });
      new Chart(ctx, {
        type: 'bar',
        data: {
          labels: categories,
          datasets: [{
            label: 'Sales (Revenue) by Category',
            data: salesData,
            backgroundColor: ['rgba(54,162,235,0.7)', 'rgba(255,159,64,0.7)', 'rgba(75,192,192,0.7)', 'rgba(153,102,255,0.7)'],
            borderColor: ['rgba(54,162,235,1)', 'rgba(255,159,64,1)', 'rgba(75,192,192,1)', 'rgba(153,102,255,1)'],
            borderWidth: 1
          }]
        },
        options: {
          scales: { y: { beginAtZero: true } }
        }
      });
    }
    // Attach event handlers for product form and edit/delete buttons
    const productForm = document.getElementById("product-form");
    const editProductIdInput = document.getElementById("editProductId");
    const cancelEditBtn = document.getElementById("cancelEditBtn");
    productForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const prodId = editProductIdInput.value;
      const prodData = {
        name: document.getElementById("prodName").value.trim(),
        category: document.getElementById("prodCategory").value.trim(),
        price: document.getElementById("prodPrice").value.trim(),
        image: document.getElementById("prodImage").value.trim(),
        description: document.getElementById("prodDesc").value.trim(),
        isNew: document.getElementById("prodNew").checked
      };
      let result;
      if (prodId) {
        // Editing existing product
        result = updateProduct(Number(prodId), prodData);
        if (result) {
          alert("Product updated.");
        }
      } else {
        // Adding new product
        result = addProduct(prodData);
        if (result) {
          alert("Product added.");
        }
      }
      if (result) {
        // Re-render admin page to show updates
        renderAdminDashboard();
      }
    });
    cancelEditBtn.addEventListener("click", () => {
      // Reset form for new entry
      editProductIdInput.value = "";
      productForm.reset();
      cancelEditBtn.style.display = "none";
      productForm.querySelector("button[type=submit]").textContent = "Add Product";
    });
    // Handle edit and delete buttons in product table
    const productTable = mainView.querySelector(".table-container table tbody");
    productTable.addEventListener("click", (e) => {
      const prodId = e.target.getAttribute("data-id");
      if (!prodId) return;
      const prodIdNum = Number(prodId);
      if (e.target.classList.contains("edit-btn")) {
        // Fill form with product data for editing
        const prod = products.find(p => p.id === prodIdNum);
        if (!prod) return;
        document.getElementById("prodName").value = prod.name;
        document.getElementById("prodCategory").value = prod.category;
        document.getElementById("prodPrice").value = prod.price;
        document.getElementById("prodImage").value = prod.image;
        document.getElementById("prodDesc").value = prod.description;
        document.getElementById("prodNew").checked = prod.isNew;
        editProductIdInput.value = prod.id;
        productForm.querySelector("button[type=submit]").textContent = "Update Product";
        cancelEditBtn.style.display = "inline";
      } else if (e.target.classList.contains("delete-btn")) {
        const confirmed = confirm("Delete this product? This action cannot be undone.");
        if (confirmed) {
          deleteProduct(prodIdNum);
          alert("Product deleted.");
          renderAdminDashboard();
        }
      }
    });
  }
  
  // ----- Router: Handle hash-based navigation -----
  
  function handleRoute() {
    const hash = window.location.hash || "#home";
    // Show/hide sidebar depending on route (only show on product listing pages)
    const sidebar = document.getElementById("sidebar");
    document.getElementById('logout-link').addEventListener('click', (e) => { 
      e.preventDefault(); 
      logoutUser(); 
    });
    if (sidebar) {
      if (hash.startsWith("#collection") || hash === "#home" || hash === "#new") {
        sidebar.style.display = "block";  // ensure sidebar visible for browsing pages
      } else {
        sidebar.style.display = "none";
      }
    }
    // Determine which view to render
    if (hash === "#home" || hash === "#") {
      renderHome();
    } else if (hash === "#collection") {
      renderCollection();  // all products
    } else if (hash.startsWith("#collection-")) {
      const categoryName = decodeURIComponent(hash.split("-")[1]);
      renderCollection(categoryName);
    } else if (hash === "#new") {
      renderNewPage();
    } else if (hash.startsWith("#product-")) {
      const productId = parseInt(hash.split("-")[1]);
      renderProductDetail(productId);
    } else if (hash === "#cart") {
      renderCart();
    } else if (hash === "#checkout") {
      renderCheckout();
    } else if (hash === "#confirmation") {
      renderConfirmation();
    } else if (hash === "#orders") {
      renderUserOrders();
    } else if (hash.startsWith("#order-")) {
      const orderId = parseInt(hash.split("-")[1]);
      renderOrderDetails(orderId);
    } else if (hash === "#admin") {
      renderAdminDashboard();
    } else if (hash === "#login") {
      renderLoginPage();
    } else if (hash === "#register") {
      renderRegisterPage();
    } else {
      // Unknown route, default to home
      location.hash = "#home";
    }
  }
  
  // ----- Auth Pages Rendering (Login/Register) -----
  
  function renderLoginPage() {
    document.title = "Login - E-Commerce";
    let html = `<h2>Login</h2>
      <form id="login-form">
        <label for="loginEmail">Email:</label>
        <input type="email" id="loginEmail" required />
        <label for="loginPassword">Password:</label>
        <input type="password" id="loginPassword" required />
        <button type="submit">Login</button>
      </form>
      <p>Don't have an account? <a href="#register">Register here</a>.</p>`;
    mainView.innerHTML = html;
    const loginForm = document.getElementById("login-form");
    loginForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const email = document.getElementById("loginEmail").value;
      const password = document.getElementById("loginPassword").value;
      const success = loginUser(email, password);
      if (success) {
        // Redirect after login: if admin, go to admin dashboard, else home
        location.hash = currentUser.isAdmin ? "#admin" : "#home";
      }
    });
  }
  
  function renderRegisterPage() {
    document.title = "Register - E-Commerce";
    let html = `<h2>Register</h2>
      <form id="register-form">
        <label for="regEmail">Email:</label>
        <input type="email" id="regEmail" required />
        <label for="regPassword">Password:</label>
        <input type="password" id="regPassword" required minlength="4" />
        <button type="submit">Create Account</button>
      </form>
      <p>Already have an account? <a href="#login">Login here</a>.</p>`;
    mainView.innerHTML = html;
    const registerForm = document.getElementById("register-form");
    registerForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const email = document.getElementById("regEmail").value;
      const password = document.getElementById("regPassword").value;
      const success = registerUser(email, password);
      if (success) {
        location.hash = currentUser.isAdmin ? "#admin" : "#home";
      }
    });
  }
  
  // ----- Initial Setup: Render sidebar and default page -----
  
  renderCategoryMenu();  // build category sidebar links based on products
  updateNav();           // set up nav based on currentUser session
  window.addEventListener("hashchange", handleRoute);
  // If no hash, default to home
  if (!window.location.hash) {
    window.location.hash = "#home";
  } else {
    // Load the view corresponding to the current hash
    handleRoute();
  }
  
  // Also update category menu if products change (for dynamic categories, this could be called again after product add/delete).
  