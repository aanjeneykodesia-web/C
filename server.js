const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;
const ADMIN_MOBILE = "9999999999";

// 📱 USERS MAP (RELIABLE)
const USERS = {
  "8888888888": "shopkeeper",
  "7777777777": "manufacturer",
  "6666666666": "transport"
};
/* ---------------- ROOT ---------------- */
app.get("/", (req, res) => {
  res.send("Backend running");
});

/* ---------------- LOGIN ---------------- */
app.post("/login", (req, res) => {
  const { mobile } = req.body;
  if (mobile === ADMIN_MOBILE) {
    return res.json({ success: true, role: "admin" });
  }
  return res.status(401).json({ success: false });
});

/* ---------------- UTIL ---------------- */
function readProducts() {
  if (!fs.existsSync(PRODUCTS_FILE)) return [];
  return JSON.parse(fs.readFileSync(PRODUCTS_FILE, "utf8"));
}

function writeProducts(data) {
  fs.writeFileSync(PRODUCTS_FILE, JSON.stringify(data, null, 2));
}

/* ---------------- PRODUCTS ---------------- */
app.get("/admin/products", (req, res) => {
  res.json({ success: true, products: readProducts() });
});

app.post("/admin/add-product", (req, res) => {
  const { id, name, price, qty } = req.body;
  const products = readProducts();

  products.push({ id, name, price, qty });
  writeProducts(products);

  res.json({ success: true });
});

app.post("/admin/update-product", (req, res) => {
  const { id, price, qty } = req.body;
  const products = readProducts();

  products.forEach(p => {
    if (p.id === id) {
      p.price = price;
      p.qty = qty;
    }
  });

  writeProducts(products);
  res.json({ success: true });
});

app.post("/admin/delete-product", (req, res) => {
  const { id } = req.body;
  const products = readProducts().filter(p => p.id !== id);

  writeProducts(products);
  res.json({ success: true });
});

/* ---------------- START ---------------- */
app.listen(PORT, () => {
  console.log("Server running on", PORT);
});
