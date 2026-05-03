const mongoose = require("mongoose");

const apiKeySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  key: { type: String, unique: true },
  name: String,
  active: { type: Boolean, default: true },
  usage: { type: Number, default: 0 },
  limit: { type: Number, default: 100 }, // free plan
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("ApiKey", apiKeySchema);
