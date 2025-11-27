const response = require("../utils/response");
const Parts = require("../model/partModel");
const Orders = require("../model/orderModel");
const Cars = require("../model/carModel");
const Drivers = require("../model/driversModel");
const Trailers = require("../model/trailerModel");

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
  //        * QOLDIQ HISOBLASH
  //        * qoldiq = (deposit + totalClientPayments) - totalPartExpenses
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
         * ORDERLAR — umumiy order puli + haydovchi oyligi + mashina
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
         * Keraksiz maydonlarni olib tashlash
         */
        {
          $project: {
            ownerExpenses: 0,
            clientExpenses: 0,
            partExpenses: 0,
            orders: 0,
            firstCarId: 0,
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

  // 🔹 Partiya statusini o‘zgartirish
  async changeStatus(req, res) {
    const session = await Parts.startSession();
    session.startTransaction();

    try {
      const { part_id } = req.params;
      const { status, end_fuel, end_probeg } = req.body;

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

      // Agar status kiritilmagan bo‘lsa, mavjudini saqlaydi
      part.status = status ?? part.status;
      part.end_fuel = end_fuel || part.end_fuel;
      part.end_probeg = end_probeg || part.end_probeg;

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
        { status: true, probeg: end_probeg },
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

      // Partiyaga tegishli orderlarni olish
      const orders = await Orders.find({
        part_id: part_id,
        deleted: false,
        state: "finished",
      });

      if (!orders.length) {
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
