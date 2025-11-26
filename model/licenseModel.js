const { Schema, model } = require("mongoose");

const licenseSchema = new Schema(
  {
    car_id: { type: Schema.Types.ObjectId, ref: "cars" },
    trailer_id: {
      type: Schema.Types.ObjectId,
      ref: "trailers",
    },
    name: { type: String, required: true },
    from: { type: String, required: true },
    to: { type: String, required: true },
    status: { type: Boolean, default: true },
    deleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = model("licenses", licenseSchema);
