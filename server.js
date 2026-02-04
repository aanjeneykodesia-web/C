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

// 🔐 FIXED ADMIN
const ADMIN_MOBILE = "9999999999";

// 📄 CSV FILE PATH
const CSV_PATH = path.join(__dirname, "users.csv");

/* ===============================
   ROOT CHECK
================================ */
app.get("/", (req, res) => {
  res.send("Backend running");
});

/* ===============================
   LOGIN API
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

  // ADMIN
  if (cleanMobile === ADMIN_MOBILE) {
    return res.json({ success: true, role: "admin" });
  }

  // CSV USERS
  try {
    if (!fs.existsSync(CSV_PATH)) {
      return res.status(500).json({
        success: false,
        message: "users.csv not found"
      });
    }

    const rows = fs.readFileSync(CSV_PATH, "utf8").split("\n");

    for (let i = 1; i < rows.length; i++) {
      const row = rows[i].trim();
      if (!row) continue;

      const [mobile, role] = row.split(",");

      if (mobile.trim() === cleanMobile) {
        return res.json({
          success: true,
          role: role.trim()
        });
      }
    }

    res.status(401).json({
      success: false,
      message: "Unauthorized"
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
});

/* ===============================
   ✅ ADMIN: GET USERS
================================ */
app.get("/admin/users", (req, res) => {
  try {
    if (!fs.existsSync(CSV_PATH)) {
      return res.json({ success: true, users: [] });
    }

    const rows = fs.readFileSync(CSV_PATH, "utf8").split("\n");
    const users = [];

    for (let i = 1; i < rows.length; i++) {
      const row = rows[i].trim();
      if (!row) continue;

      const [mobile, role] = row.split(",");

      users.push({
        mobile: mobile.trim(),
        role: role.trim()
      });
    }

    res.json({ success: true, users });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Failed to load users"
    });
  }
});

/* ===============================
   ✅ ADMIN: UPDATE USER ROLE
================================ */
app.post("/admin/update-user", (req, res) => {
  const { adminMobile, mobile, newRole } = req.body;

  // ADMIN CHECK
  if (adminMobile !== ADMIN_MOBILE) {
    return res.status(403).json({
      success: false,
      message: "Admin access only"
    });
  }

  try {
    if (!fs.existsSync(CSV_PATH)) {
      return res.status(500).json({
        success: false,
        message: "CSV not found"
      });
    }

    const rows = fs.readFileSync(CSV_PATH, "utf8").split("\n");
    let updated = false;

    for (let i = 1; i < rows.length; i++) {
      if (!rows[i].trim()) continue;

      const [csvMobile] = rows[i].split(",");

      if (csvMobile.trim() === mobile) {
        rows[i] = `${mobile},${newRole}`;
        updated = true;
        break;
      }
    }

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    fs.writeFileSync(CSV_PATH, rows.join("\n"));

    res.json({
      success: true,
      message: "User updated"
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
