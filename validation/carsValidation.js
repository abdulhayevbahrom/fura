const Ajv = require("ajv");
const ajv = new Ajv({ allErrors: true });
require("ajv-errors")(ajv);
require("ajv-formats")(ajv);
const response = require("../utils/response");

const carsValidation = (req, res, next) => {
  // 1. req.body ni JSON obyektiga aylantirish
  if (typeof req.body === "object" && req.body !== null) {
    Object.keys(req.body).forEach((key) => {
      try {
        req.body[key] = JSON.parse(req.body[key]);
      } catch (err) {
        // Agar JSON emas bo'lsa, string sifatida qoldiriladi
      }
    });
  }

  const schema = {
    type: "object",
    properties: {
      file: { type: "string" },
      title: { type: "string", minLength: 1 },
      number: { type: "string", minLength: 1 },
      year: { type: "number", minimum: 1900, maximum: 2100 },
      probeg: { type: "number", minimum: 0 },
      vehicles: {
        type: "object",
        properties: {
          right_front: {
            type: "array",
            items: {
              type: "object",
              properties: {
                name: { type: "string", minLength: 1 },
                price: { type: "number", minimum: 0 },
              },
              required: ["name", "price"],
              additionalProperties: false,
            },
          },
          left_front: {
            type: "array",
            items: {
              type: "object",
              properties: {
                name: { type: "string", minLength: 1 },
                price: { type: "number", minimum: 0 },
              },
              required: ["name", "price"],
              additionalProperties: false,
            },
          },
          right_back: {
            type: "array",
            items: {
              type: "object",
              properties: {
                name: { type: "string", minLength: 1 },
                price: { type: "number", minimum: 0 },
              },
              required: ["name", "price"],
              additionalProperties: false,
            },
          },
          left_back: {
            type: "array",
            items: {
              type: "object",
              properties: {
                name: { type: "string", minLength: 1 },
                price: { type: "number", minimum: 0 },
              },
              required: ["name", "price"],
              additionalProperties: false,
            },
          },
          back_right_in: {
            type: "array",
            items: {
              type: "object",
              properties: {
                name: { type: "string", minLength: 1 },
                price: { type: "number", minimum: 0 },
              },
              required: ["name", "price"],
              additionalProperties: false,
            },
          },
          back_left_in: {
            type: "array",
            items: {
              type: "object",
              properties: {
                name: { type: "string", minLength: 1 },
                price: { type: "number", minimum: 0 },
              },
              required: ["name", "price"],
              additionalProperties: false,
            },
          },
          additional_left: {
            type: "array",
            items: {
              type: "object",
              properties: {
                name: { type: "string", minLength: 1 },
                price: { type: "number", minimum: 0 },
              },
              required: ["name", "price"],
              additionalProperties: false,
            },
          },
          additional_right: {
            type: "array",
            items: {
              type: "object",
              properties: {
                name: { type: "string", minLength: 1 },
                price: { type: "number", minimum: 0 },
              },
              required: ["name", "price"],
              additionalProperties: false,
            },
          },
          extra_tir: {
            type: "array",
            items: {
              type: "object",
              properties: {
                name: { type: "string", minLength: 1 },
                price: { type: "number", minimum: 0 },
              },
              required: ["name", "price"],
              additionalProperties: false,
            },
          },
        },
        additionalProperties: false,
      },
      cpu: {
        type: "array",
        minItems: 1,
        items: {
          type: "object",
          properties: {
            marka: { type: "string" },
            model: { type: "string" },
            year: { type: "number" },
            number: { type: "string" },
            price: { type: "number" },
          },
          required: [],
          additionalProperties: false,
        },
      },
    },
    required: ["title", "number", "year", "probeg"],
    additionalProperties: true,
    errorMessage: {
      required: {
        title: "Nomi kiritish shart",
        number: "Raqami kiritish shart",
        year: "Yili kiritish shart",
        probeg: "Probeg kiritish shart",
      },
      properties: {
        title: "Nomi bo'sh bo'lmasligi kerak",
        number: "Raqami bo'sh bo'lmasligi kerak",
        year: "Yili 1900 va 2100 oralig'ida bo'lishi kerak",
        probeg: "Probeg 0 yoki undan katta bo'lishi kerak",
      },
      additionalProperties: "Ruxsat etilmagan maydon kiritildi",
    },
  };

  const validate = ajv.compile(schema);
  const result = validate(req.body);

  if (!result) {
    const errors = validate.errors.map((err) => {
      const field = err.instancePath.replace("/", "") || "Umumiy";
      return `${field}: ${err.message}`;
    });

    return response.error(res, errors.join(", "));
  }

  next();
};

module.exports = carsValidation;
