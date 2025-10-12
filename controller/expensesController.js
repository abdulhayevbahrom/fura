const response = require("../utils/response");
const Expense = require("../model/expensesModel");
const Order = require("../model/orderModel");

class ExpensesController {
  async getAll(req, res) {
    try {
      let { startDate, endDate, category, car, type, from } = req.query;
      let filter = { deleted: false };
      if (startDate && endDate) {
        filter.createdAt = {
          $gte: new Date(new Date(startDate).setHours(0, 0, 0)),
          $lte: new Date(new Date(endDate).setHours(23, 59, 59)),
        };
      }
      if (category) {
        filter.category = category;
      }
      if (car) {
        filter.car = car;
      }
      if (type) {
        filter.type = type;
      }
      if (from) {
        filter.from = from;
      }

      let repairs = await Expense.find(filter)
        .sort({ createdAt: -1 })
        .populate("car", "title number")
        .populate("trailer", "number")
        .populate("order_id");
      if (!repairs.length) {
        return response.notFound(res, "Harajatlar topilmadi");
      }
      return response.success(
        res,
        "Harajatlar muvaffaqiyatli topildi",
        repairs
      );
    } catch (error) {
      return response.error(res, error.message, error);
    }
  }

  async getById(req, res) {
    try {
      const expense = await Expense.findOne({
        _id: req.params.id,
        deleted: false, // faqat delete qilinmaganlarni oladi
      }).populate({
        path: "order_id",
      });

      if (!expense) {
        return response.notFound(res, "Xarajat topilmadi");
      }

      return response.success(res, "Xarajat topildi", expense);
    } catch (error) {
      return response.error(res, error.message, error);
    }
  }

  // get only category list
  async getCategories(req, res) {
    try {
      const categories = await Expense.aggregate([
        { $match: { category: { $exists: true, $ne: "" } } }, // faqat to‘ldirilganlar
        { $group: { _id: "$category" } }, // unikal kategoriya
        { $sort: { _id: 1 } }, // tartiblash
      ]);

      const result = categories.map((c) => c._id);

      if (!result.length) {
        return response.notFound(res, "Kategoriyalar topilmadi", []);
      }

      return response.success(res, "Kategoriyalar ro'yxati", result);
    } catch (error) {
      return response.serverError(res, error.message, error);
    }
  }

  // get by order id
  async getByOrderId(req, res) {
    try {
      const { orderId } = req.params;
      const expenses = await Expense.find({
        order_id: orderId,
        deleted: false,
      });
      if (!expenses.length) {
        return response.notFound(res, "Xarajatlar topilmadi", []);
      }
      return response.success(res, "Xarajatlar ro'yxati", expenses);
    } catch (error) {
      return response.error(res, error.message, error);
    }
  }

  async create(req, res) {
    try {
      const { order_id } = req.body;
      let order = await Order.findOne({ _id: order_id, deleted: false });
      if (req.body.type === "order_expense" && req.body.from !== "client") {
        const order = await Order.findOne({
          _id: order_id,
          state: { $ne: "finished" },
          deleted: false,
        });

        if (!order) {
          return response.notFound(res, "Buyurtma topilmadi");
        }
        req.body.part_id = order.part_id;
      }

      let totalPayments = await Expense.find({
        order_id: order_id,
        type: "order_expense",
        deleted: false,
        from: "client",
      });

      let totalPaymentSum = totalPayments?.reduce((acc, expense) => {
        return acc + expense.amount;
      }, 0);

      if (totalPaymentSum >= order?.totalPrice) {
        return response.error(res, "Buyurtma to'ldirilgan");
      }

      if (
        req.body.type === "order_expense" &&
        req.body.from === "client" &&
        order?.totalPrice - totalPaymentSum < req.body.amount
      ) {
        return response.error(
          res,
          `ortiqcha summa kiritildi, ${
            order?.totalPrice - totalPaymentSum
          } summa qoldi`
        );
      }

      const newExpense = await Expense.create(req.body);
      return response.created(res, "Xarajat qo'shildi", newExpense);
    } catch (error) {
      return response.error(res, error.message, error);
    }
  }

  async delete(req, res) {
    try {
      const expense = await Expense.findById(req.params.id);
      if (!expense || expense.deleted) {
        return response.notFound(res, "Xarajat topilmadi");
      }
      expense.deleted = true;
      await expense.save();
      return response.success(res, "Xarajat o'chirildi", expense);
    } catch (error) {
      return response.error(res, error.message, error);
    }
  }

  async update(req, res) {
    try {
      // check order
      if (req.body.type === "order_expense") {
        const order = await Order.findOne({
          _id: req.body.order_id,
          state: { $ne: "finished" },
          deleted: false,
        });

        if (!order) {
          return response.notFound(
            res,
            "Buyurtma topilmadi, yangilash mumkin emas"
          );
        }
      }
      let updatedExpense = await Expense.findOneAndUpdate(
        { _id: req.params.id, deleted: false },
        req.body,
        { new: true }
      );
      if (!updatedExpense) {
        return response.notFound(res, "Xarajat topilmadi");
      }
      return response.success(res, "Xarajat yangilandi", updatedExpense);
    } catch (error) {
      return response.error(res, error.message, error);
    }
  }
}

module.exports = new ExpensesController();
