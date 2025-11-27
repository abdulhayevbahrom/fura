const Ajv = require("ajv");
const addErrors = require("ajv-errors");
const addFormats = require("ajv-formats");
const response = require("../utils/response");

const ajv = new Ajv({ allErrors: true });
addErrors(ajv);
addFormats(ajv);

const orderValidationByPartId = (req, res, next) => {
  const schema = {
    type: "object",
    properties: {
      part_id: {
        type: "string",
        pattern: "^[0-9a-fA-F]{24}$",
        errorMessage: "Partiya id 24 ta belgi bo'lishi kerak",
      },
      partner: {
        type: "string",
        pattern: "^[0-9a-fA-F]{24}$",
        errorMessage: "Hamkor id 24 ta belgi bo'lishi kerak",
      },
      driver_salary: {
        type: "number",
        errorMessage: "Haydovchi maosh raqam bo'lishi kerak",
      },
      title: {
        type: "string",
        minLength: 1,
        errorMessage: "Nom string bo'lishi kerak",
      },
      weight: {
        type: "number",
        errorMessage: "Og'irlik raqam bo'lishi kerak",
      },
      from: {
        type: "string",
        minLength: 1,
        errorMessage: "Qayerdanligini kiritish shart",
      },
      to: {
        type: "string",
        minLength: 1,
        errorMessage: "Qayergaligini kiritish shart",
      },
      distance: { type: "number" },
      totalPrice: {
        type: "number",
        errorMessage: "Umumiy narx raqam bo'lishi kerak",
      },
      state: {
        type: "string",
        default: "pending",
        enum: ["pending", "accepted", "rejected", "finished"],
      },
    },

    required: ["partner", "title", "weight", "from", "to"],

    additionalProperties: true,

    errorMessage: {
      required: {
        title: "Nom kiritish shart",
        weight: "Og'irlik kiritish shart",
        from: "Qayerdanligini kiritish shart",
        to: "Qayergaligini kiritish shart",
        totalPrice: "Umumiy narx kiritish shart",
      },
      additionalProperties: "Ruxsat etilmagan maydon kiritildi",
    },
  };

  const validate = ajv.compile(schema);
  const valid = validate(req.body);

  if (!valid) {
    const err = validate.errors[0];
    const field = err.instancePath?.replace("/", "") || "Umumiy";
    const message = err.message || "Xato ma'lumot";
    return response.error(res, `${field} xato: ${message}`);
  }

  next();
};

module.exports = orderValidationByPartId;
