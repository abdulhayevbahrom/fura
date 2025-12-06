// models/salaryModel.js
const { Schema, model } = require("mongoose");

const salarySchema = new Schema(
  {
    // Qaysi xodim (driver/usta/manager hammasi shu jadvaldan)
    driver: { type: Schema.Types.ObjectId, ref: "drivers", required: true },

    // Agar zakaz orqali bo'lsa
    order_id: { type: Schema.Types.ObjectId, ref: "orders" },

    // Oylik uchun oy nomi (YYYY-MM)
    month: { type: String }, // masalan "2025-03"

    // Original valyutada yozilgan summa
    amount: { type: Number, required: true },

    // Qaysi valyutada yozilgan (UZS, USD, ...)
    currency_id: {
      type: Schema.Types.ObjectId,
      ref: "currency",
      required: true,
    },

    // Bazaviy valyutada (masalan USD) ga o'tkazilgan summa
    amount_base: { type: Number, required: true },

    // Qo'shimcha izoh
    description: { type: String },

    // To'lov turi (pul berilganda kerak)
    paymentType: {
      type: String,
      enum: ["naqd", "karta", null],
      default: "naqd",
    },

    // type bo'yicha balansga ta'sir:
    //  - 'order'  => zakazdan kelgan summa (balans +)
    //  - 'oylik'  => oylik stavka bo'yicha yozilgan summa (balans +)
    //  - 'payment' => haydovchiga/to'lov berilganda (balans -)
    //  - 'avans'  => avans (balans -)
    //  - 'bonus'  => bonus (balans ozgarmaydi)
    type: {
      type: String,
      enum: ["order", "payment", "avans", "oylik", "bonus"],
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = model("salaries", salarySchema);
