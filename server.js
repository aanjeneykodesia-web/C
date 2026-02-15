const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;
const ADMIN_MOBILE = "9999999999";

const CSV_PATH = path.join(__dirname, "users.csv");

/* ---------------- ROOT ---------------- */
app.get("/", (req, res) => {
  res.send("Backend running");
});

/* ---------------- LOGIN ---------------- */
app.post("/login", (req, res) => {
  const { mobile } = req.body;

  if (!mobile) {
    return res.status(400).json({
      success: false,
      message: "Mobile number required"
    });
  }

  const cleanMobile = mobile.trim();

  // ✅ ADMIN LOGIN
  if (cleanMobile === ADMIN_MOBILE) {
    return res.json({
      success: true,
      role: "admin",
      latitude: null,
      longitude: null
    });
  }

  try {
    if (!fs.existsSync(CSV_PATH)) {
      return res.status(500).json({
        success: false,
        message: "users.csv not found"
      });
    }

    const fileData = fs.readFileSync(CSV_PATH, "utf8");
    const rows = fileData.split("\n").slice(1); // skip header

    for (let row of rows) {
      const cols = row.split(",");

      if (cols.length >= 4) {
        const csvMobile = cols[0].trim();
        const role = cols[1].trim();
        const latitude = cols[2].trim();
        const longitude = cols[3].trim();

        if (csvMobile === cleanMobile) {
          return res.json({
            success: true,
            role,
            latitude,
            longitude
          });
        }
      }
    }

    return res.status(401).json({
      success: false,
      message: "Unauthorized user"
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
});

/* ---------------- START SERVER ---------------- */
app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});
