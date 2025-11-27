const { Schema, model } = require("mongoose");

const driversSchema = new Schema(
  {
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    phone: { type: String, required: true },
    address: { type: String, required: true },
    balance: { type: Number, default: 0 },
    status: { type: Boolean, default: true },
    login: { type: String },
    password: { type: String },
    is_active: {
      type: Boolean,
      default: true,
    },
    is_deleted: {
      type: Boolean,
      default: false,
    },
    role: {
      type: String,
      default: "driver",
      required: true,
    },
    salary: { type: Number, default: 0 },
    currency_id: { type: Schema.Types.ObjectId, ref: "currency" },
    permissions: {
      type: Object,
      default: {
        dashboard: false,
        users: false,
        cars: false,
        trailers: false,
        partners: false,
        orders: false,
        expenses: false,
        salary: false,
        income: false,
        carStats: false,
        newOrders: false,
        currencies: false,
      },
    },
  },
  {
    timestamps: true,
  }
);

module.exports = model("drivers", driversSchema);
