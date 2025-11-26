const { Schema, mongoose } = require("mongoose");

const currencySchema = new Schema(
  {
    name: { type: String, required: true },
    rate: { type: Number, required: true },
    status: { type: Boolean, default: true },
    deleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model("currency", currencySchema);
