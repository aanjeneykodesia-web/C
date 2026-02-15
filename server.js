const fs = require("fs");
const path = require("path");
const cors = require("cors");
const Razorpay = require("razorpay");
const crypto = require("crypto");

const app = express();
app.use(cors());
app.use(express.json());

const CSV_PATH = path.join(__dirname, "users.csv");

function getUsersFromCSV() {
  const data = fs.readFileSync(CSV_PATH, "utf8");
  const lines = data.trim().split("\n");
  const headers = lines[0].split(",");
  return lines.slice(1).map(row => {
    const values = row.split(",");
    let obj = {};
    headers.forEach((h, i) => obj[h.trim()] = values[i].trim());
    return obj;
  });
}

// Razorpay (UPI only)
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

// Admin login
app.post("/admin-login", (req, res) => {
  const { email, password } = req.body;
  if (
    email === process.env.ADMIN_EMAIL &&
    password === process.env.ADMIN_PASSWORD
  ) {
    return res.json({ success: true, role: "admin" });
  }
  res.status(401).json({ success: false });
});

// CSV user login
app.post("/login", (req, res) => {
  const { mobile } = req.body;
  const users = getUsersFromCSV();
  const user = users.find(u => u.mobile === mobile);
  if (!user) return res.status(401).json({ success: false });
  res.json({ success: true, role: user.role, id: user.id });
});

// Create UPI order
app.post("/create-upi-order", async (req, res) => {
  const { amount } = req.body;
  const order = await razorpay.orders.create({
    amount: amount * 100,
    currency: "INR"
  });
  res.json(order);
});

// Verify UPI payment
app.post("/verify-upi-payment", (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
  const body = razorpay_order_id + "|" + razorpay_payment_id;

  const expected = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(body)
    .digest("hex");

  if (expected === razorpay_signature) {
    res.json({ success: true });
  } else {
    res.status(400).json({ success: false });
  }
});

app.get("/", (req, res) => res.send("UPI Backend Running"));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Server running on", PORT));
