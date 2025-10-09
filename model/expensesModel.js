const { Schema, model } = require("mongoose");

const expenseSchema = new Schema(
  {
    name: { type: String, required: true },
    amount: { type: Number, required: true },
    from: {
      type: String,
      enum: ["owner", "client", "expense"],
    },
    order_id: { type: Schema.Types.ObjectId, ref: "orders" },
    description: { type: String, default: "" },
    deleted: { type: Boolean, default: false },
    paymentType: { type: String, enum: ["naqd", "karta"], default: "naqd" },
    car: { type: Schema.Types.ObjectId, ref: "cars" }, // qaysi mashina
    trailer: { type: Schema.Types.ObjectId, ref: "trailers" }, // qaysi treyler
    quantity: { type: Number, default: 1 },
    category: { type: String, default: "boshqa" }, // kategoriya qaysi qismiligi
    type: { type: String, enum: ["repair", "order_expense", "office_expense"] },
  },
  {
    timestamps: true,
  }
);

module.exports = model("expenses", expenseSchema);
