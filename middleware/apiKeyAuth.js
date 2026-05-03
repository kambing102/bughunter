const ApiKey = require("../models/ApiKey");

module.exports = async (req, res, next) => {
  try {
    const key = req.headers["x-api-key"];

    if (!key) {
      return res.status(401).json({ error: "API key required" });
    }

    const apiKey = await ApiKey.findOne({ key });

    if (!apiKey) {
      return res.status(403).json({ error: "Invalid API key" });
    }

    if (!apiKey.active) {
      return res.status(403).json({ error: "API key inactive" });
    }

    // 🔥 RESET LIMIT (per hari)
    if (new Date() > apiKey.resetAt) {
      apiKey.usage = 0;
      apiKey.resetAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    }

    // 🔥 TAMBAH USAGE
    apiKey.usage++;

    // 🔥 DYNAMIC LIMIT
    if (apiKey.usage > apiKey.limit) {
      return res.status(429).json({
        error: "Rate limit exceeded"
      });
    }

    apiKey.lastUsedAt = new Date();

    await apiKey.save();

    req.apiKey = apiKey;

    next();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
