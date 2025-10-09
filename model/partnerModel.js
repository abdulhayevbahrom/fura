const { Schema, model } = require("mongoose");

const partnerSchema = new Schema(
  {
    fullname: { type: String, required: true },
    phone: [String],
    address: { type: String, required: true },
    deleted: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  }
);

module.exports = model("partners", partnerSchema);
