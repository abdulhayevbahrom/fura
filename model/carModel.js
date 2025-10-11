const { Schema, model } = require("mongoose");

const vehicleSchema = new Schema(
  {
    name: { type: String, required: true }, // Gildirak nomi/turi
    price: { type: Number, default: 0 }, // Narxi
    deleted: { type: Boolean, default: false }, // O'chirilgan yoki yo'q
  },
  { timestamps: true }
);

const cpuSchema = new Schema(
  {
    marka: { type: String, required: true },
    model: { type: String, required: true },
    year: { type: Number, required: true },
    number: { type: String, required: true },
    price: { type: Number, default: 0 },
  },
  { timestamps: true }
);

const carsSchema = new Schema(
  {
    title: { type: String, required: true },
    number: { type: String, required: true },
    year: { type: Number, required: true },
    fuelFor100km: { type: Number, required: true },
    probeg: { type: Number, required: true },
    vehicles: {
      right_front: [vehicleSchema],
      left_front: [vehicleSchema],
      right_back: [vehicleSchema],
      left_back: [vehicleSchema],
      back_right_in: [vehicleSchema],
      back_left_in: [vehicleSchema],
    },
    cpu: [cpuSchema],
    licens: { type: String, required: true }, // ← Date o‘rniga String
    sugurta: { type: String, required: true }, // ← Date o‘rniga String
    status: { type: Boolean, default: true },
  },
  {
    timestamps: true,
  }
);

module.exports = model("cars", carsSchema);
