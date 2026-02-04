const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const app = express();

/* ===============================
   MIDDLEWARE
================================ */
app.use(cors());
app.use(express.json());

/* ===============================
   CONFIG
================================ */
const PORT = process.env.PORT || 3000;

// 🔐 FIXED ADMIN MOBILE
const ADMIN_MOBILE = "9999999999";

// 📄 FILE PATHS
const USERS_CSV = path.join(__dirname, "users.csv");
const ITEMS_JSON = path.join(__dirname, "shopkeeper_items.json");

/* ===============================
   ROOT
================================ */
app.get("/", (req, res) => {
  res.send("Backend running successfully");
});

/* ===============================
   LOGIN (MOBILE ONLY)
================================ */
app.post("/login", (req, res) => {
  const { mobile } = req.body;

  if (!mobile) {
    return res.status(400).json({
      success: false,
      message: "Mobile number required"
    });
  }

  const cleanMobile = mobile.trim();

  // ✅ ADMIN
  if (cleanMobile === ADMIN_MOBILE) {
    return res.json({
      success: true,
      role: "admin"
    });
  }

  // ✅ CSV USER
  try {
    if (!fs.existsSync(USERS_CSV)) {
      return res.status(500).json({
        success: false,
        message: "users.csv not found"
      });
    }

    const rows = fs.readFileSync(USERS_CSV, "utf8").split("\n");

    for (let i = 1; i < rows.length; i++) {
      const row = rows[i].trim();
      if (!row) continue;

      const [csvMobile, csvRole] = row.split(",");

      if (csvMobile?.trim() === cleanMobile) {
        return res.json({
          success: true,
          role: csvRole.trim()
        });
      }
    }

    return res.status(401).json({
      success: false,
      message: "Unauthorized user"
    });

  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
});

/* =====================================================
   ADMIN – SHOPKEEPER ITEMS (ADMIN ONLY)
===================================================== */

// 📥 GET ALL ITEMS
app.get("/admin/shopkeeper/items", (req, res) => {
  try {
    if (!fs.existsSync(ITEMS_JSON)) {
      fs.writeFileSync(ITEMS_JSON, JSON.stringify([], null, 2));
    }

    const items = JSON.parse(fs.readFileSync(ITEMS_JSON, "utf8"));

    res.json({
      success: true,
      items
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Failed to load items"
    });
  }
});

// ✏️ UPDATE ITEM
app.put("/admin/shopkeeper/items/:id", (req, res) => {
  const { id } = req.params;
  const { name, price } = req.body;

  try {
    if (!fs.existsSync(ITEMS_JSON)) {
      return res.status(404).json({
        success: false,
        message: "Items file missing"
      });
    }

    const items = JSON.parse(fs.readFileSync(ITEMS_JSON, "utf8"));

    const index = items.findIndex(item => item.id === id);

    if (index === -1) {
      return res.status(404).json({
        success: false,
        message: "Item not found"
      });
    }

    items[index].name = name;
    items[index].price = price;

    fs.writeFileSync(ITEMS_JSON, JSON.stringify(items, null, 2));

    res.json({
      success: true,
      message: "Item updated"
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Update failed"
    });
  }
});

/* ===============================
   START SERVER
================================ */
app.listen(PORT, () => {
  console.log("Server running on port", PORT);
});
