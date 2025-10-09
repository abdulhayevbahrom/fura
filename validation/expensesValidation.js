const Ajv = require("ajv");
const ajv = new Ajv({ allErrors: true });
require("ajv-errors")(ajv);
require("ajv-formats")(ajv);
const response = require("../utils/response");

const expenseValidation = (req, res, next) => {
  const schema = {
    type: "object",
    properties: {
      name: {
        type: "string",
        minLength: 1,
      },
      amount: {
        type: "number",
        minimum: 0,
      },
      from: {
        type: "string",
        enum: ["owner", "client", "expense"],
      },
      order_id: {
        type: "string",
        pattern: "^[0-9a-fA-F]{24}$",
      },
      description: { type: "string" },
      car: { type: "string", pattern: "^[0-9a-fA-F]{24}$" },
      quantity: { type: "number", minimum: 1 },
      category: { type: "string" },
      type: {
        type: "string",
        enum: ["repair", "order_expense", "office_expense"],
      },
    },
    required: ["name", "amount", "category", "type"],
    additionalProperties: false,
    errorMessage: {
      required: {
        name: "Xarajat nomi kiritilishi shart",
        amount: "Xarajat summasi kiritilishi shart",
        category: "Xarajat kategoriyasi kiritilishi shart",
        type: "Xarajat turi kiritilishi shart, repair yoki order_expense yoki office_expense bo'lishi kerak",
      },
      properties: {
        name: "Xarajat nomi kamida 1 ta belgidan iborat bo'lishi kerak",
        amount: "Xarajat summasi musbat son bo'lishi kerak",
        category: "Xarajat kategoriyasi kiritilishi shart",
        type: "Xarajat turi repair yoki order_expense yoki office_expense bo'lishi kerak",
      },
      additionalProperties: "Ruxsat etilmagan maydon kiritildi",
    },
  };

  const validate = ajv.compile(schema);
  const result = validate(req.body);

  if (!result) {
    let errorField =
      validate.errors[0].instancePath.replace("/", "") || "Umumiy";
    let errorMessage = validate.errors[0].message;
    return response.error(res, `${errorField} xato: ${errorMessage}`);
  }
  next();
};

module.exports = expenseValidation;
