// server.js

const express = require("express");
const fs = require("fs");
const path = require("path");
const cors = require("cors");
const { v4: uuidv4 } = require("uuid");

const app = express();
const PORT = 5000;

// Middleware
app.use(cors());
app.use(express.json());

// File Paths
const dataDir = path.join(__dirname, "data");
const usersFile = path.join(dataDir, "users.json");
const ordersFile = path.join(dataDir, "orders.json");
const approverFile = path.join(dataDir, "approver.json");

// === Helper Functions ===

function readJSON(filepath) {
  try {
    if (!fs.existsSync(filepath)) return [];
    const data = fs.readFileSync(filepath, "utf-8");
    return data ? JSON.parse(data) : [];
  } catch (err) {
    console.error(`Error reading ${filepath}:`, err);
    return [];
  }
}

function writeJSON(filepath, data) {
  try {
    fs.writeFileSync(filepath, JSON.stringify(data, null, 2));
  } catch (err) {
    console.error(`Error writing ${filepath}:`, err);
  }
}

function getNextOrderId(orders) {
  if (!Array.isArray(orders) || orders.length === 0) return 1;
  const maxId = Math.max(...orders.map((o) => Number(o.id) || 0));
  return maxId + 1;
}

// === USERS ===

app.get("/api/users", (req, res) => {
  const users = readJSON(usersFile);
  res.json(users);
});

app.post("/api/users", (req, res) => {
  const { username, budget } = req.body;

  if (!username || typeof budget !== "number") {
    return res.status(400).json({ error: "Invalid user data" });
  }

  const users = readJSON(usersFile);
  if (users.find((u) => u.username === username)) {
    return res.status(400).json({ error: "Username already exists" });
  }

  const newUser = {
    id: uuidv4(),
    username,
    budget,
    pending: budget,
    domain: req.body.domain || "General",
    revisedAmount: 0,
  };

  users.push(newUser);
  writeJSON(usersFile, users);

  res.json({ message: "User created" });
});

app.put("/api/users/:username", (req, res) => {
  const { username } = req.params;
  const { budget, domain, revisedAmount } = req.body;

  const users = readJSON(usersFile);
  const index = users.findIndex((u) => u.username === username);

  if (index === -1) return res.status(404).json({ error: "User not found" });

  users[index].pending += revisedAmount;
  users[index].revisedAmount = revisedAmount;
  users[index].domain = domain;

  writeJSON(usersFile, users);
  res.json({ message: "User updated" });
});

// === APPROVERS ===

app.get("/api/approvers", (req, res) => {
  const approvers = readJSON(approverFile);
  res.json(Array.isArray(approvers) ? approvers : []);
});

app.post("/api/approvers", (req, res) => {
  const { name, budget, domain } = req.body;

  if (!name || typeof budget !== "number" || !domain) {
    return res.status(400).json({ error: "Invalid approver data" });
  }

  let approvers = readJSON(approverFile);
  if (!Array.isArray(approvers)) approvers = [];

  const existing = approvers.find((a) => a.name === name);

  if (existing) {
    existing.budget = budget;
    existing.remaining = budget;
  } else {
    approvers.push({ id: uuidv4(), name, budget, remaining: budget, domain });
  }

  writeJSON(approverFile, approvers);
  res.json({ message: "Approver created/updated" });
});

// === ORDERS ===

app.get("/api/orders", (req, res) => {
  const orders = readJSON(ordersFile);
  res.json(orders);
});

app.post("/api/orders", (req, res) => {
  const { username, itemName, cost } = req.body;
  const costNumber = Number(cost);

  if (!username || !itemName || isNaN(costNumber)) {
    return res.status(400).json({ error: "Invalid order data" });
  }

  const orders = readJSON(ordersFile);
  const newOrder = {
    id: getNextOrderId(orders),
    username,
    itemName,
    cost: costNumber,
    status: "pending",
  };

  orders.push(newOrder);
  writeJSON(ordersFile, orders);

  res.status(201).json({ order: newOrder });
});

app.post("/api/orders/approve", (req, res) => {
  const { id, approverName } = req.body;

  const orders = readJSON(ordersFile);
  const users = readJSON(usersFile);
  const approvers = readJSON(approverFile);

  const order = orders.find((o) => o.id === id || o.id === Number(id));
  if (!order || order.status !== "pending") {
    return res.status(400).json({ error: "Invalid order" });
  }

  const user = users.find((u) => u.username === order.username);
  const approver = approvers.find((a) => a.name === approverName);

  if (!user || !approver) {
    return res.status(400).json({ error: "User or Approver not found" });
  }

  if (user.pending < order.cost) {
    return res.status(400).json({ error: "User budget insufficient" });
  }

  if (approver.remaining < order.cost) {
    return res.status(400).json({ error: "Approver budget insufficient" });
  }

  user.pending -= order.cost;
  approver.remaining -= order.cost;
  order.status = "approved";

  writeJSON(usersFile, users);
  writeJSON(approverFile, approvers);
  writeJSON(ordersFile, orders);

  res.json({ message: "Order approved" });
});

app.post("/api/orders/reject", (req, res) => {
  const { id } = req.body;

  const orders = readJSON(ordersFile);
  const order = orders.find((o) => o.id === id || o.id === Number(id));

  if (!order || order.status !== "pending") {
    return res.status(400).json({ error: "Invalid order" });
  }

  order.status = "rejected";
  writeJSON(ordersFile, orders);
  res.json({ message: "Order rejected" });
});

app.post("/api/orders/forward", (req, res) => {
  const { id } = req.body;

  const orders = readJSON(ordersFile);
  const order = orders.find((o) => o.id === id || o.id === Number(id));

  if (!order || order.status !== "pending") {
    return res.status(400).json({ error: "Invalid order" });
  }

  order.status = "forwarded";
  writeJSON(ordersFile, orders);
  res.json({ message: "Order forwarded" });
});

// === Start Server ===

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
