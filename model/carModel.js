const { Schema, model } = require("mongoose");

const drivesSchema = new Schema(
  {
    title: { type: String, required: true },
    number: { type: String, required: true },
    year: { type: Number, required: true },
    fuelFor100km: { type: Number, required: true },
    probeg: { type: Number, required: true },
    vehicles: {
      right_front: [String],
      left_front: [String],
      right_back: [String],
      left_back: [String],
      back_right_in: [String],
      back_left_in: [String],
    },
    cpu: {
      marka: { type: String, required: true },
      model: { type: String, required: true },
      year: { type: Number, required: true },
      number: { type: String, required: true },
    },
    licens: { type: String, required: true }, // ← Date o‘rniga String
    sugurta: { type: String, required: true }, // ← Date o‘rniga String
    status: { type: Boolean, default: true },
  },
  {
    timestamps: true,
  }
);

module.exports = model("cars", drivesSchema);
