const express = require("express");
const router = express.Router();

const bcrypt = require("bcryptjs");
const User = require("../models/User");
const ApiKey = require("../models/ApiKey");

const jwt = require("../utils/jwt");
const generateKey = require("../utils/generateKey");

const auth = require("../middleware/auth");
const apiKeyAuth = require("../middleware/apiKeyAuth");

const planConfig = require("../config/plan");

/* =========================
   REGISTER
========================= */
router.post("/register", async (req, res) => {
  try {
    const { email, password } = req.body;

    // basic validation
    if (!email || !password) {
      return res.status(400).json({ error: "Email & password required" });
    }

    const exist = await User.findOne({ email });
    if (exist) {
      return res.status(400).json({ error: "Email already used" });
    }

    const hash = await bcrypt.hash(password, 10);

    const user = await User.create({
      email,
      password: hash
      // plan default "free"
    });

    res.json({
      success: true,
      userId: user._id,
      plan: user.plan
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* =========================
   LOGIN
========================= */
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ error: "User not found" });
    }

    // 🔥 bcrypt compare (WAJIB)
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({ error: "Wrong password" });
    }

    // 🔥 JWT harus bawa id
    const token = jwt.sign({
      id: user._id
    });

    res.json({
      success: true,
      token,
      plan: user.plan
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* =========================
   CREATE API KEY (PLAN BASED)
========================= */
router.post("/create-key", auth, async (req, res) => {
  try {
    const user = req.user;

    // 🔥 fallback kalau user lama belum punya plan
    const userPlan = user.plan || "free";
    const plan = planConfig[userPlan];

    if (!plan) {
      return res.status(400).json({ error: "Invalid plan" });
    }

    const key = generateKey();

    const apiKey = await ApiKey.create({
      userId: user._id,
      key,
      name: req.body.name || "default",
      limit: plan.limit
    });

    res.json({
      success: true,
      apiKey: apiKey.key,
      plan: userPlan,
      limit: plan.limit
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* =========================
   GET ALL API KEYS
========================= */
router.get("/keys", auth, async (req, res) => {
  try {
    const keys = await ApiKey.find({ userId: req.user._id })
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      total: keys.length,
      data: keys
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* =========================
   DELETE API KEY
========================= */
router.delete("/key/:id", auth, async (req, res) => {
  try {
    await ApiKey.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id
    });

    res.json({
      success: true,
      message: "API key deleted"
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* =========================
   UPGRADE PLAN → PRO
========================= */
router.post("/upgrade", auth, async (req, res) => {
  try {
    req.user.plan = "pro";
    await req.user.save();

    await ApiKey.updateMany(
      { userId: req.user._id },
      { limit: planConfig.pro.limit }
    );

    res.json({
      success: true,
      message: "Upgraded to PRO 🚀"
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* =========================
   PROTECTED API (PAKAI API KEY)
========================= */
router.get("/data", apiKeyAuth, async (req, res) => {
  res.json({
    success: true,
    message: "Protected data accessed",
    usage: req.apiKey.usage,
    limit: req.apiKey.limit
  });
});

module.exports = router;
