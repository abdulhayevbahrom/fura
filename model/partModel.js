const { Schema, model } = require("mongoose");

const partSchema = new Schema(
  {
    name: { type: String, required: true },
    status: {
      type: String,
      default: "active",
      enum: ["active", "in_progress", "finished"],
    },
    avarage_fuel: { type: Number, default: 0 }, // for 100 km
    start_probeg: { type: Number, default: 0 },
    end_probeg: { type: Number, default: 0 },
    start_fuel: { type: Number, default: 0 },
    end_fuel: { type: Number, default: 0 },
    totalFuel: { type: Number, default: 0 },
    distance: { type: Number, default: 0 },
    totalFuelAvailable: { type: Number, default: 0 },
    driver: { type: Schema.Types.ObjectId, ref: "drivers", default: null },
  },
  {
    timestamps: true,
  }
);

module.exports = model("parts", partSchema);
