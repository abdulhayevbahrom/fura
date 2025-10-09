const { model, Schema } = require("mongoose");

const trailerSchema = new Schema({
  number: { type: String, required: true },
  vehicles: {
    left_front: [String],
    right_front: [String],
    left_back: [String],
    right_back: [String],
    left_center: [String],
    right_center: [String],
  },
  status: { type: Boolean, default: true },
});

module.exports = model("trailers", trailerSchema);
