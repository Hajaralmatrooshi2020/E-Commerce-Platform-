# 🛍️ My E-Commerce Platform

A fully client-side e-commerce web application built using HTML, CSS, and JavaScript. It supports product listings, cart functionality, user authentication, admin product management, and order placement — all using `localStorage` as the data layer.

---

## 📁 Project Structure

```
├── index.html         # Main HTML page
├── styles.css         # All styling and responsive design
├── script.js          # Core application logic (routing, cart, orders, auth, etc.)
├── clear.js           # Utility script to clear localStorage manually
├── images/            # (Optional) Folder for product images
```

---

## 🚀 Features

- Product categories and dynamic filters
- Add to cart and update cart quantity
- Guest checkout with cart persistence
- User registration and login (localStorage)
- Admin dashboard to manage products and view sales
- Order placement with shipping/payment form
- Data persisted in `localStorage`
- Responsive layout with modern UI

---

## 🛠️ Setup Instructions

1. **Clone or Download the Project**
   ```
   git clone    https://github.com/Hajaralmatrooshi2020/E-Commerce-Platform-.git ,,,,,,
   ```

2. **Navigate to the project folder**
   ```
   cd 
   ```

3. **Open `index.html` in your browser**
   You can just double-click `index.html`, or use a local server (recommended for testing):
   ```
   npx serve
   ```

---

## 👤 Default User Credentials

| Role   | Email                | Password   |
|--------|----------------------|------------|
| Admin  | admin@example.com    | admin123   |
| User   | testuser@example.com | test1234   |

---

## 🧪 Useful Scripts

- `clear.js`: Clears all `localStorage` data. Useful for testing/reset.
  ```html
  <script src="clear.js"></script>
  ```

---

## 📷 Screenshots

Attached

---

## 📌 Notes

- This app is **100% front-end**, so all data is stored in the user's browser via `localStorage`.
- It is not connected to a real backend or payment gateway.
- Admin access is hardcoded based on the `isAdmin` property in the user object.

---
