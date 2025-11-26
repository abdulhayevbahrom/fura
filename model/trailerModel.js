const { model, Schema } = require("mongoose");

const vehicleSchema = new Schema(
  {
    name: { type: String, required: true }, // Gildirak nomi/turi
    price: { type: Number, default: 0 }, // Narxi
    currency_id: { type: Schema.Types.ObjectId, ref: "currency" },
    deleted: { type: Boolean, default: false }, // O'chirilgan yoki yo'q
  },
  { timestamps: true }
);

const trailerSchema = new Schema({
  number: { type: String, required: true },
  vehicles: {
    left_front: [vehicleSchema],
    left_front_2: [vehicleSchema],
    right_front: [vehicleSchema],
    right_front_2: [vehicleSchema],
    left_back: [vehicleSchema],
    left_back_2: [vehicleSchema],
    right_back: [vehicleSchema],
    right_back_2: [vehicleSchema],
    left_center: [vehicleSchema],
    left_center_2: [vehicleSchema],
    right_center: [vehicleSchema],
    right_center_2: [vehicleSchema],
    extra_tir: [vehicleSchema],
  },
  status: { type: Boolean, default: false },
  deleted: { type: Boolean, default: false },
});

module.exports = model("trailers", trailerSchema);
