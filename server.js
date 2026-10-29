const express = require("express");
const session = require("express-session");
const bcrypt = require("bcryptjs");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_DIR = path.join(__dirname, "data");

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({
  secret: process.env.SESSION_SECRET || "change-this-demo-secret-before-deployment",
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 1000 * 60 * 60 * 4
  }
}));
app.use(express.static(path.join(__dirname, "public")));

function readJson(fileName, fallback = []) {
  const fullPath = path.join(DATA_DIR, fileName);
  if (!fs.existsSync(fullPath)) {
    fs.writeFileSync(fullPath, JSON.stringify(fallback, null, 2));
  }
  try {
    return JSON.parse(fs.readFileSync(fullPath, "utf8"));
  } catch (error) {
    console.error(`Could not read ${fileName}:`, error.message);
    return fallback;
  }
}

function writeJson(fileName, value) {
  fs.writeFileSync(path.join(DATA_DIR, fileName), JSON.stringify(value, null, 2));
}

function publicUser(user) {
  return { id: user.id, name: user.name, email: user.email };
}

function requireLogin(req, res, next) {
  if (!req.session.userId) {
    return res.status(401).json({ message: "Please log in before placing an order." });
  }
  next();
}

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: "CodeAlpha store API is running." });
});

app.get("/api/products", (req, res) => {
  res.json(readJson("products.json"));
});

app.get("/api/products/:id", (req, res) => {
  const products = readJson("products.json");
  const product = products.find(item => item.id === Number(req.params.id));
  if (!product) return res.status(404).json({ message: "Product not found." });
  res.json(product);
});

app.get("/api/auth/me", (req, res) => {
  if (!req.session.userId) return res.json({ user: null });
  const users = readJson("users.json");
  const user = users.find(item => item.id === req.session.userId);
  if (!user) {
    req.session.destroy(() => {});
    return res.json({ user: null });
  }
  res.json({ user: publicUser(user) });
});

app.post("/api/auth/register", async (req, res) => {
  const name = String(req.body.name || "").trim();
  const email = String(req.body.email || "").trim().toLowerCase();
  const password = String(req.body.password || "");

  if (name.length < 2) return res.status(400).json({ message: "Name must contain at least 2 characters." });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ message: "Enter a valid email address." });
  if (password.length < 8) return res.status(400).json({ message: "Password must be at least 8 characters." });

  const users = readJson("users.json");
  if (users.some(user => user.email === email)) {
    return res.status(409).json({ message: "An account with this email already exists. Please log in." });
  }

  const user = {
    id: Date.now(),
    name,
    email,
    passwordHash: await bcrypt.hash(password, 10)
  };
  users.push(user);
  writeJson("users.json", users);
  req.session.userId = user.id;
  res.status(201).json({ message: "Account created successfully.", user: publicUser(user) });
});

app.post("/api/auth/login", async (req, res) => {
  const email = String(req.body.email || "").trim().toLowerCase();
  const password = String(req.body.password || "");
  const users = readJson("users.json");
  const user = users.find(item => item.email === email);

  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    return res.status(401).json({ message: "Incorrect email or password." });
  }
  req.session.userId = user.id;
  res.json({ message: "Logged in successfully.", user: publicUser(user) });
});

app.post("/api/auth/logout", (req, res) => {
  req.session.destroy(error => {
    if (error) return res.status(500).json({ message: "Could not log out. Please try again." });
    res.clearCookie("connect.sid");
    res.json({ message: "You have logged out." });
  });
});

app.post("/api/orders", requireLogin, (req, res) => {
  const submittedItems = req.body.items;
  if (!Array.isArray(submittedItems) || submittedItems.length === 0) {
    return res.status(400).json({ message: "Your cart is empty." });
  }

  const products = readJson("products.json");
  const orderItems = [];
  let total = 0;

  for (const submitted of submittedItems) {
    const id = Number(submitted.id);
    const quantity = Number(submitted.quantity);
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 20) {
      return res.status(400).json({ message: "Each quantity must be between 1 and 20." });
    }
    const product = products.find(item => item.id === id);
    if (!product) return res.status(400).json({ message: "A product in your cart no longer exists." });
    if (quantity > product.stock) {
      return res.status(400).json({ message: `${product.name} has only ${product.stock} item(s) left.` });
    }
    orderItems.push({
      productId: product.id,
      name: product.name,
      unitPrice: product.price,
      quantity,
      subtotal: product.price * quantity
    });
    total += product.price * quantity;
  }

  // Re-read stock and update it before saving the order. This is a learning demo, not a multi-user production database.
  for (const item of orderItems) {
    const product = products.find(p => p.id === item.productId);
    product.stock -= item.quantity;
  }
  writeJson("products.json", products);

  const orders = readJson("orders.json");
  const order = {
    id: `ORD-${Date.now()}`,
    userId: req.session.userId,
    items: orderItems,
    total,
    status: "Placed",
    createdAt: new Date().toISOString()
  };
  orders.push(order);
  writeJson("orders.json", orders);
  res.status(201).json({ message: "Order placed successfully!", order });
});

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(PORT, () => {
  console.log(`CodeAlpha E-commerce Store is running at http://localhost:${PORT}`);
});