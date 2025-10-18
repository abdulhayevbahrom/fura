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
  },
  {
    timestamps: true,
  }
);

module.exports = model("expenses", expenseSchema);

// {
//             "car": {
//                 "_id": "68ecf2034e6fba7b63edf2ba",
//                 "title": "Chevrolet Malibu",
//                 "number": "01A123AA",
//                 "year": 2020,
//                 "fuelFor100km": 8.5,
//                 "probeg": 221700,
//                 "licens": "2025-12-31",
//                 "sugurta": "2025-06-30",
//                 "status": false,
//                 "createdAt": "2025-10-13T12:35:15.583Z",
//                 "updatedAt": "2025-10-15T10:46:07.083Z",
//                 "__v": 0
//             },
//             "totalOrders": 6,
//             "totalPrice": 1004600,
//             "totalExpenses": 2500,
//             "totalRepairPrice": 0,
//             "driverSalary": 101385,
//             "profit": 903215
//         },