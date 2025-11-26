const Ajv = require("ajv");
const ajv = new Ajv({ allErrors: true });
require("ajv-errors")(ajv);
require("ajv-formats")(ajv);
const response = require("../utils/response");

const driversValidation = (req, res, next) => {
  const schema = {
    type: "object",
    properties: {
      firstName: { type: "string", minLength: 2, maxLength: 50 },
      lastName: { type: "string", minLength: 2, maxLength: 50 },
      phone: { type: "string" },
      address: { type: "string", minLength: 2, maxLength: 50 },
      login: {
        type: "string",
        minLength: 4,
        maxLength: 20,
        pattern: "^[a-zA-Z0-9]+$",
      },
      password: { type: "string", minLength: 1 },
      role: {
        type: "string",
        default: "driver",
      },
      salary: { type: "number", default: 0 },
    },
    required: ["firstName", "lastName", "phone", "address", "role"],
    additionalProperties: false,
    errorMessage: {
      required: {
        firstName: "Ism kiritish shart",
        lastName: "Familiya kiritish shart",
        phone: "Telefon raqami kiritish shart",
        address: "Manzil kiritish shart",
        role: "Role kiritish shart",
      },
      properties: {
        firstName:
          "Ism 2-50 ta belgi oralig'ida bo'lishi kerak string turida bolsin",
        lastName:
          "Familiya 2-50 ta belgi oralig'ida bo'lishi kerak string turida bolsin",
        phone: "Telefon  raqami string turida bolsin",
        address:
          "Manzil 2-50 ta belgi oralig'ida bo'lishi kerak string turida bolsin",
        role: "Role string turida bolsin",
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

module.exports = driversValidation;
