const { Schema, model } = require("mongoose");

const driversSchema = new Schema(
  {
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    phone: { type: String, required: true },
    address: { type: String, required: true },
    balance: { type: Number, default: 0 },
    status: { type: Boolean, default: true },
    login: { type: String, required: true },
    password: { type: String, required: true },
    is_active: {
      type: Boolean,
      default: true,
    },
    is_deleted: {
      type: Boolean,
      default: false,
    },
    role: {
      type: String,
      default: "driver",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = model("drivers", driversSchema);
