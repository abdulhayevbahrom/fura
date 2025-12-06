const response = require("../utils/response");
const Partner = require("../model/partnerModel");
const mongoose = require("mongoose");

class PartnerController {
  async createPartner(req, res) {
    try {
      let { fullname, phone, address } = req.body;
      if (!fullname || !address) {
        return response.error(res, "Ism va manzil kiritish shart");
      }
      if (!phone?.length) {
        return response.error(res, "Kamida telefon raqam kiritish shart");
      }
      // check fullname
      let exist = await Partner.findOne({
        fullname: fullname.trim().toLowerCase(),
      });
      if (exist) {
        return response.error(res, "Bunday ismli hamkor mavjud");
      }
      const newPartner = await Partner.create(req.body);
      return response.created(res, "Hamkor qo'shildi", newPartner);
    } catch (err) {
      return response.serverError(res, err.message, err);
    }
  }

  // async getPartners(req, res) {
  //   try {
  //     let { startDate, endDate } = req.query;

  //     // 🗓️ Sana oralig'ini tayyorlash
  //     let dateFilter = {};
  //     if (startDate && endDate) {
  //       dateFilter = {
  //         createdAt: {
  //           $gte: new Date(startDate),
  //           $lte: new Date(new Date(endDate).setHours(23, 59, 59, 999)), // kuni tugashigacha
  //         },
  //       };
  //     }

  //     const results = await Partner.aggregate([
  //       // 1️⃣ Faqat o'chirilmagan hamkorlar
  //       { $match: { deleted: false } },

  //       // 2️⃣ Hamkorga tegishli orderlarni biriktirish (sana bilan)
  //       {
  //         $lookup: {
  //           from: "orders",
  //           localField: "_id",
  //           foreignField: "partner",
  //           pipeline: [
  //             {
  //               $match: {
  //                 deleted: false,
  //                 ...dateFilter, // ← shu yerda sana oraliqlari qo'llanadi
  //               },
  //             },
  //           ],
  //           as: "orders",
  //         },
  //       },

  //       // 3️⃣ Order IDlarni ajratib olish
  //       {
  //         $addFields: {
  //           orderIds: "$orders._id",
  //         },
  //       },

  //       // 4️⃣ Expenslarni biriktirish (shu orderlarga bog‘lab)
  //       {
  //         $lookup: {
  //           from: "expenses",
  //           let: { orderIds: "$orderIds" },
  //           pipeline: [
  //             {
  //               $match: {
  //                 $expr: { $in: ["$order_id", "$$orderIds"] },
  //                 from: "client",
  //                 deleted: false,
  //               },
  //             },
  //             {
  //               $group: {
  //                 _id: null,
  //                 totalPaid: { $sum: "$amount" },
  //               },
  //             },
  //           ],
  //           as: "payments",
  //         },
  //       },

  //       // 5️⃣ Hisob-kitoblarni bajarish
  //       {
  //         $project: {
  //           fullname: 1,
  //           phone: 1,
  //           address: 1,
  //           createdAt: 1,
  //           updatedAt: 1,

  //           // 🧮 Jami orderlar soni
  //           totalOrderLength: { $size: "$orders" },

  //           // 💰 Jami narx va to‘lovlar
  //           totalPrice: { $sum: "$orders.totalPrice" },
  //           paidAmount: {
  //             $ifNull: [{ $arrayElemAt: ["$payments.totalPaid", 0] }, 0],
  //           },
  //           debt: {
  //             $subtract: [
  //               { $sum: "$orders.totalPrice" },
  //               { $ifNull: [{ $arrayElemAt: ["$payments.totalPaid", 0] }, 0] },
  //             ],
  //           },
  //         },
  //       },
  //     ]).sort({ createdAt: -1 });

  //     if (!results.length) {
  //       return response.notFound(res, "Hamkorlar topilmadi");
  //     }

  //     return response.success(res, "Hamkorlar va qarzlar ro'yxati", results);
  //   } catch (err) {
  //     return response.serverError(res, err.message, err);
  //   }
  // }

  // async getPartners(req, res) {
  //   try {
  //     let { startDate, endDate } = req.query;

  //     // 🗓️ Sana oralig'ini tayyorlash
  //     let dateFilter = {};
  //     if (startDate && endDate) {
  //       dateFilter = {
  //         createdAt: {
  //           $gte: new Date(startDate),
  //           $lte: new Date(new Date(endDate).setHours(23, 59, 59, 999)), // kuni tugashigacha
  //         },
  //       };
  //     }

  //     const results = await Partner.aggregate([
  //       // 1️⃣ Faqat o'chirilmagan hamkorlar
  //       { $match: { deleted: false } },

  //       // 2️⃣ Hamkorga tegishli orderlarni biriktirish (sana + currency bilan)
  //       {
  //         $lookup: {
  //           from: "orders",
  //           localField: "_id",
  //           foreignField: "partner",
  //           as: "orders",
  //           pipeline: [
  //             {
  //               $match: {
  //                 deleted: false,
  //                 ...dateFilter, // ← shu yerda sana oraliqlari qo'llanadi
  //               },
  //             },
  //             // order valyutasini olish
  //             {
  //               $lookup: {
  //                 from: "currencies",
  //                 localField: "currency_id",
  //                 foreignField: "_id",
  //                 as: "currency",
  //               },
  //             },
  //             {
  //               $unwind: {
  //                 path: "$currency",
  //                 preserveNullAndEmptyArrays: true,
  //               },
  //             },
  //             // totalPrice ni bazaviy valyutaga o'tkazish
  //             {
  //               $addFields: {
  //                 totalPriceBase: {
  //                   $multiply: [
  //                     "$totalPrice",
  //                     { $ifNull: ["$currency.rate", 1] },
  //                   ],
  //                 },
  //               },
  //             },
  //             {
  //               $project: {
  //                 totalPrice: 1,
  //                 totalPriceBase: 1,
  //                 createdAt: 1,
  //               },
  //             },
  //           ],
  //         },
  //       },

  //       // 3️⃣ Order IDlarni ajratib olish
  //       {
  //         $addFields: {
  //           orderIds: "$orders._id",
  //         },
  //       },

  //       // 4️⃣ Expenslarni biriktirish (shu orderlarga bog‘lab, currency bilan)
  //       {
  //         $lookup: {
  //           from: "expenses",
  //           let: { orderIds: "$orderIds" },
  //           as: "payments",
  //           pipeline: [
  //             {
  //               $match: {
  //                 $expr: { $in: ["$order_id", "$$orderIds"] },
  //                 from: "client",
  //                 deleted: false,
  //               },
  //             },
  //             // expense valyutasini olish
  //             {
  //               $lookup: {
  //                 from: "currencies",
  //                 localField: "currency_id",
  //                 foreignField: "_id",
  //                 as: "currency",
  //               },
  //             },
  //             {
  //               $unwind: {
  //                 path: "$currency",
  //                 preserveNullAndEmptyArrays: true,
  //               },
  //             },
  //             {
  //               $addFields: {
  //                 amountBase: {
  //                   $multiply: ["$amount", { $ifNull: ["$currency.rate", 1] }],
  //                 },
  //               },
  //             },
  //             // shu partner bo'yicha jami tushgan pul (bazaviy valyutada)
  //             {
  //               $group: {
  //                 _id: null,
  //                 totalPaidBase: { $sum: "$amountBase" },
  //               },
  //             },
  //           ],
  //         },
  //       },

  //       // 5️⃣ Hisob-kitoblarni bajarish
  //       {
  //         $project: {
  //           fullname: 1,
  //           phone: 1,
  //           address: 1,
  //           createdAt: 1,
  //           updatedAt: 1,

  //           // 🧮 Jami orderlar soni
  //           totalOrderLength: { $size: "$orders" },

  //           // 💰 Jami narx va to‘lovlar (bazaviy valyutada)
  //           totalPrice: { $sum: "$orders.totalPriceBase" },
  //           paidAmount: {
  //             $ifNull: [{ $arrayElemAt: ["$payments.totalPaidBase", 0] }, 0],
  //           },
  //           debt: {
  //             $subtract: [
  //               { $sum: "$orders.totalPriceBase" },
  //               {
  //                 $ifNull: [
  //                   { $arrayElemAt: ["$payments.totalPaidBase", 0] },
  //                   0,
  //                 ],
  //               },
  //             ],
  //           },
  //         },
  //       },
  //     ]).sort({ createdAt: -1 });

  //     if (!results.length) {
  //       return response.notFound(res, "Hamkorlar topilmadi");
  //     }

  //     return response.success(res, "Hamkorlar va qarzlar ro'yxati", results);
  //   } catch (err) {
  //     return response.serverError(res, err.message, err);
  //   }
  // }

  async getPartners(req, res) {
    try {
      let { startDate, endDate } = req.query;

      // 🗓️ Sana oralig'ini tayyorlash
      let dateFilter = {};
      if (startDate && endDate) {
        dateFilter = {
          createdAt: {
            $gte: new Date(startDate),
            $lte: new Date(new Date(endDate).setHours(23, 59, 59, 999)), // kuni tugashigacha
          },
        };
      }

      const results = await Partner.aggregate([
        // 1️⃣ Faqat o'chirilmagan hamkorlar
        { $match: { deleted: false } },

        // 2️⃣ Hamkorga tegishli orderlarni biriktirish (sana + currency bilan)
        {
          $lookup: {
            from: "orders",
            localField: "_id",
            foreignField: "partner",
            as: "orders",
            pipeline: [
              {
                $match: {
                  deleted: false,
                  ...dateFilter, // ← shu yerda sana oraliqlari qo'llanadi
                },
              },
              // order valyutasini olish
              {
                $lookup: {
                  from: "currencies",
                  localField: "currency_id",
                  foreignField: "_id",
                  as: "currency",
                },
              },
              {
                $unwind: {
                  path: "$currency",
                  preserveNullAndEmptyArrays: true,
                },
              },
              // totalPrice ni bazaviy valyutaga (USD) o'tkazish va yaxlitlash
              // QOIDA: totalPriceBase = totalPrice / rate
              {
                $addFields: {
                  totalPriceBase: {
                    $round: [
                      {
                        $divide: [
                          "$totalPrice",
                          { $ifNull: ["$currency.rate", 1] },
                        ],
                      },
                      2, // 2 xonali kasrga yaxlitlash
                    ],
                  },
                },
              },
              {
                $project: {
                  totalPrice: 1,
                  totalPriceBase: 1,
                  createdAt: 1,
                },
              },
            ],
          },
        },

        // 3️⃣ Order IDlarni ajratib olish
        {
          $addFields: {
            orderIds: "$orders._id",
          },
        },

        // 4️⃣ Expenslarni biriktirish (shu orderlarga bog‘lab, currency bilan)
        {
          $lookup: {
            from: "expenses",
            let: { orderIds: "$orderIds" },
            as: "payments",
            pipeline: [
              {
                $match: {
                  $expr: { $in: ["$order_id", "$$orderIds"] },
                  from: "client",
                  deleted: false,
                },
              },
              // expense valyutasini olish
              {
                $lookup: {
                  from: "currencies",
                  localField: "currency_id",
                  foreignField: "_id",
                  as: "currency",
                },
              },
              {
                $unwind: {
                  path: "$currency",
                  preserveNullAndEmptyArrays: true,
                },
              },
              // amountBase (USD) = amount / rate va yaxlitlash
              {
                $addFields: {
                  amountBase: {
                    $round: [
                      {
                        $divide: [
                          "$amount",
                          { $ifNull: ["$currency.rate", 1] },
                        ],
                      },
                      2,
                    ],
                  },
                },
              },
              // shu partner bo'yicha jami tushgan pul (bazaviy valyutada)
              {
                $group: {
                  _id: null,
                  totalPaidBase: { $sum: "$amountBase" },
                },
              },
            ],
          },
        },

        // 5️⃣ Hisob-kitoblarni bajarish
        {
          $project: {
            fullname: 1,
            phone: 1,
            address: 1,
            createdAt: 1,
            updatedAt: 1,

            // 🧮 Jami orderlar soni
            totalOrderLength: { $size: "$orders" },

            // 💰 Jami narx (bazaviy valyutada, 2 xonali)
            totalPrice: {
              $round: [{ $sum: "$orders.totalPriceBase" }, 2],
            },

            // 💰 Jami to‘langan summa (bazaviy valyutada, 2 xonali)
            paidAmount: {
              $round: [
                {
                  $ifNull: [
                    { $arrayElemAt: ["$payments.totalPaidBase", 0] },
                    0,
                  ],
                },
                2,
              ],
            },

            // 💰 Jami qarz (bazaviy valyutada, 2 xonali)
            debt: {
              $round: [
                {
                  $subtract: [
                    { $sum: "$orders.totalPriceBase" },
                    {
                      $ifNull: [
                        { $arrayElemAt: ["$payments.totalPaidBase", 0] },
                        0,
                      ],
                    },
                  ],
                },
                2,
              ],
            },
          },
        },

        // 6️⃣ Sort
        { $sort: { createdAt: -1 } },
      ]);

      if (!results.length) {
        return response.notFound(res, "Hamkorlar topilmadi");
      }

      return response.success(res, "Hamkorlar va qarzlar ro'yxati", results);
    } catch (err) {
      return response.serverError(res, err.message, err);
    }
  }

  // async getPartnerById(req, res) {
  //   try {
  //     const { id } = req.params;

  //     const result = await Partner.aggregate([
  //       // 1️⃣ ID bo'yicha hamkorni topish
  //       {
  //         $match: {
  //           _id: new mongoose.Types.ObjectId(id),
  //           deleted: false,
  //         },
  //       },

  //       // 2️⃣ Hamkorga tegishli orderlarni biriktirish (valyuta bilan)
  //       {
  //         $lookup: {
  //           from: "orders",
  //           localField: "_id",
  //           foreignField: "partner",
  //           as: "orders",
  //           pipeline: [
  //             { $match: { deleted: false } },

  //             // Har bir order uchun currency ulash
  //             {
  //               $lookup: {
  //                 from: "currencies",
  //                 localField: "currency_id",
  //                 foreignField: "_id",
  //                 as: "currency",
  //               },
  //             },
  //             {
  //               $unwind: {
  //                 path: "$currency",
  //                 preserveNullAndEmptyArrays: true,
  //               },
  //             },

  //             // totalPrice ni bazaviy valyutaga (USD) o'tkazish va yaxlitlash
  //             // QOIDA: totalPriceBase = totalPrice / rate
  //             {
  //               $addFields: {
  //                 totalPriceBase: {
  //                   $round: [
  //                     {
  //                       $divide: [
  //                         "$totalPrice",
  //                         { $ifNull: ["$currency.rate", 1] },
  //                       ],
  //                     },
  //                     2, // 2 xonali kasrga yaxlitlash
  //                   ],
  //                 },
  //                 currencyRate: { $ifNull: ["$currency.rate", 1] },
  //                 currencyName: "$currency.name",
  //               },
  //             },

  //             {
  //               $project: {
  //                 currency: 0,
  //               },
  //             },
  //           ],
  //         },
  //       },

  //       // 3️⃣ Har bir order uchun to'lovlarni (client expenses) valyuta bilan hisoblash
  //       {
  //         $lookup: {
  //           from: "expenses",
  //           let: { orderIds: "$orders._id" },
  //           as: "orderPayments",
  //           pipeline: [
  //             {
  //               $match: {
  //                 $expr: { $in: ["$order_id", "$$orderIds"] },
  //                 from: "client",
  //                 deleted: false,
  //               },
  //             },

  //             // Har bir expense uchun currency ulash
  //             {
  //               $lookup: {
  //                 from: "currencies",
  //                 localField: "currency_id",
  //                 foreignField: "_id",
  //                 as: "currency",
  //               },
  //             },
  //             {
  //               $unwind: {
  //                 path: "$currency",
  //                 preserveNullAndEmptyArrays: true,
  //               },
  //             },

  //             // amountBase (USD) = amount / rate va yaxlitlash
  //             {
  //               $addFields: {
  //                 amountBase: {
  //                   $round: [
  //                     {
  //                       $divide: [
  //                         "$amount",
  //                         { $ifNull: ["$currency.rate", 1] },
  //                       ],
  //                     },
  //                     2,
  //                   ],
  //                 },
  //               },
  //             },

  //             // Har bir order bo'yicha jami to'lov (bazaviy valyutada)
  //             {
  //               $group: {
  //                 _id: "$order_id", // shu yerda _id = order_id
  //                 paidForOrderBase: { $sum: "$amountBase" },
  //               },
  //             },
  //           ],
  //         },
  //       },

  //       // 4️⃣ Orderlarni to'lovlar bilan birlashtirish
  //       {
  //         $addFields: {
  //           orders: {
  //             $map: {
  //               input: "$orders",
  //               as: "order",
  //               in: {
  //                 $let: {
  //                   vars: {
  //                     payment: {
  //                       $arrayElemAt: [
  //                         {
  //                           $filter: {
  //                             input: "$orderPayments",
  //                             as: "p",
  //                             cond: { $eq: ["$$p._id", "$$order._id"] },
  //                             // $$p._id => groupdagi _id (order_id)
  //                             // $$order._id => orderning _id si
  //                           },
  //                         },
  //                         0,
  //                       ],
  //                     },
  //                   },
  //                   in: {
  //                     $mergeObjects: [
  //                       "$$order",
  //                       {
  //                         // Shu order bo'yicha to'langan summa (bazaviy valyutada, yaxlit)
  //                         paidAmountBase: {
  //                           $round: [
  //                             { $ifNull: ["$$payment.paidForOrderBase", 0] },
  //                             2,
  //                           ],
  //                         },
  //                         // Qolgan qarz (bazaviy valyutada, yaxlit)
  //                         remainingPriceBase: {
  //                           $round: [
  //                             {
  //                               $subtract: [
  //                                 "$$order.totalPriceBase",
  //                                 {
  //                                   $ifNull: ["$$payment.paidForOrderBase", 0],
  //                                 },
  //                               ],
  //                             },
  //                             2,
  //                           ],
  //                         },
  //                       },
  //                     ],
  //                   },
  //                 },
  //               },
  //             },
  //           },
  //         },
  //       },

  //       // 5️⃣ Umumiy hisob-kitoblar (hammasi bazaviy valyutada, yaxlitlangan)
  //       {
  //         $project: {
  //           fullname: 1,
  //           phone: 1,
  //           address: 1,
  //           orders: 1,

  //           // Jami order summasi (bazaviy valyutada, 2 xonali)
  //           totalPrice: {
  //             $round: [{ $sum: "$orders.totalPriceBase" }, 2],
  //           },

  //           // Jami to'langan summa (bazaviy valyutada, 2 xonali)
  //           paidAmount: {
  //             $round: [{ $sum: "$orders.paidAmountBase" }, 2],
  //           },

  //           // Jami qarz (bazaviy valyutada, 2 xonali)
  //           debt: {
  //             $round: [{ $sum: "$orders.remainingPriceBase" }, 2],
  //           },
  //         },
  //       },
  //     ]);

  //     if (!result.length) {
  //       return response.notFound(res, "Hamkor topilmadi");
  //     }

  //     return response.success(res, "Hamkor ma'lumotlari", result[0]);
  //   } catch (err) {
  //     return response.serverError(res, err.message, err);
  //   }
  // }

  async getPartnerById(req, res) {
    try {
      const { id } = req.params;

      const result = await Partner.aggregate([
        // 1️⃣ ID bo'yicha hamkorni topish
        {
          $match: {
            _id: new mongoose.Types.ObjectId(id),
            deleted: false,
          },
        },

        // 2️⃣ Hamkorga tegishli orderlarni biriktirish (valyuta bilan)
        {
          $lookup: {
            from: "orders",
            localField: "_id",
            foreignField: "partner",
            as: "orders",
            pipeline: [
              { $match: { deleted: false } },

              // 🔥 ENG MUHIMI: orderlarni createdAt bo'yicha yangi → eski tartiblash
              { $sort: { createdAt: -1 } },

              // Har bir order uchun currency ulash
              {
                $lookup: {
                  from: "currencies",
                  localField: "currency_id",
                  foreignField: "_id",
                  as: "currency",
                },
              },
              {
                $unwind: {
                  path: "$currency",
                  preserveNullAndEmptyArrays: true,
                },
              },

              // totalPrice ni bazaviy valyutaga (USD) o'tkazish va yaxlitlash
              {
                $addFields: {
                  totalPriceBase: {
                    $round: [
                      {
                        $divide: [
                          "$totalPrice",
                          { $ifNull: ["$currency.rate", 1] },
                        ],
                      },
                      2, // 2 xonali kasrga yaxlitlash
                    ],
                  },
                  currencyRate: { $ifNull: ["$currency.rate", 1] },
                  currencyName: "$currency.name",
                },
              },

              {
                $project: {
                  currency: 0,
                },
              },
            ],
          },
        },

        // 3️⃣ Har bir order uchun to'lovlarni (client expenses) valyuta bilan hisoblash
        {
          $lookup: {
            from: "expenses",
            let: { orderIds: "$orders._id" },
            as: "orderPayments",
            pipeline: [
              {
                $match: {
                  $expr: { $in: ["$order_id", "$$orderIds"] },
                  from: "client",
                  deleted: false,
                },
              },

              // Har bir expense uchun currency ulash
              {
                $lookup: {
                  from: "currencies",
                  localField: "currency_id",
                  foreignField: "_id",
                  as: "currency",
                },
              },
              {
                $unwind: {
                  path: "$currency",
                  preserveNullAndEmptyArrays: true,
                },
              },

              // amountBase (USD) = amount / rate va yaxlitlash
              {
                $addFields: {
                  amountBase: {
                    $round: [
                      {
                        $divide: [
                          "$amount",
                          { $ifNull: ["$currency.rate", 1] },
                        ],
                      },
                      2,
                    ],
                  },
                },
              },

              // Har bir order bo'yicha jami to'lov (bazaviy valyutada)
              {
                $group: {
                  _id: "$order_id", // shu yerda _id = order_id
                  paidForOrderBase: { $sum: "$amountBase" },
                },
              },
            ],
          },
        },

        // 4️⃣ Orderlarni to'lovlar bilan birlashtirish
        {
          $addFields: {
            orders: {
              $map: {
                input: "$orders",
                as: "order",
                in: {
                  $let: {
                    vars: {
                      payment: {
                        $arrayElemAt: [
                          {
                            $filter: {
                              input: "$orderPayments",
                              as: "p",
                              cond: { $eq: ["$$p._id", "$$order._id"] },
                            },
                          },
                          0,
                        ],
                      },
                    },
                    in: {
                      $mergeObjects: [
                        "$$order",
                        {
                          // Shu order bo'yicha to'langan summa (bazaviy valyutada, yaxlit)
                          paidAmountBase: {
                            $round: [
                              { $ifNull: ["$$payment.paidForOrderBase", 0] },
                              2,
                            ],
                          },
                          // Qolgan qarz (bazaviy valyutada, yaxlit)
                          remainingPriceBase: {
                            $round: [
                              {
                                $subtract: [
                                  "$$order.totalPriceBase",
                                  {
                                    $ifNull: ["$$payment.paidForOrderBase", 0],
                                  },
                                ],
                              },
                              2,
                            ],
                          },
                        },
                      ],
                    },
                  },
                },
              },
            },
          },
        },

        // 5️⃣ Umumiy hisob-kitoblar (hammasi bazaviy valyutada, yaxlitlangan)
        {
          $project: {
            fullname: 1,
            phone: 1,
            address: 1,
            orders: 1,

            // Jami order summasi (bazaviy valyutada, 2 xonali)
            totalPrice: {
              $round: [{ $sum: "$orders.totalPriceBase" }, 2],
            },

            // Jami to'langan summa (bazaviy valyutada, 2 xonali)
            paidAmount: {
              $round: [{ $sum: "$orders.paidAmountBase" }, 2],
            },

            // Jami qarz (bazaviy valyutada, 2 xonali)
            debt: {
              $round: [{ $sum: "$orders.remainingPriceBase" }, 2],
            },
          },
        },
      ]);

      if (!result.length) {
        return response.notFound(res, "Hamkor topilmadi");
      }

      return response.success(res, "Hamkor ma'lumotlari", result[0]);
    } catch (err) {
      return response.serverError(res, err.message, err);
    }
  }

  async deletePartner(req, res) {
    try {
      const { id } = req.params;
      const partner = await Partner.findByIdAndUpdate(
        id,
        { deleted: true },
        { new: true }
      );
      if (!partner) {
        return response.notFound(res, "Hamkor topilmadi");
      }
      return response.success(res, "Hamkor o'chirildi", partner);
    } catch (err) {
      return response.serverError(res, err.message, err);
    }
  }

  async updatePartner(req, res) {
    try {
      const { id } = req.params;
      const { fullname, phone, address } = req.body;
      if (!fullname || !address) {
        return response.error(res, "Ism va manzil kiritish shart");
      }
      if (!phone?.length) {
        return response.error(res, "Kamida telefon raqam kiritish shart");
      }
      const partner = await Partner.findByIdAndUpdate(
        id,
        { fullname, phone, address },
        { new: true }
      );
      if (!partner) {
        return response.notFound(res, "Hamkor topilmadi");
      }
      return response.success(res, "Hamkor ma'lumotlari yangilandi", partner);
    } catch (err) {
      return response.serverError(res, err.message, err);
    }
  }

  // async getClientInfo(req, res) {
  //   try {
  //     let { startDate, endDate } = req.query;
  //     let filter = { deleted: false };
  //     if (startDate && endDate) {
  //       filter.createdAt = {
  //         $gte: new Date(new Date(startDate).setHours(0, 0, 0)),
  //         $lte: new Date(new Date(endDate).setHours(23, 59, 59)),
  //       };
  //     }

  //     let allClients = await Client.find(filter)
  //       .populate("partner", "fullname")
  //       .populate("order_id", "totalPrice");
  //     if (!allClients.length) {
  //       return response.notFound(res, "Klientlar topilmadi");
  //     }
  //     return response.success(res, "Klientlar ma'lumotlari", allClients);

  //   } catch (err) {
  //     return response.serverError(res, err.message, err);
  //   }
  // }
}

module.exports = new PartnerController();
