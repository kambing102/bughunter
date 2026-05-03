const mongoose = require("mongoose");

const apiKeySchema = new mongoose.Schema({
  // relasi ke user (owner API key)
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },

  // API key string
  key: {
    type: String,
    required: true,
    unique: true
  },

  // nama key (biar gampang di dashboard)
  name: {
    type: String,
    default: "default"
  },

  // deskripsi opsional
  description: {
    type: String,
    default: ""
  },

  // status aktif
  active: {
    type: Boolean,
    default: true
  },

  // jumlah request yang sudah dipakai
  usage: {
    type: Number,
    default: 0
  },

  // limit request per periode
  limit: {
    type: Number,
    default: 100 // free plan default
  },

  // kapan reset usage
  resetAt: {
    type: Date,
    default: () => new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 jam
  },

  // terakhir dipakai
  lastUsedAt: {
    type: Date
  },

  // kapan dibuat
  createdAt: {
    type: Date,
    default: Date.now
  }

}, {
  timestamps: true // auto createdAt & updatedAt
});

module.exports = mongoose.model("ApiKey", apiKeySchema);
