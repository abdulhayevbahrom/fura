// const response = require("../utils/response");
// const Cars = require("../model/carModel");
// const Drivers = require("../model/driversModel");

// class StatisticController {
//   async getStatistic(req, res) {
//     try {
//       let { startDate, endDate } = req.query;

//       // 🗓️ Sana filtri — expenses.createdAt uchun ishlatamiz
//       let dateMatch = {};
//       if (startDate && endDate) {
//         const start = new Date(startDate);
//         const end = new Date(endDate);
//         end.setHours(23, 59, 59, 999);

//         dateMatch.createdAt = {
//           $gte: start,
//           $lte: end,
//         };
//       }

//       const cars = await Cars.aggregate([
//         {
//           $match: { deleted: false },
//         },

//         // Har bir mashinaga bog'langan REPAIR xarajatlarni ulash
//         {
//           $lookup: {
//             from: "expenses",
//             localField: "_id",
//             foreignField: "car",
//             as: "repairs",
//             pipeline: [
//               {
//                 $match: {
//                   deleted: false,
//                   type: "repair",
//                   ...dateMatch, // faqat kerakli sana oralig'i
//                 },
//               },
//               // Valyuta ulash
//               {
//                 $lookup: {
//                   from: "currencies",
//                   localField: "currency_id",
//                   foreignField: "_id",
//                   as: "currency",
//                 },
//               },
//               {
//                 $unwind: {
//                   path: "$currency",
//                   preserveNullAndEmptyArrays: true,
//                 },
//               },
//               // amountBase = amount / rate (USD) va 2 xonali kasrgacha
//               {
//                 $addFields: {
//                   amountBase: {
//                     $round: [
//                       {
//                         $divide: [
//                           "$amount",
//                           { $ifNull: ["$currency.rate", 1] },
//                         ],
//                       },
//                       2,
//                     ],
//                   },
//                 },
//               },
//               // Aynan shu mashina bo'yicha jami repair xarajatlarni yig'amiz
//               {
//                 $group: {
//                   _id: null,
//                   totalRepairBase: { $sum: "$amountBase" },
//                 },
//               },
//             ],
//           },
//         },

//         // repairs ichidagi totalRepairBase ni bitta fieldga olib chiqamiz
//         {
//           $addFields: {
//             totalRepairBase: {
//               $round: [
//                 {
//                   $ifNull: [
//                     { $arrayElemAt: ["$repairs.totalRepairBase", 0] },
//                     0,
//                   ],
//                 },
//                 2,
//               ],
//             },
//           },
//         },

//         // Keraksiz repairs massivini olib tashlaymiz
//         {
//           $project: {
//             repairs: 0,
//             __v: 0,
//             createdAt: 0,
//             updatedAt: 0,
//             deleted: 0,
//             vehicles: 0,
//             cpu: 0,
//           },
//         },

//         // Eng ko'p rasxodli mashina RO'YXAT BOSHIDA, eng kam RO'YXAT OXIRIDA
//         {
//           $sort: {
//             totalRepairBase: -1, // DESC
//           },
//         },
//       ]);

//       if (!cars.length) {
//         return response.notFound(res, "Mashinalar topilmadi", []);
//       }

//       return response.success(
//         res,
//         "Mashinalar rasxodi bo'yicha ro'yxati",
//         cars
//       );
//     } catch (err) {
//       return response.serverError(res, err.message, err);
//     }
//   }

//   async getStatisticPrice(req, res) {
//     try {
//       let { startDate, endDate } = req.query;

//       // 🗓️ Orderlar uchun sana filtri
//       let orderDateMatch = { deleted: false }; // faqat o'chirilmagan orderlar

//       if (startDate && endDate) {
//         const start = new Date(startDate);
//         const end = new Date(endDate);
//         end.setHours(23, 59, 59, 999);

//         orderDateMatch.createdAt = {
//           $gte: start,
//           $lte: end,
//         };
//       }

//       const cars = await Cars.aggregate([
//         {
//           $match: { deleted: false },
//         },

//         // 🔹 Har bir mashinaga bog'langan ORDER larni ulaymiz
//         {
//           $lookup: {
//             from: "orders",
//             localField: "_id",
//             foreignField: "car",
//             as: "orders",
//             pipeline: [
//               {
//                 $match: orderDateMatch, // { deleted: false, createdAt: {...} }
//               },
//               // Order valyutasini ulash
//               {
//                 $lookup: {
//                   from: "currencies",
//                   localField: "currency_id",
//                   foreignField: "_id",
//                   as: "currency",
//                 },
//               },
//               {
//                 $unwind: {
//                   path: "$currency",
//                   preserveNullAndEmptyArrays: true,
//                 },
//               },
//               // totalPrice ni bazaviy valyutaga (USD) o'tkazish
//               // QOIDA: totalPriceBase = totalPrice / rate
//               {
//                 $addFields: {
//                   totalPriceBase: {
//                     $round: [
//                       {
//                         $divide: [
//                           "$totalPrice",
//                           { $ifNull: ["$currency.rate", 1] },
//                         ],
//                       },
//                       2, // 2 xonali kasrga yaxlitlash
//                     ],
//                   },
//                 },
//               },
//               // Shu mashina uchun jami daromad va orderlar sonini hisoblaymiz
//               {
//                 $group: {
//                   _id: "$car", // car bo'yicha guruhlash
//                   totalRevenueBase: { $sum: "$totalPriceBase" },
//                   orderCount: { $sum: 1 },
//                 },
//               },
//             ],
//           },
//         },

//         // 🔹 orders massivini soddalashtiramiz: totalRevenueBase va orderCount ni ajratib olamiz
//         {
//           $addFields: {
//             totalRevenueBase: {
//               $round: [
//                 {
//                   $ifNull: [
//                     { $arrayElemAt: ["$orders.totalRevenueBase", 0] },
//                     0,
//                   ],
//                 },
//                 2,
//               ],
//             },
//             orderCount: {
//               $ifNull: [{ $arrayElemAt: ["$orders.orderCount", 0] }, 0],
//             },
//           },
//         },

//         // Keraksiz "orders" massivini olib tashlaymiz
//         {
//           $project: {
//             orders: 0,
//             __v: 0,
//             createdAt: 0,
//             updatedAt: 0,
//             deleted: 0,
//             vehicles: 0,
//             cpu: 0,
//           },
//         },

//         // 🔹 Eng ko'p pul topgan mashina RO'YXAT BOSHIDA
//         {
//           $sort: {
//             totalRevenueBase: -1, // DESC
//           },
//         },
//       ]);

//       if (!cars.length) {
//         return response.notFound(res, "Mashinalar topilmadi", []);
//       }

//       return response.success(
//         res,
//         "Mashinalar bo'yicha daromad statistika",
//         cars
//       );
//     } catch (err) {
//       return response.serverError(res, err.message, err);
//     }
//   }

//   async getDriversByOrders(req, res) {
//     try {
//       let { startDate, endDate } = req.query;

//       // 🗓️ Orderlar uchun sana filtri
//       // Faqat yakunlangan va o'chirilmagan orderlar
//       let orderMatch = {
//         deleted: false,
//         state: "finished", // faqat yakunlangan zakazlar
//       };

//       if (startDate && endDate) {
//         const start = new Date(startDate);
//         const end = new Date(endDate);
//         end.setHours(23, 59, 59, 999);

//         orderMatch.createdAt = {
//           $gte: start,
//           $lte: end,
//         };
//       }

//       const drivers = await Drivers.aggregate([
//         // 1️⃣ Faqat haydovchilar va aktivlar
//         {
//           $match: {
//             role: "driver",
//             is_deleted: false,
//           },
//         },

//         // 2️⃣ Har bir haydovchiga bog'langan ORDER larni ulaymiz
//         {
//           $lookup: {
//             from: "orders",
//             localField: "_id",
//             foreignField: "driver",
//             as: "orders",
//             pipeline: [
//               {
//                 $match: orderMatch, // { deleted:false, state:'finished', createdAt: {...} }
//               },
//               {
//                 $project: {
//                   _id: 1,
//                 },
//               },
//             ],
//           },
//         },

//         // 3️⃣ orders massivining uzunligini hisoblaymiz (zakazlar soni)
//         {
//           $addFields: {
//             orderCount: { $size: "$orders" },
//           },
//         },

//         // 4️⃣ Keraksiz orders massivini olib tashlaymiz
//         {
//           $project: {
//             orders: 0,
//             password: 0,
//             permissions: 0,
//             __v: 0,
//             createdAt: 0,
//             updatedAt: 0,
//             is_deleted: 0,
//             balance: 0,
//             status: 0,
//             login: 0,
//             is_active: 0,
//             role: 0,
//             salary: 0,
//             address: 0,
//           },
//         },

//         // 5️⃣ Eng ko'p zakaz qilgan haydovchilar yuqorida
//         {
//           $sort: {
//             orderCount: -1, // ko'p zakazli birinchi
//             firstName: 1, // teng bo'lsa ism bo'yicha
//           },
//         },
//       ]);

//       if (!drivers.length) {
//         return response.notFound(res, "Haydovchilar topilmadi", []);
//       }

//       return response.success(
//         res,
//         "Haydovchilar zakazlar soni bo'yicha tartiblandi",
//         drivers
//       );
//     } catch (err) {
//       return response.serverError(res, err.message, err);
//     }
//   }
// }

// module.exports = new StatisticController();

const response = require("../utils/response");
const Cars = require("../model/carModel");
const Drivers = require("../model/driversModel");

class StatisticController {
  /**
   * Mashinalar bo‘yicha STATISTIKA:
   *  - repairCars:  rasxod bo‘yicha (oldingi getStatistic)
   *  - revenueCars: daromad bo‘yicha (oldingi getStatisticPrice)
   *
   * Query:
   *   startDate, endDate (ixtiyoriy, YYYY-MM-DD)
   */
  async getStatistic(req, res) {
    try {
      let { startDate, endDate } = req.query;

      // 🗓️ Sana filtri (createdAt bo‘yicha)
      let dateMatch = {};
      if (startDate && endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);

        dateMatch.createdAt = {
          $gte: start,
          $lte: end,
        };
      }

      // 1️⃣ MASHINALAR BO‘YICHA REPAIR RASXODLAR (oldingi getStatistic)
      const repairCars = await Cars.aggregate([
        {
          $match: { deleted: false },
        },
        {
          $lookup: {
            from: "expenses",
            localField: "_id",
            foreignField: "car",
            as: "repairs",
            pipeline: [
              {
                $match: {
                  deleted: false,
                  type: "repair",
                  ...dateMatch,
                },
              },
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
              {
                $group: {
                  _id: null,
                  totalRepairBase: { $sum: "$amountBase" },
                },
              },
            ],
          },
        },
        {
          $addFields: {
            totalRepairBase: {
              $round: [
                {
                  $ifNull: [
                    { $arrayElemAt: ["$repairs.totalRepairBase", 0] },
                    0,
                  ],
                },
                2,
              ],
            },
          },
        },
        {
          $project: {
            repairs: 0,
            __v: 0,
            createdAt: 0,
            updatedAt: 0,
            deleted: 0,
            vehicles: 0,
            cpu: 0,
          },
        },
        {
          $sort: {
            totalRepairBase: -1,
          },
        },
      ]);

      // 2️⃣ MASHINALAR BO‘YICHA DAROMAD (oldingi getStatisticPrice)
      let orderDateMatch = { deleted: false };
      if (startDate && endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);

        orderDateMatch.createdAt = {
          $gte: start,
          $lte: end,
        };
      }

      const revenueCars = await Cars.aggregate([
        {
          $match: { deleted: false },
        },
        {
          $lookup: {
            from: "orders",
            localField: "_id",
            foreignField: "car",
            as: "orders",
            pipeline: [
              {
                $match: orderDateMatch, // { deleted:false, createdAt: {...} }
              },
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
                      2,
                    ],
                  },
                },
              },
              {
                $group: {
                  _id: "$car",
                  totalRevenueBase: { $sum: "$totalPriceBase" },
                  orderCount: { $sum: 1 },
                },
              },
            ],
          },
        },
        {
          $addFields: {
            totalRevenueBase: {
              $round: [
                {
                  $ifNull: [
                    { $arrayElemAt: ["$orders.totalRevenueBase", 0] },
                    0,
                  ],
                },
                2,
              ],
            },
            orderCount: {
              $ifNull: [{ $arrayElemAt: ["$orders.orderCount", 0] }, 0],
            },
          },
        },
        {
          $project: {
            orders: 0,
            __v: 0,
            createdAt: 0,
            updatedAt: 0,
            deleted: 0,
            vehicles: 0,
            cpu: 0,
          },
        },
        {
          $sort: {
            totalRevenueBase: -1,
          },
        },
      ]);

      // Ikkala ro‘yxat ham bo‘sh bo‘lsa
      if (!repairCars.length && !revenueCars.length) {
        return response.notFound(res, "Mashinalar topilmadi", []);
      }

      // Ma'lumot tuzilishi:
      //  - repairCars: oldingi getStatistic natijasi formatida
      //  - revenueCars: oldingi getStatisticPrice natijasi formatida
      return response.success(res, "Mashinalar statistikasi", {
        repairCars,
        revenueCars,
      });
    } catch (err) {
      return response.serverError(res, err.message, err);
    }
  }

  /**
   * Haydovchilarni yakunlangan zakazlar soni bo‘yicha tartiblash
   * (Bu funksiya o‘zgarmasdan qoladi)
   */
  async getDriversByOrders(req, res) {
    try {
      let { startDate, endDate } = req.query;

      // 🗓️ Orderlar uchun sana filtri
      let orderMatch = {
        deleted: false,
        state: "finished", // faqat yakunlangan zakazlar
      };

      if (startDate && endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);

        orderMatch.createdAt = {
          $gte: start,
          $lte: end,
        };
      }

      const drivers = await Drivers.aggregate([
        // 1️⃣ Faqat haydovchilar
        {
          $match: {
            role: "driver",
            is_deleted: false,
          },
        },

        // 2️⃣ Har bir haydovchiga bog'langan ORDER larni ulaymiz
        {
          $lookup: {
            from: "orders",
            localField: "_id",
            foreignField: "driver",
            as: "orders",
            pipeline: [
              {
                $match: orderMatch, // { deleted:false, state:'finished', createdAt: {...} }
              },

              // Order valyutasini ulash (totalPrice uchun)
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

              // Shu orderga tegishli order_expense larni ulash
              {
                $lookup: {
                  from: "expenses",
                  localField: "_id",
                  foreignField: "order_id",
                  as: "order_expenses",
                  pipeline: [
                    {
                      $match: {
                        type: "order_expense",
                        deleted: false,
                      },
                    },
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
                    {
                      $addFields: {
                        // USD: amountBase = amount / rate
                        amountBase: {
                          $divide: [
                            "$amount",
                            { $ifNull: ["$currency.rate", 1] },
                          ],
                        },
                      },
                    },
                    {
                      $project: {
                        amountBase: 1,
                      },
                    },
                  ],
                },
              },

              // Order summasini USD ga o‘tkazamiz
              {
                $addFields: {
                  totalPriceBase: {
                    $divide: [
                      "$totalPrice",
                      { $ifNull: ["$currency.rate", 1] },
                    ],
                  },
                },
              },

              {
                $project: {
                  totalPriceBase: 1,
                  order_expenses: 1,
                },
              },
            ],
          },
        },

        // 3️⃣ orderCount, totalOrderPrice, totalExpense, profit ni hisoblash
        {
          $addFields: {
            // nechta finished order
            orderCount: { $size: "$orders" },

            // orderlarning umumiy summasi (USD)
            totalOrderPrice: {
              $round: [
                {
                  $ifNull: [{ $sum: "$orders.totalPriceBase" }, 0],
                },
                2,
              ],
            },

            // type === "order_expense" umumiy summasi (USD)
            totalExpense: {
              $round: [
                {
                  $ifNull: [
                    {
                      $sum: {
                        $map: {
                          input: "$orders.order_expenses", // har bir order uchun expenses massiv
                          as: "expList",
                          in: { $sum: "$$expList.amountBase" },
                        },
                      },
                    },
                    0,
                  ],
                },
                2,
              ],
            },
          },
        },

        // 4️⃣ profit = totalOrderPrice - totalExpense
        {
          $addFields: {
            profit: {
              $round: [
                {
                  $subtract: [
                    { $ifNull: ["$totalOrderPrice", 0] },
                    { $ifNull: ["$totalExpense", 0] },
                  ],
                },
                2,
              ],
            },
          },
        },

        // 5️⃣ Keraksiz fieldlarni tozalash
        {
          $project: {
            orders: 0,
            password: 0,
            permissions: 0,
            __v: 0,
            createdAt: 0,
            updatedAt: 0,
            is_deleted: 0,
            balance: 0,
            status: 0,
            login: 0,
            is_active: 0,
            role: 0,
            salary: 0,
            address: 0,
          },
        },

        // 6️⃣ Eng ko'p zakaz qilgan haydovchilar yuqorida
        {
          $sort: {
            orderCount: -1,
            firstName: 1,
          },
        },
      ]);

      if (!drivers.length) {
        return response.notFound(res, "Haydovchilar topilmadi", []);
      }

      return response.success(
        res,
        "Haydovchilar zakazlar soni va foyda bo'yicha tartiblandi",
        drivers
      );
    } catch (err) {
      return response.serverError(res, err.message, err);
    }
  }

  async getDriversByLeastExpense(req, res) {
    try {
      let { startDate, endDate } = req.query;

      // Sana filtri
      let orderMatch = {
        deleted: false,
        state: "finished",
      };

      if (startDate && endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);

        orderMatch.createdAt = {
          $gte: start,
          $lte: end,
        };
      }

      const drivers = await Drivers.aggregate([
        // 1️⃣ Faqat haydovchilar
        {
          $match: {
            role: "driver",
            is_deleted: false,
          },
        },

        // 2️⃣ Haydovchiga tegishli orderlar
        {
          $lookup: {
            from: "orders",
            localField: "_id",
            foreignField: "driver",
            as: "orders",
            pipeline: [
              { $match: orderMatch },

              // Order expense larini ulaymiz
              {
                $lookup: {
                  from: "expenses",
                  localField: "_id",
                  foreignField: "order_id",
                  as: "expenses",
                  pipeline: [
                    {
                      $match: {
                        type: "order_expense",
                        deleted: false,
                      },
                    },
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
                    {
                      $addFields: {
                        amountBase: {
                          $divide: [
                            "$amount",
                            { $ifNull: ["$currency.rate", 1] },
                          ],
                        },
                      },
                    },
                    {
                      $project: {
                        amountBase: 1,
                      },
                    },
                  ],
                },
              },

              {
                $project: {
                  expenses: 1,
                },
              },
            ],
          },
        },

        // 3️⃣ Faqat totalExpense hisoblaymiz
        {
          $addFields: {
            totalExpense: {
              $round: [
                {
                  $ifNull: [
                    {
                      $sum: {
                        $map: {
                          input: "$orders.expenses",
                          as: "expList",
                          in: { $sum: "$$expList.amountBase" },
                        },
                      },
                    },
                    0,
                  ],
                },
                2,
              ],
            },
          },
        },

        // 4️⃣ Faqat kerakli maydonlarni qaytaramiz
        {
          $project: {
            orders: 0,
            permissions: 0,
            password: 0,
            login: 0,
            status: 0,
            is_active: 0,
            is_deleted: 0,
            role: 0,
            salary: 0,
            balance: 0,
            address: 0,
            createdAt: 0,
            updatedAt: 0,
            __v: 0,
          },
        },

        // 5️⃣ Eng kam xarajat qilgan haydovchi birinchi
        {
          $sort: {
            totalExpense: 1, // ASC
            firstName: 1,
          },
        },
      ]);

      if (!drivers.length) {
        return response.notFound(res, "Haydovchilar topilmadi", []);
      }

      return response.success(
        res,
        "Haydovchilar xarajatlar bo'yicha tartiblandi",
        drivers
      );
    } catch (err) {
      return response.serverError(res, err.message, err);
    }
  }
}

module.exports = new StatisticController();
