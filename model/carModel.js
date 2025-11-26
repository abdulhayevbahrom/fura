const { Schema, model } = require("mongoose");

const vehicleSchema = new Schema(
  {
    name: { type: String }, // Gildirak nomi/turi
    price: { type: Number, default: 0 }, // Narxi
    currency_id: { type: Schema.Types.ObjectId, ref: "currency" },
    deleted: { type: Boolean, default: false }, // O'chirilgan yoki yo'q
  },
  { timestamps: true }
);

const cpuSchema = new Schema(
  {
    marka: { type: String, default: "" },
    model: { type: String, default: "" },
    year: { type: Number, default: 0 },
    number: { type: String, default: "" },
    price: { type: Number, default: 0 },
    currency_id: { type: Schema.Types.ObjectId, ref: "currency" },
  },
  { timestamps: true }
);

const carsSchema = new Schema(
  {
    image: { type: String },
    title: { type: String, required: true },
    number: { type: String, required: true },
    year: { type: Number, required: true },

    probeg: { type: Number, required: true },
    vehicles: {
      right_front: [vehicleSchema],
      left_front: [vehicleSchema],
      right_back: [vehicleSchema],
      left_back: [vehicleSchema],
      back_right_in: [vehicleSchema],
      back_left_in: [vehicleSchema],
      additional_left: [vehicleSchema],
      additional_right: [vehicleSchema],
      extra_tir: [vehicleSchema],
    },
    cpu: [cpuSchema],
    status: { type: Boolean, default: false },
    deleted: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  }
);

module.exports = model("cars", carsSchema);
