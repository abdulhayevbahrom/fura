const Ajv = require("ajv");
const ajv = new Ajv({ allErrors: true });
require("ajv-errors")(ajv);
require("ajv-formats")(ajv);
const response = require("../utils/response");

const adminValidation = (req, res, next) => {
  const schema = {
    type: "object",
    properties: {
      firstName: { type: "string", minLength: 2, maxLength: 50 },
      lastName: { type: "string", minLength: 2, maxLength: 50 },
      login: {
        type: "string",
        minLength: 4,
        maxLength: 20,
        pattern: "^[a-zA-Z0-9]+$",
      },
      password: { type: "string", minLength: 6, maxLength: 50 },
      role: {
        type: "string",
        enum: ["owner", "admin"],
      },
      permissions: {
        type: "object",
        properties: {},
      },
    },
    required: ["firstName", "lastName", "login", "password", "role"],
    additionalProperties: false,
    errorMessage: {
      required: {
        firstName: "Ism kiritish shart",
        lastName: "Familiya kiritish shart",
        login: "Login kiritish shart",
        password: "Parol kiritish shart",
      },
      properties: {
        firstName: "Ism 2-50 ta belgi oralig‘ida bo‘lishi kerak",
        lastName: "Familiya 2-50 ta belgi oralig‘ida bo‘lishi kerak",
        login: "Login 4-20 ta belgidan iborat, faqat harflar va raqamlar",
        password: "Parol 6-50 ta belgi oralig‘ida bo‘lishi kerak",
        role: "Role faqat 'owner' yoki 'admin' bo‘lishi kerak",
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

module.exports = adminValidation;
