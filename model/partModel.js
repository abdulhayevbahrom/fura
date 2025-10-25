const { Schema, model } = require("mongoose");

const partSchema = new Schema(
  {
    name: { type: String, required: true },
    status: {
      type: String,
      default: "active",
      enum: ["active", "in_progress", "finished"],
    },
    driver: { type: Schema.Types.ObjectId, ref: "drivers", default: null },
  },
  {
    timestamps: true,
  }
);

module.exports = model("parts", partSchema);
