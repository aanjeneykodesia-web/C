const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const app = express();

/* ===============================
   MIDDLEWARE
================================ */
app.use(cors()); // VERY IMPORTANT for Netlify
app.use(express.json());

/* ===============================
   ROOT CHECK (Railway Test)
================================ */
app.get("/", (req, res) => {
  res.send("UPI Backend Running");
});

/* ===============================
   LOGIN API
================================ */
app.post("/login", (req, res) => {
  const { mobile } = req.body;

  if (!mobile) {
    return res.status(400).json({
      success: false,
      message: "Mobile number required",
    });
  }

  /* ===== ADMIN FIXED LOGIN ===== */
  if (mobile === "8888888888") {
    return res.json({
      success: true,
      role: "admin",
    });
  }

  /* ===== CSV USER CHECK ===== */
  try {
    const csvPath = path.join(__dirname, "users.csv");

    if (!fs.existsSync(csvPath)) {
      return res.status(500).json({
        success: false,
        message: "CSV file not found",
      });
    }

    const csvData = fs.readFileSync(csvPath, "utf8");
    const rows = csvData.split("\n");

    for (let row of rows) {
      const cols = row.split(",");

      if (cols[0] && cols[0].trim() === mobile.trim()) {
        return res.json({
          success: true,
          role: cols[1] ? cols[1].trim() : "user",
        });
      }
    }

    return res.status(401).json({
      success: false,
      message: "Unauthorized user",
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

/* ===============================
   SERVER START (Railway Safe)
================================ */
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("Server running on port", PORT);
});
