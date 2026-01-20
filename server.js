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

// 🔐 FIXED ADMIN (ONLY THIS NUMBER)
const ADMIN_MOBILE = "9999999999";

// 📄 CSV FILE PATH
const CSV_PATH = path.join(__dirname, "users.csv");

/* ===============================
   ROOT CHECK (Railway Test)
================================ */
app.get("/", (req, res) => {
  res.send("Backend running");
});

/* ===============================
   LOGIN API (MOBILE ONLY)
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

  /* ===== ADMIN CHECK (STRICT) ===== */
  if (cleanMobile === ADMIN_MOBILE) {
    return res.json({
      success: true,
      role: "admin"
    });
  }

  /* ===== CSV USER CHECK ===== */
  try {
    if (!fs.existsSync(CSV_PATH)) {
      return res.status(500).json({
        success: false,
        message: "users.csv not found on server"
      });
    }

    const csvData = fs.readFileSync(CSV_PATH, "utf8");
    const rows = csvData.split("\n");

    for (let i = 1; i < rows.length; i++) { // skip header
      const row = rows[i].trim();
      if (!row) continue;

      const cols = row.split(",");

      const csvMobile = cols[0]?.trim();
      const csvRole = cols[1]?.trim().toLowerCase();

      if (csvMobile === cleanMobile) {
        return res.json({
          success: true,
          role: csvRole
        });
      }
    }

    // ❌ Not admin and not in CSV
    return res.status(401).json({
      success: false,
      message: "Unauthorized user"
    });

  } catch (err) {
    console.error("LOGIN ERROR:", err);
    return res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
});

/* ===============================
   START SERVER (Railway SAFE)
================================ */
app.listen(PORT, () => {
  console.log("Server running on port", PORT);
});
