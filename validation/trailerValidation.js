const Ajv = require("ajv");
const ajv = new Ajv({ allErrors: true });
require("ajv-errors")(ajv);
require("ajv-formats")(ajv);
const response = require("../utils/response");

const trailerValidation = (req, res, next) => {
  const schema = {
    type: "object",
    properties: {
      number: { type: "string" },
      vehicles: {
        type: "object",
        properties: {
          left_front: { type: "array", items: { type: "string" } },
          right_front: { type: "array", items: { type: "string" } },
          left_back: { type: "array", items: { type: "string" } },
          right_back: { type: "array", items: { type: "string" } },
          left_center: { type: "array", items: { type: "string" } },
          right_center: { type: "array", items: { type: "string" } },
        },
      },
    },
    additionalProperties: false,
    errorMessage: {
      required: {
        number: "Raqami kiritish shart",
        vehicles: "G'ildiraklar kiritish shart",
      },
      properties: {
        number: "Raqami 1-50 ta belgi oralig'ida bo'lishi kerak",
        vehicles: "G'ildiraklar kirtish shart",
      },
      additionalProperties: "Ruxsat etilmagan maydon kiritildi",
    },
  };

  const validate = ajv.compile(schema);
  const result = validate(req.body);

  if (!result) {
    const errorField =
      validate.errors[0].instancePath.replace("/", "") || "Umumiy";
    const errorMessage = validate.errors[0].message;
    return response.error(res, `${errorField} xato: ${errorMessage}`);
  }

  next();
};

module.exports = trailerValidation;
