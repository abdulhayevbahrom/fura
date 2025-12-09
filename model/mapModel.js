const { Schema, model } = require("mongoose");

const mapSchema = new Schema(
  {
    driver: { type: Schema.Types.ObjectId, ref: "drivers", required: true },
    lat: { type: Number, required: true },
    long: { type: Number, required: true },
    speed: { type: Number, required: true },
  },
  {
    timestamps: true,
  }
);

module.exports = model("maps", mapSchema);
