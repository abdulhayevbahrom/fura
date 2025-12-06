const { Schema, model } = require("mongoose");

const expenseSchema = new Schema(
  {
    name: { type: String, required: true },
    amount: { type: Number, required: true },
    currency_id: { type: Schema.Types.ObjectId, ref: "currency" },
    from: {
      type: String,
      enum: ["owner", "client", "expense"],
    },
    order_id: { type: Schema.Types.ObjectId, ref: "orders" },
    part_id: { type: Schema.Types.ObjectId, ref: "parts", default: null },
    description: { type: String, default: "" },
    deleted: { type: Boolean, default: false },
    paymentType: { type: String, enum: ["naqd", "karta"], default: "naqd" },
    car: { type: Schema.Types.ObjectId, ref: "cars" }, // qaysi mashina
    trailer: { type: Schema.Types.ObjectId, ref: "trailers" }, // qaysi treyler
    quantity: { type: Number, default: 1 },
    category: { type: String, default: "boshqa" }, // kategoriya qaysi qismiligi
    type: { type: String, enum: ["repair", "order_expense", "office_expense"] },
    vehicleId: { type: String, default: null },
    cpuId: { type: String, default: null },
    // YANGI: haydovchi va mijoz // bu qism faqat haydovchi mijozdan pul olganA ISHLAYDI
    // YANGI: kim olgan bo‘lsa – driver ham, boshliq/manager ham shu yerda
    client_id: {
      type: Schema.Types.ObjectId,
      refPath: "partners",
      default: null,
    },
    receiver: {
      type: Schema.Types.ObjectId,
      refPath: "receiverModel",
      default: null,
    },
    receiverModel: {
      type: String,
      enum: ["drivers", "Admins"],
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = model("expenses", expenseSchema);
