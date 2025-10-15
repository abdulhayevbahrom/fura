const { Schema, model } = require("mongoose");

const salarySchema = new Schema(
  {
    driver: { type: Schema.Types.ObjectId, ref: "drivers", required: true }, // qaysi haydovchi
    part_id: { type: Schema.Types.ObjectId, ref: "parts" },
    month: { type: String }, // 1-12 (2025-01)
    amount: { type: Number, required: true }, // qancha summa oldi
    description: { type: String }, // izoh
    paymentType: {
      type: String,
      enum: ["naqd", "karta"],
      default: "naqd",
    },
    status: {
      type: String,
      enum: ["avans", "oylik"],
      default: "oylik",
    },
  },
  { timestamps: true }
);

module.exports = model("salaries", salarySchema);
