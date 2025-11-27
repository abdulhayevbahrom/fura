const response = require("../utils/response");
const Parts = require("../model/partModel");
const Orders = require("../model/orderModel");
const Cars = require("../model/carModel");
const Drivers = require("../model/driversModel");
const Trailers = require("../model/trailerModel");

const Expense = require("../model/expensesModel");

class partController {
  // async getParts(req, res) {
  //   try {
  //     let { status } = req.query;
  //     let filter = {};

  //     if (status !== undefined) {
  //       if (status === "true") filter.status = true;
  //       else if (status === "false") filter.status = false;
  //       else filter.status = status;
  //     }

  //     const parts = await Parts.aggregate([
  //       { $match: filter },

  //       /**
  //        * OWNER — deposit
  //        */
  //       {
  //         $lookup: {
  //           from: "expenses",
  //           localField: "_id",
  //           foreignField: "part_id",
  //           as: "ownerExpenses",
  //           pipeline: [
  //             { $match: { from: "owner", deleted: false } },
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
  //             { $project: { amountBase: 1 } },
  //           ],
  //         },
  //       },
  //       {
  //         $addFields: {
  //           deposit: { $sum: "$ownerExpenses.amountBase" },
  //         },
  //       },

  //       /**
  //        * CLIENT — mijozdan tushgan pul
  //        */
  //       {
  //         $lookup: {
  //           from: "expenses",
  //           localField: "_id",
  //           foreignField: "part_id",
  //           as: "clientExpenses",
  //           pipeline: [
  //             { $match: { from: "client", deleted: false } },
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
  //             { $project: { amountBase: 1 } },
  //           ],
  //         },
  //       },
  //       {
  //         $addFields: {
  //           totalClientPayments: { $sum: "$clientExpenses.amountBase" },
  //         },
  //       },

  //       /**
  //        * PARTIYA XARAJATLARI — faqat from: "expense"
  //        * (HOZIRCHA faqat expense-lar, keyin driver oyligini qo'shamiz)
  //        */
  //       {
  //         $lookup: {
  //           from: "expenses",
  //           localField: "_id",
  //           foreignField: "part_id",
  //           as: "partExpenses",
  //           pipeline: [
  //             { $match: { from: "expense", deleted: false } },
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
  //             { $project: { amountBase: 1 } },
  //           ],
  //         },
  //       },
  //       {
  //         $addFields: {
  //           // faqat expenses bo'yicha xarajat
  //           totalPartExpenses: { $sum: "$partExpenses.amountBase" },
  //         },
  //       },

  //       /**
  //        * ORDERLAR — umumiy order puli + haydovchi oyligi + mashina
  //        */
  //       {
  //         $lookup: {
  //           from: "orders",
  //           localField: "_id",
  //           foreignField: "part_id",
  //           as: "orders",
  //           pipeline: [
  //             { $match: { deleted: false } },

  //             // order narx valyutasi
  //             {
  //               $lookup: {
  //                 from: "currencies",
  //                 localField: "currency_id",
  //                 foreignField: "_id",
  //                 as: "orderCurrency",
  //               },
  //             },
  //             {
  //               $unwind: {
  //                 path: "$orderCurrency",
  //                 preserveNullAndEmptyArrays: true,
  //               },
  //             },

  //             // haydovchi oyligi valyutasi
  //             {
  //               $lookup: {
  //                 from: "currencies",
  //                 localField: "driver_salary_currency_id",
  //                 foreignField: "_id",
  //                 as: "salaryCurrency",
  //               },
  //             },
  //             {
  //               $unwind: {
  //                 path: "$salaryCurrency",
  //                 preserveNullAndEmptyArrays: true,
  //               },
  //             },

  //             // bazaviy valyutaga o'tkazish
  //             {
  //               $addFields: {
  //                 totalPriceBase: {
  //                   $multiply: [
  //                     "$totalPrice",
  //                     { $ifNull: ["$orderCurrency.rate", 1] },
  //                   ],
  //                 },
  //                 driverSalaryBase: {
  //                   $multiply: [
  //                     "$driver_salary",
  //                     { $ifNull: ["$salaryCurrency.rate", 1] },
  //                   ],
  //                 },
  //               },
  //             },

  //             {
  //               $project: {
  //                 totalPriceBase: 1,
  //                 driverSalaryBase: 1,
  //                 car: 1,
  //               },
  //             },
  //           ],
  //         },
  //       },
  //       {
  //         $addFields: {
  //           totalOrderPrices: { $sum: "$orders.totalPriceBase" }, // umumiy order puli
  //           totalDriverSalary: { $sum: "$orders.driverSalaryBase" }, // umumiy haydovchi oyligi
  //           firstCarId: { $first: "$orders.car" },
  //         },
  //       },

  //       /**
  //        * MUHIM O'ZGARISH:
  //        * totalPartExpenses = expenses (from: "expense") + totalDriverSalary
  //        */
  //       {
  //         $addFields: {
  //           totalPartExpenses: {
  //             $add: ["$totalPartExpenses", "$totalDriverSalary"],
  //           },
  //         },
  //       },

  //       /**
  //        * QOLDIQ HISOBLASH
  //        * qoldiq = (deposit + totalClientPayments) - totalPartExpenses
  //        * (bu yerda totalPartExpenses allaqachon driverSalary ham qo'shilgan)
  //        */
  //       {
  //         $addFields: {
  //           qoldiq: {
  //             $subtract: [
  //               { $add: ["$deposit", "$totalClientPayments"] },
  //               "$totalPartExpenses",
  //             ],
  //           },
  //         },
  //       },

  //       /**
  //        * CAR maʼlumotlari
  //        */
  //       {
  //         $lookup: {
  //           from: "cars",
  //           localField: "firstCarId",
  //           foreignField: "_id",
  //           as: "car",
  //           pipeline: [
  //             {
  //               $project: {
  //                 _id: 1,
  //                 title: 1,
  //                 number: 1,
  //                 year: 1,
  //                 probeg: 1,
  //                 status: 1,
  //                 image: {
  //                   $cond: {
  //                     if: { $ifNull: ["$image", false] },
  //                     then: { $concat: ["/cars-image/", "$image"] },
  //                     else: null,
  //                   },
  //                 },
  //               },
  //             },
  //           ],
  //         },
  //       },
  //       {
  //         $addFields: {
  //           car: { $arrayElemAt: ["$car", 0] },
  //         },
  //       },

  //       /**
  //        * DRIVER maʼlumotlari
  //        * Part ichidagi driver_id'ni populate qilamiz
  //        */
  //       {
  //         $lookup: {
  //           from: "drivers",
  //           localField: "driver", // AGAR MAYDON NOMI "driver" BO'LSA, shu yerini "driver" QIL
  //           foreignField: "_id",
  //           as: "driver",
  //           pipeline: [
  //             {
  //               $project: {
  //                 _id: 1,
  //                 firstName: 1,
  //                 lastName: 1,
  //               },
  //             },
  //           ],
  //         },
  //       },
  //       {
  //         $addFields: {
  //           driver: { $arrayElemAt: ["$driver", 0] },
  //         },
  //       },

  //       /**
  //        * Keraksiz maydonlarni olib tashlash
  //        */
  //       {
  //         $project: {
  //           ownerExpenses: 0,
  //           clientExpenses: 0,
  //           partExpenses: 0,
  //           orders: 0,
  //           firstCarId: 0,
  //         },
  //       },

  //       { $sort: { createdAt: -1 } },
  //     ]);

  //     if (!parts.length)
  //       return response.notFound(res, "Partiyalar topilmadi", []);

  //     return response.success(res, "Partiyalar topildi", parts);
  //   } catch (err) {
  //     return response.serverError(res, err.message, err);
  //   }
  // }
  async getParts(req, res) {
    try {
      let { status } = req.query;
      let filter = {};

      if (status !== undefined) {
        if (status === "true") filter.status = true;
        else if (status === "false") filter.status = false;
        else filter.status = status;
      }

      const parts = await Parts.aggregate([
        { $match: filter },

        /**
         * OWNER — deposit
         */
        {
          $lookup: {
            from: "expenses",
            localField: "_id",
            foreignField: "part_id",
            as: "ownerExpenses",
            pipeline: [
              { $match: { from: "owner", deleted: false } },
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
                    $multiply: ["$amount", { $ifNull: ["$currency.rate", 1] }],
                  },
                },
              },
              { $project: { amountBase: 1 } },
            ],
          },
        },
        {
          $addFields: {
            deposit: { $sum: "$ownerExpenses.amountBase" },
          },
        },

        /**
         * CLIENT — mijozdan tushgan pul
         */
        {
          $lookup: {
            from: "expenses",
            localField: "_id",
            foreignField: "part_id",
            as: "clientExpenses",
            pipeline: [
              { $match: { from: "client", deleted: false } },
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
                    $multiply: ["$amount", { $ifNull: ["$currency.rate", 1] }],
                  },
                },
              },
              { $project: { amountBase: 1 } },
            ],
          },
        },
        {
          $addFields: {
            totalClientPayments: { $sum: "$clientExpenses.amountBase" },
          },
        },

        /**
         * PARTIYA XARAJATLARI — faqat from: "expense"
         * (HOZIRCHA faqat expense-lar, keyin driver oyligini qo'shamiz)
         */
        {
          $lookup: {
            from: "expenses",
            localField: "_id",
            foreignField: "part_id",
            as: "partExpenses",
            pipeline: [
              { $match: { from: "expense", deleted: false } },
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
                    $multiply: ["$amount", { $ifNull: ["$currency.rate", 1] }],
                  },
                },
              },
              { $project: { amountBase: 1 } },
            ],
          },
        },
        {
          $addFields: {
            // faqat expenses bo'yicha xarajat
            totalPartExpenses: { $sum: "$partExpenses.amountBase" },
          },
        },

        /**
         * ORDERLAR — umumiy order puli + haydovchi oyligi + mashina + tirkama
         */
        {
          $lookup: {
            from: "orders",
            localField: "_id",
            foreignField: "part_id",
            as: "orders",
            pipeline: [
              { $match: { deleted: false } },

              // order narx valyutasi
              {
                $lookup: {
                  from: "currencies",
                  localField: "currency_id",
                  foreignField: "_id",
                  as: "orderCurrency",
                },
              },
              {
                $unwind: {
                  path: "$orderCurrency",
                  preserveNullAndEmptyArrays: true,
                },
              },

              // haydovchi oyligi valyutasi
              {
                $lookup: {
                  from: "currencies",
                  localField: "driver_salary_currency_id",
                  foreignField: "_id",
                  as: "salaryCurrency",
                },
              },
              {
                $unwind: {
                  path: "$salaryCurrency",
                  preserveNullAndEmptyArrays: true,
                },
              },

              // bazaviy valyutaga o'tkazish
              {
                $addFields: {
                  totalPriceBase: {
                    $multiply: [
                      "$totalPrice",
                      { $ifNull: ["$orderCurrency.rate", 1] },
                    ],
                  },
                  driverSalaryBase: {
                    $multiply: [
                      "$driver_salary",
                      { $ifNull: ["$salaryCurrency.rate", 1] },
                    ],
                  },
                },
              },

              {
                $project: {
                  totalPriceBase: 1,
                  driverSalaryBase: 1,
                  car: 1,
                  trailer: 1, // ORDER ichidagi trailer_id
                },
              },
            ],
          },
        },
        {
          $addFields: {
            totalOrderPrices: { $sum: "$orders.totalPriceBase" }, // umumiy order puli
            totalDriverSalary: { $sum: "$orders.driverSalaryBase" }, // umumiy haydovchi oyligi
            firstCarId: { $first: "$orders.car" },
            firstTrailerId: { $first: "$orders.trailer" }, // birinchi order'dagi trailer
          },
        },

        /**
         * MUHIM O'ZGARISH:
         * totalPartExpenses = expenses (from: "expense") + totalDriverSalary
         */
        {
          $addFields: {
            totalPartExpenses: {
              $add: ["$totalPartExpenses", "$totalDriverSalary"],
            },
          },
        },

        /**
         * QOLDIQ HISOBLASH
         * qoldiq = (deposit + totalClientPayments) - totalPartExpenses
         * (bu yerda totalPartExpenses allaqachon driverSalary ham qo'shilgan)
         */
        {
          $addFields: {
            qoldiq: {
              $subtract: [
                { $add: ["$deposit", "$totalClientPayments"] },
                "$totalPartExpenses",
              ],
            },
          },
        },

        /**
         * CAR maʼlumotlari
         */
        {
          $lookup: {
            from: "cars",
            localField: "firstCarId",
            foreignField: "_id",
            as: "car",
            pipeline: [
              {
                $project: {
                  _id: 1,
                  title: 1,
                  number: 1,
                  year: 1,
                  probeg: 1,
                  status: 1,
                  image: {
                    $cond: {
                      if: { $ifNull: ["$image", false] },
                      then: { $concat: ["/cars-image/", "$image"] },
                      else: null,
                    },
                  },
                },
              },
            ],
          },
        },
        {
          $addFields: {
            car: { $arrayElemAt: ["$car", 0] },
          },
        },

        /**
         * TRAILER maʼlumotlari
         */
        {
          $lookup: {
            from: "trailers",
            localField: "firstTrailerId",
            foreignField: "_id",
            as: "trailer",
            pipeline: [
              {
                $project: {
                  _id: 1,
                  title: 1,
                  number: 1,
                  // kerak bo'lsa qo'shimcha fieldlar qo'shishing mumkin
                },
              },
            ],
          },
        },
        {
          $addFields: {
            trailer: { $arrayElemAt: ["$trailer", 0] },
          },
        },

        /**
         * DRIVER maʼlumotlari
         * Part ichidagi driver_id'ni populate qilamiz
         */
        {
          $lookup: {
            from: "drivers",
            localField: "driver", // Part modelidagi haydovchi field nomi
            foreignField: "_id",
            as: "driver",
            pipeline: [
              {
                $project: {
                  _id: 1,
                  firstName: 1,
                  lastName: 1,
                },
              },
            ],
          },
        },
        {
          $addFields: {
            driver: { $arrayElemAt: ["$driver", 0] },
          },
        },

        /**
         * Keraksiz maydonlarni olib tashlash
         */
        {
          $project: {
            ownerExpenses: 0,
            clientExpenses: 0,
            partExpenses: 0,
            orders: 0,
            firstCarId: 0,
            firstTrailerId: 0,
          },
        },

        { $sort: { createdAt: -1 } },
      ]);

      if (!parts.length)
        return response.notFound(res, "Partiyalar topilmadi", []);

      return response.success(res, "Partiyalar topildi", parts);
    } catch (err) {
      return response.serverError(res, err.message, err);
    }
  }

  async getPartById(req, res) {
    try {
      const { id } = req.params;

      const part = await Parts.findById(id);
      if (!part) return response.notFound(res, "Partiya topilmadi");

      let orders = await Orders.find({
        part_id: id,
        deleted: false,
        // state: { $ne: "finished" },
      })
        .populate("driver", "firstName lastName")
        .populate("car", "title number")
        .populate("trailer", "number")
        .populate("partner", "fullname")
        .populate("part_id", "name");

      return response.success(res, "Partiya topildi", { part, orders });
    } catch (err) {
      return response.serverError(res, err.message, err);
    }
  }

  async getPartsByDriverId(req, res) {
    try {
      const { id } = req.params;
      const parts = await Parts.find({
        driver: id,
        status: { $ne: "finished" },
      });
      if (!parts.length)
        return response.notFound(res, "Partiyalar topilmadi", []);
      return response.success(res, "Partiyalar topildi", parts);
    } catch (err) {
      return response.serverError(res, err.message, err);
    }
  }

  // // 🔹 Partiya statusini o‘zgartirish
  // async changeStatus(req, res) {
  //   const session = await Parts.startSession();
  //   session.startTransaction();

  //   try {
  //     const { part_id } = req.params;
  //     const { status,  end_probeg } = req.body;

  //     if (status && !["active", "in_progress", "finished"].includes(status)) {
  //       await session.abortTransaction();
  //       session.endSession();
  //       return response.error(
  //         res,
  //         "Noto'g'ri status qiymati yuborildi, to'g'ri qiymatlar: active, in_progress, finished"
  //       );
  //     }

  //     const part = await Parts.findById(part_id).session(session);
  //     if (!part) {
  //       await session.abortTransaction();
  //       session.endSession();
  //       return response.notFound(res, "Partiya topilmadi");
  //     }

  //     // Agar status kiritilmagan bo‘lsa, mavjudini saqlaydi
  //     part.status = status ?? part.status;
  //     part.end_probeg = end_probeg || part.end_probeg;
  //     part.end_fuel =0; // shu yerga qoldiq yoqilgi ;
  //     part.totalFuel =0; // shu yerga sarflanishi kerak bolgan yoqilgi;

  //     await part.save({ session });

  //     const order = await Orders.findOne({
  //       part_id: part_id,
  //       deleted: false,
  //     }).session(session);
  //     if (!order) {
  //       await session.abortTransaction();
  //       session.endSession();
  //       return response.notFound(res, "Partiyaga tegishli zakaz topilmadi");
  //     }

  //     // Mashina statusini yangilash
  //     await Cars.findOneAndUpdate(
  //       { _id: order.car },
  //       { status: true, probeg: end_probeg },
  //       { new: true, session }
  //     );

  //     // Trailer statusini yangilash
  //     await Trailers.findOneAndUpdate(
  //       { _id: order.trailer },
  //       { status: true },
  //       { new: true, session }
  //     );

  //     // Haydovchi statusini yangilash
  //     await Drivers.findOneAndUpdate(
  //       { _id: order.driver },
  //       { is_active: true },
  //       { new: true, session }
  //     );

  //     // Partiyaga tegishli orderlarni olish
  //     const orders = await Orders.find({
  //       part_id: part_id,
  //       deleted: false,
  //       state: "finished",
  //     });

  //     if (!orders.length) {
  //       return response.error(res, "Partiyada tugallangan orderlar topilmadi");
  //     }

  //     await session.commitTransaction();
  //     session.endSession();

  //     return response.success(res, "Partiya statusi o'zgartirildi", part);
  //   } catch (err) {
  //     await session.abortTransaction();
  //     session.endSession();
  //     return response.serverError(res, err.message, err);
  //   }
  // }

  async changeStatus(req, res) {
    const session = await Parts.startSession();
    session.startTransaction();

    try {
      const { part_id } = req.params;
      const { status, end_probeg } = req.body;

      if (status && !["active", "in_progress", "finished"].includes(status)) {
        await session.abortTransaction();
        session.endSession();
        return response.error(
          res,
          "Noto'g'ri status qiymati yuborildi, to'g'ri qiymatlar: active, in_progress, finished"
        );
      }

      const part = await Parts.findById(part_id).session(session);
      if (!part) {
        await session.abortTransaction();
        session.endSession();
        return response.notFound(res, "Partiya topilmadi");
      }

      // Yangi status va probeg
      const finalStatus = status ?? part.status;
      const finalEndProbeg = end_probeg ?? part.end_probeg;

      part.status = finalStatus;
      part.end_probeg = finalEndProbeg;

      /**
       * YOQILGI HISOBLASH
       *
       * distance = end_probeg - start_probeg
       * requiredFuel = (distance / 100) * average_fuel
       * totalFuelAvailable = start_fuel + yo'l davomida quyilgan yoqilgi (quantity)
       * end_fuel = totalFuelAvailable - requiredFuel
       * totalFuel = requiredFuel
       */

      const startProbeg = Number(part.start_probeg || 0);
      const endProbegNum = Number(finalEndProbeg || 0);
      const avgFuel = Number(part.avarage_fuel || 0);
      const startFuel = Number(part.start_fuel || 0);

      let endFuel = part.end_fuel || 0;
      let totalFuel = part.totalFuel || 0;

      // Faqat average_fuel va probeglar bor bo'lsa hisoblaymiz
      if (avgFuel > 0 && endProbegNum >= startProbeg) {
        const distance = endProbegNum - startProbeg; // km

        // Sarflanishi kerak bo'lgan yoqilgi (litrlarda)
        const requiredFuel = (distance / 100) * avgFuel;

        // Yo'l davomida quyilgan yoqilgi (Expense.category = "fuels", type = "order_expense")
        const fuelExpenses = await Expense.find({
          part_id,
          deleted: false,
          category: "fuels",
          type: "order_expense",
        }).session(session);

        const fuelAddedOnRoad = fuelExpenses.reduce((sum, e) => {
          // quantity ni litr deb olamiz
          return sum + Number(e.quantity || 0);
        }, 0);

        const totalFuelAvailable = startFuel + fuelAddedOnRoad;

        endFuel = totalFuelAvailable - requiredFuel;
        // Xohlasangiz manfiy bo'lmasin desak:
        // endFuel = Math.max(endFuel, 0);

        totalFuel = requiredFuel;

        part.end_fuel = endFuel;
        part.totalFuel = totalFuel;
        part.distance = distance;
        part.totalFuelAvailable = totalFuelAvailable;
      }

      await part.save({ session });

      const order = await Orders.findOne({
        part_id: part_id,
        deleted: false,
      }).session(session);
      if (!order) {
        await session.abortTransaction();
        session.endSession();
        return response.notFound(res, "Partiyaga tegishli zakaz topilmadi");
      }

      // Mashina statusini yangilash
      await Cars.findOneAndUpdate(
        { _id: order.car },
        { status: true, probeg: finalEndProbeg },
        { new: true, session }
      );

      // Trailer statusini yangilash
      await Trailers.findOneAndUpdate(
        { _id: order.trailer },
        { status: true },
        { new: true, session }
      );

      // Haydovchi statusini yangilash
      await Drivers.findOneAndUpdate(
        { _id: order.driver },
        { is_active: true },
        { new: true, session }
      );

      // Partiyaga tegishli tugallangan orderlar borligini tekshirish
      const orders = await Orders.find({
        part_id: part_id,
        deleted: false,
        state: "finished",
      }).session(session);

      if (!orders.length) {
        await session.abortTransaction();
        session.endSession();
        return response.error(res, "Partiyada tugallangan orderlar topilmadi");
      }

      await session.commitTransaction();
      session.endSession();

      return response.success(res, "Partiya statusi o'zgartirildi", part);
    } catch (err) {
      await session.abortTransaction();
      session.endSession();
      return response.serverError(res, err.message, err);
    }
  }

  // update part
  async updatePart(req, res) {
    try {
      const { id } = req.params;
      const { driver, car, trailer } = req.body;

      // 1) Partiyani yangilaymiz
      const part = await Parts.findByIdAndUpdate(id, req.body, { new: true });
      if (!part) {
        return response.notFound(res, "Partiya topilmadi");
      }

      // 2) Orderlar uchun umumiy update obyektini tayyorlaymiz
      const ordersUpdate = {};

      if (driver) {
        ordersUpdate.driver = driver;
      }
      if (car) {
        ordersUpdate.car = car;
      }
      if (trailer) {
        ordersUpdate.trailer = trailer;
      }

      if (car) {
        let order = await Orders.findOne({ part_id: id, deleted: false });
        if (order) {
          await Cars.findOneAndUpdate(
            { _id: order.car },
            { status: true },
            { new: true }
          );
        }
      }

      // Agar driver/car/trailer dan hech biri kelmagan bo'lsa - orderlarni o'zgartirmaymiz
      if (Object.keys(ordersUpdate).length > 0) {
        await Orders.updateMany({ part_id: id }, { $set: ordersUpdate });
      }

      return response.success(res, "Partiya o'zgartirildi", part);
    } catch (err) {
      return response.serverError(res, err.message, err);
    }
  }
}

module.exports = new partController();
