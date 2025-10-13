const response = require("../utils/response");
const Parts = require("../model/partModel");
const Orders = require("../model/orderModel");
const Cars = require("../model/carModel");

class partController {
  async getParts(req, res) {
    try {
      let { status } = req.query;
      let filter = {};
      if (status) filter.status = status;

      // Partiyalarni va ularning xarajatlarini olish
      const parts = await Parts.aggregate([
        { $match: filter }, // Filtrlash (status bo'yicha)
        {
          $lookup: {
            from: "expenses", // Expenses kolleksiyasini ulash
            localField: "_id",
            foreignField: "part_id",
            as: "expenses",
          },
        },
        {
          $addFields: {
            expenses: {
              $filter: {
                input: "$expenses",
                as: "expense",
                cond: {
                  $and: [
                    { $eq: ["$$expense.from", "owner"] }, // Faqat "owner" xarajatlari
                    { $eq: ["$$expense.deleted", false] }, // Faqat o'chirilmagan xarajatlar
                  ],
                },
              },
            },
          },
        },
        {
          $addFields: {
            totalExpenses: { $sum: "$expenses.amount" }, // Xarajatlar yig'indisi
          },
        },
        {
          $lookup: {
            from: "orders", // Orders kolleksiyasini ulash
            localField: "_id",
            foreignField: "part_id",
            as: "orders",
          },
        },
        {
          $addFields: {
            orders: {
              $filter: {
                input: "$orders",
                as: "order",
                cond: {
                  $and: [
                    { $eq: ["$$order.deleted", false] }, // Faqat o'chirilmagan zakazlar
                  ],
                },
              },
            },
          },
        },
        {
          $addFields: {
            totalDriverSalary: { $sum: "$orders.driver_salary" }, // Haydovchi maoshlari yig'indisi
            totalOrderPrices: { $sum: "$orders.totalPrice" }, // Zakazlarning umumiy summasi
          },
        },
        {
          $project: {
            expenses: 0, // Xarajatlar ro'yxatini qaytarmaslik
            orders: 0, // Zakazlar ro'yxatini qaytarmaslik
          },
        },
      ]);

      if (!parts.length) return response.notFound(res, "Partiyalar topilmadi");

      return response.success(res, "Partiyalar topildi", parts);
    } catch (err) {
      return response.serverError(res, err.message, err);
    }
  }
  // 🔹 Bitta partiyani ID orqali olish
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

  // 🔹 Partiya statusini o‘zgartirish
  async changeStatus(req, res) {
    try {
      const { id } = req.params;
      const { status } = req.body;

      if (status && !["active", "in_progress", "finished"].includes(status)) {
        return response.error(
          res,
          "Noto'g'ri status qiymati yubrildi, tog'ri qiymat: finished"
        );
      }

      const part = await Parts.findById(id);
      if (!part) return response.notFound(res, "Partiya topilmadi");

      // Agar status kiritilmagan bo‘lsa, mavjudini saqlaydi
      part.status = status ?? part.status;

      await part.save();

      let order = await Orders.findOne({ part_id: id, deleted: false });

      await Cars.findOneAndUpdate(
        { _id: order.car },
        { status: true },
        { new: true }
      );

      return response.success(res, "Partiya statusi o'zgartirildi", part);
    } catch (err) {
      return response.serverError(res, err.message, err);
    }
  }
}

module.exports = new partController();
