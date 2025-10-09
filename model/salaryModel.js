const { Schema, model } = require("mongoose");

const salarySchema = new Schema(
  {
    driver: { type: Schema.Types.ObjectId, ref: "drivers", required: true }, // qaysi haydovchi
    month: { type: String, required: true }, // 1-12 (2025-01)
    amount: { type: Number, required: true }, // qancha summa oldi
    description: { type: String }, // izoh
    paymentType: {
      type: String,
      enum: ["naqd", "karta"],
      default: "naqd",
    },
    status: {
      type: String,
      enum: ["avans", "toliq", "bonus"],
      default: "toliq",
    },
  },
  { timestamps: true }
);

module.exports = model("salaries", salarySchema);
