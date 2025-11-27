const { Schema, model } = require("mongoose");

const fuelSchema = new Schema(
  {
    car_id: { type: Schema.Types.ObjectId, ref: "cars" },
    name: { type: String, required: true },
    // from to probeg
    from: { type: Number, required: true },
    to: { type: Number, required: true },
    deleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = model("fuels", fuelSchema);
