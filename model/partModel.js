const { Schema, model } = require("mongoose");

const partSchema = new Schema(
  {
    name: { type: String, required: true },
    status: {
      type: String,
      default: "active",
      enum: ["active", "in_progress", "finished"],
    },
  },
  {
    timestamps: true,
  }
);

module.exports = model("parts", partSchema);
