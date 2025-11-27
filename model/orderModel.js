const { Schema, model } = require("mongoose");

const orderSchema = new Schema(
  {
    part_id: { type: Schema.Types.ObjectId, ref: "parts" },
    driver: { type: Schema.Types.ObjectId, ref: "drivers" },
    car: { type: Schema.Types.ObjectId, ref: "cars" },
    trailer: { type: Schema.Types.ObjectId, ref: "trailers" },
    partner: { type: Schema.Types.ObjectId, ref: "partners" },
    driver_salary: { type: Number, default: 0 },
    driver_salary_currency_id: { type: Schema.Types.ObjectId, ref: "currency" },
    status: { type: Boolean, default: true },
    state: {
      type: String,
      default: "pending",
      enum: ["pending", "accepted", "rejected", "finished"],
    },
    title: { type: String, required: true },
    weight: { type: Number, required: true },

    from: { type: String, required: true },
    to: { type: String, required: true },
    distance: { type: Number, default: 0 },
    totalPrice: { type: Number, default: 0 },
    currency_id: { type: Schema.Types.ObjectId, ref: "currency" },
    deleted: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  }
);

module.exports = model("orders", orderSchema);
