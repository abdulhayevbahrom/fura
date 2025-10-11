const Order = require("../model/orderModel");
const response = require("../utils/response");
const Expense = require("../model/expensesModel");

class DashboardController {
  async getDashboardData(req, res) {
    try {
      let { startDate, endDate } = req.query;

      let filter = { deleted: false };

      // Apply date filter only if startDate and endDate are provided
      if (startDate && endDate) {
        startDate = new Date(startDate);
        endDate = new Date(endDate);
        filter.createdAt = { $gte: startDate, $lte: endDate };
      }

      const totalOrders = await Order.countDocuments(filter);
      let finishedOrders = await Order.countDocuments({
        ...filter,
        state: "finished",
      });
      let totalAmountData = await Order.aggregate([
        { $match: { ...filter, state: "finished" } },
        { $group: { _id: null, total: { $sum: "$totalPrice" } } },
      ]);

      let totalExpensesData = await Expense.aggregate([
        { $match: { ...filter, from: { $ne: "client" } } },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]);

      let totalClientPaymentsData = await Expense.aggregate([
        { $match: { ...filter, from: "client" } },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]);

      // Joriy yilni aniqlash
      const now = new Date();
      const currentYear = now.getFullYear();

      // Joriy yil uchun oylik harajatlar statistikasi
      const monthlyExpenses = await Expense.aggregate([
        {
          $match: {
            deleted: false,
            createdAt: {
              $gte: new Date(currentYear, 0, 1), // Joriy yilning 1-yanvaridan
              $lte: new Date(currentYear, 11, 31, 23, 59, 59), // Joriy yilning 31-dekabriga qadar
            },
          },
        },
        {
          $group: {
            _id: { $month: "$createdAt" }, // Oy bo'yicha guruhlash
            amount: { $sum: "$amount" }, // Harajatlarni yig'ish
          },
        },
        {
          $sort: { _id: 1 }, // Oy bo'yicha tartiblash (oshish tartibida)
        },
      ]);

      // Oy nomlarini aniqlash
      const monthNames = [
        "Yanvar",
        "Fevral",
        "Mart",
        "Aprel",
        "May",
        "Iyun",
        "Iyul",
        "Avgust",
        "Sentabr",
        "Oktabr",
        "Noyabr",
        "Dekabr",
      ];

      // Har bir oy uchun statistikani to'ldirish
      const monthlyStatistics = monthNames.map((month, index) => {
        const expense = monthlyExpenses.find((e) => e._id === index + 1);
        return {
          month,
          amount: expense ? expense.amount : 0, // Agar ma'lumot bo'lmasa, 0
        };
      });

      let totalAmount = totalAmountData[0] ? totalAmountData[0].total : 0;
      let totalExpenses = totalExpensesData[0] ? totalExpensesData[0].total : 0;
      let totalClientPayments = totalClientPaymentsData[0]
        ? totalClientPaymentsData[0].total
        : 0;

      let totalDebts = totalAmount - totalClientPayments;

      let data = {
        totalOrders,
        finishedOrders,
        totalAmount,
        totalExpenses,
        totalClientPayments,
        totalDebts,
        monthlyStatistics,
      };

      return response.success(res, "Dashboard ma'lumotlari", data);
    } catch (error) {
      return response.error(res, error.message, error);
    }
  }
}

module.exports = new DashboardController();
