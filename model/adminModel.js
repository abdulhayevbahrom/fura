const mongoose = require("mongoose");
const AdminSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: true,
      trim: true,
    },
    lastName: {
      type: String,
      required: true,
      trim: true,
    },
    login: {
      type: String,
      required: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
    },
    role: {
      type: String,
      default: "admin",
      enum: ["owner", "admin"],
    },
    permissions: {
      type: Object,
      default: {
        dashboard: true,
        users: true,
        cars: true,
        trailers: true,
        partners: true,
        orders: true,
        expenses: true,
        salary: true,
        income: true,
        carStats: true,
        newOrders: true,
        currencies: true,
        notification: true,
        map: false,
      },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Admins", AdminSchema);
