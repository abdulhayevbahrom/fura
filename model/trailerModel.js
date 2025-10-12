const { model, Schema } = require("mongoose");

const vehicleSchema = new Schema(
  {
    name: { type: String, required: true }, // Gildirak nomi/turi
    price: { type: Number, default: 0 }, // Narxi
    deleted: { type: Boolean, default: false }, // O'chirilgan yoki yo'q
  },
  { timestamps: true }
);

const trailerSchema = new Schema({
  number: { type: String, required: true },
  vehicles: {
    left_front: [vehicleSchema],
    right_front: [vehicleSchema],
    left_back: [vehicleSchema],
    right_back: [vehicleSchema],
    left_center: [vehicleSchema],
    right_center: [vehicleSchema],
  },
  status: { type: Boolean, default: true },
});

module.exports = model("trailers", trailerSchema);
