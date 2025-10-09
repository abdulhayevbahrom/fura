const Ajv = require("ajv");
const ajv = new Ajv({ allErrors: true });
require("ajv-errors")(ajv);
require("ajv-formats")(ajv);
const response = require("../utils/response");

const carsValidation = (req, res, next) => {
  const schema = {
    type: "object",
    properties: {
      title: { type: "string" },
      number: { type: "string" },
      year: { type: "number" },
      fuelFor100km: { type: "number" },
      probeg: { type: "number" },
      vehicles: {
        type: "object",
        properties: {
          right_front: { type: "array", items: { type: "string" } },
          left_front: { type: "array", items: { type: "string" } },
          right_back: { type: "array", items: { type: "string" } },
          left_back: { type: "array", items: { type: "string" } },
          back_right_in: { type: "array", items: { type: "string" } },
          back_left_in: { type: "array", items: { type: "string" } },
        },
      },
      cpu: {
        type: "object",
        properties: {
          marka: { type: "string" },
          model: { type: "string" },
          year: { type: "number" },
          number: { type: "string" },
        },
        required: ["marka", "model", "year", "number"],
      },
      licens: { type: "string" },
      sugurta: { type: "string" },
    },
    required: [
      "title",
      "number",
      "year",
      "fuelFor100km",
      "probeg",
      "vehicles",
      "cpu",
      "licens",
      "sugurta",
    ],
    additionalProperties: false,
    errorMessage: {
      required: {
        title: "Nomi kiritish shart",
        number: "Raqami kiritish shart",
        year: "Yili kiritish shart",
        fuelFor100km: "Yoqilgi sarfi 100 km uchun kiritish shart",
        probeg: "Probel kiritish shart",
        vehicles: "g'ildiraklar kiritish shart",
        cpu: "cpu kiritish shart",
        licens: "licens kiritish shart",
        sugurta: "sugurta kiritish shart",
      },
      properties: {
        title: "Nomi string bo'lishi kerak",
        number: "Raqami string bo'lishi kerak",
        year: "Yili 4 ta belgi oralig'ida bo'lishi kerak",
        fuelFor100km:
          "Yoqilgi sarfi 100 km uchun 0 yoki undan katta bo'lishi kerak",
        probeg: "Probel 0 yoki undan katta bo'lishi kerak raqam turida bolsin",
        vehicles: "g'ildiraklar maydoni noto'g'ri formatda",
        cpu: "cpu maydoni noto'g'ri formatda",
        licens: "licens maydoni noto'g'ri formatda",
        sugurta: "sugurta maydoni noto'g'ri formatda",
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

module.exports = carsValidation;
