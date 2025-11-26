const { Schema, model } = require("mongoose");

const fuelSchema = new Schema(
  {
    name: { type: String, required: true },
    // from to probeg
    from: { type: String, required: true },
    to: { type: String, required: true },
  },
  { timestamps: true }
);

module.exports = model("fuels", fuelSchema);
