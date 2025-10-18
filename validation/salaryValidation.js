const Ajv = require("ajv");
const ajv = new Ajv({ allErrors: true });
require("ajv-errors")(ajv);
require("ajv-formats")(ajv);
const response = require("../utils/response");

const salaryValidation = (req, res, next) => {
  const schema = {
    type: "object",
    properties: {
      driver: { type: "string", minLength: 24, maxLength: 24 }, // MongoDB ObjectId
      month: {
        type: "string",
        pattern: "^(19|20)\\d{2}-(0[1-9]|1[0-2])$", // 2025-01 format
      },
      amount: { type: "number", minimum: 0 },
      description: { type: "string", maxLength: 200 },
      paymentType: {
        type: "string",
        enum: ["naqd", "karta"],
      },
      status: {
        type: "string",
        enum: ["avans", "oylik"],
      },
    },
    required: ["driver", "month", "amount", "paymentType", "status"],
    additionalProperties: false,
    errorMessage: {
      required: {
        driver: "Haydovchi ID majburiy",
        month: "Oy majburiy (masalan 2025-01)",
        amount: "Summani kiritish majburiy",
        paymentType: "To‘lov turini kiritish majburiy",
        status: "Statusni kiritish majburiy, masalan toliq, avans, bonus",
      },
      properties: {
        driver: "Noto‘g‘ri haydovchi ID",
        month: "Oy formati noto‘g‘ri (YYYY-MM bo‘lishi kerak)",
        amount: "Summani to‘g‘ri kiriting",
        paymentType: "To‘lov turi noto‘g‘ri, masalan naqd yoki karta",
        status: "Status noto‘g‘ri qiymat oldi",
      },
      additionalProperties: "Ruxsat etilmagan maydon kiritildi",
    },
  };

  const validate = ajv.compile(schema);
  const valid = validate(req.body);

  if (!valid) {
    const errorField =
      validate.errors[0].instancePath.replace("/", "") || "Umumiy";
    const errorMessage = validate.errors[0].message;
    return response.error(res, `${errorField} xato: ${errorMessage}`);
  }

  next();
};

module.exports = salaryValidation;
