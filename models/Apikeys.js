const mongoose = require("mongoose");

const ApiKeySchema = new mongoose.Schema({
  key: String,
  owner: String,
  active: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("ApiKey", ApiKeySchema);
