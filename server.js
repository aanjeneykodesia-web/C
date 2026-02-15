const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;
const ADMIN_MOBILE = "9999999999";

const PRODUCTS_FILE = path.join(__dirname, "products.json");

/* ---------------- ROOT ---------------- */
app.get("/", (req, res) => {
  res.send("Backend running");
});

/* ---------------- SIMPLE ADMIN CHECK ---------------- */
function checkAdmin(req, res, next) {
  const mobile = req.headers["admin-mobile"];
  if (mobile === ADMIN_MOBILE) {
    next();
  } else {
    res.status(401).json({ success: false, message: "Unauthorized" });
  }
}

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

/* Get All Products */
app.get("/admin/products", checkAdmin, (req, res) => {
  res.json({ success: true, products: readProducts() });
});

/* Add Product */
app.post("/admin/add-product", checkAdmin, (req, res) => {
  const { id, name, price, qty } = req.body;

  if (!id || !name) {
    return res.status(400).json({ success: false, message: "Missing fields" });
  }

  const products = readProducts();

  products.push({ id, name, price, qty });
  writeProducts(products);

  res.json({ success: true });
});

/* Update Product */
app.post("/admin/update-product", checkAdmin, (req, res) => {
  const { id, price, qty } = req.body;
  const products = readProducts();

  const product = products.find(p => p.id === id);

  if (!product) {
    return res.status(404).json({ success: false, message: "Product not found" });
  }

  product.price = price;
  product.qty = qty;

  writeProducts(products);

  res.json({ success: true });
});

/* Delete Product */
app.post("/admin/delete-product", checkAdmin, (req, res) => {
  const { id } = req.body;
  const products = readProducts();

  const updated = products.filter(p => p.id !== id);

  writeProducts(updated);

  res.json({ success: true });
});

/* ---------------- START ---------------- */
app.listen(PORT, () => {
  console.log("Server running on", PORT);
});
