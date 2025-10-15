const Ajv = require("ajv");
const addErrors = require("ajv-errors");
const addFormats = require("ajv-formats");
const response = require("../utils/response");

const ajv = new Ajv({ allErrors: true });
addErrors(ajv);
addFormats(ajv);

const orderValidation = (req, res, next) => {
  const schema = {
    type: "object",
    properties: {
      part_id: {
        type: "string",
        pattern: "^[0-9a-fA-F]{24}$",
        errorMessage: "Partiya id 24 ta belgi bo'lishi kerak",
      },
      part_name: {
        type: "string",
      },
      driver: {
        type: "string",
        pattern: "^[0-9a-fA-F]{24}$",
        errorMessage: "Haydovchi id 24 ta belgi bo'lishi kerak",
      },
      car: {
        type: "string",
        pattern: "^[0-9a-fA-F]{24}$",
        errorMessage: "Mashina id 24 ta belgi bo'lishi kerak",
      },
      trailer: {
        type: "string",
        pattern: "^[0-9a-fA-F]{24}$",
        errorMessage: "Pritsep id 24 ta belgi bo'lishi kerak",
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
        enum: ["pending", "accepted", "rejected", "finished"],
      },
    },

    required: [
      "driver",
      "car",
      "trailer",
      "partner",
      "title",
      "weight",
      "from",
      "to",
      "totalPrice",
    ],

    additionalProperties: false,

    errorMessage: {
      required: {
        driver: "Haydovchi id kiritish shart",
        car: "Mashina id kiritish shart",
        trailer: "Pritsep id kiritish shart",
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

module.exports = orderValidation;
