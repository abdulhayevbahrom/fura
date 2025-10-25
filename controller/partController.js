const response = require("../utils/response");
const Parts = require("../model/partModel");
const Orders = require("../model/orderModel");
const Cars = require("../model/carModel");
const Drivers = require("../model/driversModel");
const Salary = require("../model/salaryModel");
const Trailers = require("../model/trailerModel");

class partController {
  // async getParts(req, res) {
  //   try {
  //     let { status } = req.query;
  //     let filter = {};
  //     if (status) filter.status = status;

  //     // Partiyalarni va ularning xarajatlarini olish
  //     const parts = await Parts.aggregate([
  //       { $match: filter }, // Filtrlash (status bo'yicha)
  //       {
  //         $lookup: {
  //           from: "expenses", // Expenses kolleksiyasini ulash
  //           localField: "_id",
  //           foreignField: "part_id",
  //           as: "expenses",
  //         },
  //       },
  //       {
  //         $addFields: {
  //           expenses: {
  //             $filter: {
  //               input: "$expenses",
  //               as: "expense",
  //               cond: {
  //                 $and: [
  //                   { $eq: ["$$expense.from", "owner"] }, // Faqat "owner" xarajatlari
  //                   { $eq: ["$$expense.deleted", false] }, // Faqat o'chirilmagan xarajatlar
  //                 ],
  //               },
  //             },
  //           },
  //         },
  //       },
  //       {
  //         $addFields: {
  //           totalExpenses: { $sum: "$expenses.amount" }, // Xarajatlar yig'indisi
  //         },
  //       },
  //       {
  //         $lookup: {
  //           from: "orders", // Orders kolleksiyasini ulash
  //           localField: "_id",
  //           foreignField: "part_id",
  //           as: "orders",
  //         },
  //       },
  //       {
  //         $addFields: {
  //           orders: {
  //             $filter: {
  //               input: "$orders",
  //               as: "order",
  //               cond: {
  //                 $and: [
  //                   { $eq: ["$$order.deleted", false] }, // Faqat o'chirilmagan zakazlar
  //                 ],
  //               },
  //             },
  //           },
  //         },
  //       },
  //       {
  //         $addFields: {
  //           totalDriverSalary: { $sum: "$orders.driver_salary" }, // Haydovchi maoshlari yig'indisi
  //           totalOrderPrices: { $sum: "$orders.totalPrice" }, // Zakazlarning umumiy summasi
  //         },
  //       },
  //       {
  //         $project: {
  //           expenses: 0, // Xarajatlar ro'yxatini qaytarmaslik
  //           orders: 0, // Zakazlar ro'yxatini qaytarmaslik
  //         },
  //       },
  //     ]);

  //     if (!parts.length) return response.notFound(res, "Partiyalar topilmadi");

  //     return response.success(res, "Partiyalar topildi", parts);
  //   } catch (err) {
  //     return response.serverError(res, err.message, err);
  //   }
  // }
  // 🔹 Bitta partiyani ID orqali olish

  async getParts(req, res) {
    try {
      let { status } = req.query;
      let filter = {};
      if (status) filter.status = status;

      const parts = await Parts.aggregate([
        { $match: filter },

        // OWNER xarajatlarini olish
        {
          $lookup: {
            from: "expenses",
            localField: "_id",
            foreignField: "part_id",
            as: "expenses",
            pipeline: [
              {
                $match: {
                  from: "owner",
                  deleted: false,
                },
              },
              { $project: { amount: 1 } },
            ],
          },
        },
        {
          $addFields: {
            totalExpenses: { $sum: "$expenses.amount" },
          },
        },

        // ORDERLARNI olish
        {
          $lookup: {
            from: "orders",
            localField: "_id",
            foreignField: "part_id",
            as: "orders",
            pipeline: [
              { $match: { deleted: false } },
              {
                $project: {
                  totalPrice: 1,
                  driver_salary: 1,
                  car: 1,
                },
              },
            ],
          },
        },
        {
          $addFields: {
            totalDriverSalary: { $sum: "$orders.driver_salary" },
            totalOrderPrices: { $sum: "$orders.totalPrice" },
            firstCarId: { $first: "$orders.car" }, // birinchi orderdagi mashina
          },
        },

        // Cars kolleksiyasini ulash (butun obyektni olish)
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
                  fuelFor100km: 1,
                  probeg: 1,
                  licens: 1,
                  sugurta: 1,
                  status: 1,
                  // image: 1,
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
            car: { $arrayElemAt: ["$car", 0] }, // obyektni ichidan olish
          },
        },
        {
          $project: {
            expenses: 0,
            orders: 0,
            firstCarId: 0,
          },
        },
      ]).sort({ createdAt: -1 });

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
      const { status } = req.body;

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
        { status: true },
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
}

module.exports = new partController();
