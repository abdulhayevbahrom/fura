// const Order = require("../model/orderModel");
// const response = require("../utils/response");
// const Expense = require("../model/expensesModel");
// const Salary = require("../model/salaryModel");

// class DashboardController {
//   async getDashboardData(req, res) {
//     try {
//       let { startDate, endDate } = req.query;

//       let filter = { deleted: false };

//       // Apply date filter only if startDate and endDate are provided
//       if (startDate && endDate) {
//         startDate = new Date(startDate);
//         endDate = new Date(endDate);
//         filter.createdAt = { $gte: startDate, $lte: endDate };
//       }

//       const totalOrders = await Order.countDocuments(filter);
//       let finishedOrders = await Order.countDocuments({
//         ...filter,
//         state: "finished",
//       });
//       let totalAmountData = await Order.aggregate([
//         { $match: { ...filter } },
//         { $group: { _id: null, total: { $sum: "$totalPrice" } } },
//       ]);

//       let totalExpensesData = await Expense.aggregate([
//         { $match: { ...filter, from: { $ne: "client" } } },
//         { $group: { _id: null, total: { $sum: "$amount" } } },
//       ]);

//       let totalGivenSalariesData = [];

//       if (startDate && endDate) {
//         totalGivenSalariesData = await Salary.aggregate([
//           {
//             $match: {
//               createdAt: { $gte: new Date(startDate), $lte: new Date(endDate) },
//             },
//           },
//           {
//             $group: {
//               _id: null,
//               total: { $sum: "$amount" },
//             },
//           },
//         ]);
//       } else {
//         // Agar startDate va endDate berilmagan bo'lsa, barcha ma'lumotlarni hisoblash
//         totalGivenSalariesData = await Salary.aggregate([
//           {
//             $group: {
//               _id: null,
//               total: { $sum: "$amount" },
//             },
//           },
//         ]);
//       }

//       let totalClientPaymentsData = await Expense.aggregate([
//         { $match: { ...filter, from: "client" } },
//         { $group: { _id: null, total: { $sum: "$amount" } } },
//       ]);

//       const now = new Date();
//       const currentYear = now.getFullYear();

//       // Joriy yil uchun oylik chiqimlar statistikasi (Expense)
//       const monthlyExpenses = await Expense.aggregate([
//         {
//           $match: {
//             deleted: false,
//             from: { $ne: "client" }, // Faqat chiqimlar
//             createdAt: {
//               $gte: new Date(currentYear, 0, 1), // Joriy yilning 1-yanvaridan
//               $lte: new Date(currentYear, 11, 31, 23, 59, 59), // Joriy yilning 31-dekabriga qadar
//             },
//           },
//         },
//         {
//           $group: {
//             _id: { $month: "$createdAt" }, // Oy bo'yicha guruhlash
//             amount: { $sum: "$amount" }, // Harajatlarni yig'ish
//           },
//         },
//         {
//           $sort: { _id: 1 }, // Oy bo'yicha tartiblash (oshish tartibida)
//         },
//       ]);

//       // Joriy yil uchun oylik kirimlar statistikasi (Income)
//       const monthlyIncomes = await Expense.aggregate([
//         {
//           $match: {
//             deleted: false,
//             from: "client", // Faqat kirimlar
//             createdAt: {
//               $gte: new Date(currentYear, 0, 1), // Joriy yilning 1-yanvaridan
//               $lte: new Date(currentYear, 11, 31, 23, 59, 59), // Joriy yilning 31-dekabriga qadar
//             },
//           },
//         },
//         {
//           $group: {
//             _id: { $month: "$createdAt" }, // Oy bo'yicha guruhlash
//             amount: { $sum: "$amount" }, // Kirimlarni yig'ish
//           },
//         },
//         {
//           $sort: { _id: 1 }, // Oy bo'yicha tartiblash (oshish tartibida)
//         },
//       ]);

//       // Joriy yil uchun oylik ish haqi statistikasi (Salary)
//       const monthlySalaries = await Salary.aggregate([
//         {
//           $match: {
//             createdAt: {
//               $gte: new Date(currentYear, 0, 1), // Joriy yilning 1-yanvaridan
//               $lte: new Date(currentYear, 11, 31, 23, 59, 59), // Joriy yilning 31-dekabriga qadar
//             },
//           },
//         },
//         {
//           $group: {
//             _id: { $month: "$createdAt" }, // Oy bo'yicha guruhlash
//             amount: { $sum: "$amount" }, // Ish haqlarini yig'ish
//           },
//         },
//         {
//           $sort: { _id: 1 }, // Oy bo'yicha tartiblash (oshish tartibida)
//         },
//       ]);

//       // Oy nomlarini aniqlash
//       const monthNames = [
//         "Yanvar",
//         "Fevral",
//         "Mart",
//         "Aprel",
//         "May",
//         "Iyun",
//         "Iyul",
//         "Avgust",
//         "Sentabr",
//         "Oktabr",
//         "Noyabr",
//         "Dekabr",
//       ];

//       // Har bir oy uchun chiqim va kirim statistikalarini to'ldirish
//       const monthlyStatistics = monthNames.map((month, index) => {
//         const expense = monthlyExpenses.find((e) => e._id === index + 1);
//         const income = monthlyIncomes.find((i) => i._id === index + 1);
//         const salary = monthlySalaries.find((s) => s._id === index + 1);
//         return {
//           month,
//           income: income ? income.amount : 0, // Agar kirim bo'lmasa, 0
//           expense:
//             (expense ? expense.amount : 0) + (salary ? salary.amount : 0), // Chiqim + ish haqi
//         };
//       });

//       let totalAmount = totalAmountData[0] ? totalAmountData[0].total : 0;
//       let totalExpenses = totalExpensesData[0] ? totalExpensesData[0].total : 0;
//       let totalGivenSalaries = totalGivenSalariesData[0]
//         ? totalGivenSalariesData[0].total
//         : 0;
//       let totalClientPayments = totalClientPaymentsData[0]
//         ? totalClientPaymentsData[0].total
//         : 0;

//       let totalDebts = totalAmount - totalClientPayments;

//       let data = {
//         totalOrders,
//         finishedOrders,
//         totalAmount,
//         totalExpenses: totalExpenses + totalGivenSalaries,
//         totalClientPayments,
//         totalDebts,
//         monthlyStatistics,
//       };

//       return response.success(res, "Dashboard ma'lumotlari", data);
//     } catch (error) {
//       return response.error(res, error.message, error);
//     }
//   }
// }

// module.exports = new DashboardController();

const Order = require("../model/orderModel");
const response = require("../utils/response");
const Expense = require("../model/expensesModel");
const Salary = require("../model/salaryModel");

class DashboardController {
  async getDashboardData(req, res) {
    try {
      let { startDate, endDate } = req.query;

      // 🗓️ Umumiy date filter (createdAt bo'yicha)
      let dateFilter = {};
      if (startDate && endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);

        dateFilter = {
          createdAt: {
            $gte: start,
            $lte: end,
          },
        };
      }

      // -----------------------
      // 1) ORDER STATISTIKA
      // -----------------------
      const orderMatch = {
        deleted: false,
        ...dateFilter,
      };

      const totalOrders = await Order.countDocuments(orderMatch);
      const finishedOrders = await Order.countDocuments({
        ...orderMatch,
        state: "finished",
      });

      // totalAmount (bazaviy valyutada, USD)
      const totalAmountData = await Order.aggregate([
        { $match: orderMatch },
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
                  $divide: ["$totalPrice", { $ifNull: ["$currency.rate", 1] }],
                },
                2,
              ],
            },
          },
        },
        {
          $group: {
            _id: null,
            total: { $sum: "$totalPriceBase" },
          },
        },
      ]);

      // -----------------------
      // 2) EXPENSE STATISTIKA
      // -----------------------
      // from != "client" → chiqimlar (xarajatlar)
      const expenseMatch = {
        deleted: false,
        from: { $ne: "client" },
        ...dateFilter,
      };

      const totalExpensesData = await Expense.aggregate([
        { $match: expenseMatch },
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
                  $divide: ["$amount", { $ifNull: ["$currency.rate", 1] }],
                },
                2,
              ],
            },
          },
        },
        {
          $group: {
            _id: null,
            total: { $sum: "$amountBase" },
          },
        },
      ]);

      // from == "client" → kirimlar (mijozdan tushgan pul)
      const clientPaymentMatch = {
        deleted: false,
        from: "client",
        ...dateFilter,
      };

      const totalClientPaymentsData = await Expense.aggregate([
        { $match: clientPaymentMatch },
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
                  $divide: ["$amount", { $ifNull: ["$currency.rate", 1] }],
                },
                2,
              ],
            },
          },
        },
        {
          $group: {
            _id: null,
            total: { $sum: "$amountBase" },
          },
        },
      ]);

      // -----------------------
      // 3) SALARY STATISTIKA
      // -----------------------
      let salaryMatch = {};
      if (startDate && endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        salaryMatch.createdAt = {
          $gte: start,
          $lte: end,
        };
      }

      // Umumiy ish haqlari (bazaviyda)
      const totalGivenSalariesData = await Salary.aggregate([
        { $match: salaryMatch },
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
                  $divide: ["$amount", { $ifNull: ["$currency.rate", 1] }],
                },
                2,
              ],
            },
          },
        },
        {
          $group: {
            _id: null,
            total: { $sum: "$amountBase" },
          },
        },
      ]);

      // -----------------------
      // 4) OYLIK STATISTIKA (joriy yil bo'yicha, bazaviyda)
      // -----------------------
      const now = new Date();
      const currentYear = now.getFullYear();

      const yearStart = new Date(currentYear, 0, 1);
      const yearEnd = new Date(currentYear, 11, 31, 23, 59, 59);

      // 💸 Joriy yil uchun oylik chiqimlar (Expense, from != client)
      const monthlyExpenses = await Expense.aggregate([
        {
          $match: {
            deleted: false,
            from: { $ne: "client" },
            createdAt: {
              $gte: yearStart,
              $lte: yearEnd,
            },
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
                  $divide: ["$amount", { $ifNull: ["$currency.rate", 1] }],
                },
                2,
              ],
            },
          },
        },
        {
          $group: {
            _id: { $month: "$createdAt" },
            amount: { $sum: "$amountBase" },
          },
        },
        {
          $sort: { _id: 1 },
        },
      ]);

      // 💰 Joriy yil uchun oylik kirimlar (from: "client")
      const monthlyIncomes = await Expense.aggregate([
        {
          $match: {
            deleted: false,
            from: "client",
            createdAt: {
              $gte: yearStart,
              $lte: yearEnd,
            },
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
                  $divide: ["$amount", { $ifNull: ["$currency.rate", 1] }],
                },
                2,
              ],
            },
          },
        },
        {
          $group: {
            _id: { $month: "$createdAt" },
            amount: { $sum: "$amountBase" },
          },
        },
        {
          $sort: { _id: 1 },
        },
      ]);

      // 👨‍💼 Joriy yil uchun oylik ish haqi (Salary)
      const monthlySalaries = await Salary.aggregate([
        {
          $match: {
            createdAt: {
              $gte: yearStart,
              $lte: yearEnd,
            },
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
                  $divide: ["$amount", { $ifNull: ["$currency.rate", 1] }],
                },
                2,
              ],
            },
          },
        },
        {
          $group: {
            _id: { $month: "$createdAt" },
            amount: { $sum: "$amountBase" },
          },
        },
        {
          $sort: { _id: 1 },
        },
      ]);

      // Oy nomlari
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

      // Har oy bo'yicha income / expense (bazaviyda)
      const monthlyStatistics = monthNames.map((month, index) => {
        const expense = monthlyExpenses.find((e) => e._id === index + 1);
        const income = monthlyIncomes.find((i) => i._id === index + 1);
        const salary = monthlySalaries.find((s) => s._id === index + 1);

        return {
          month,
          income: income ? income.amount : 0,
          expense:
            (expense ? expense.amount : 0) + (salary ? salary.amount : 0),
        };
      });

      // -----------------------
      // 5) YAKUNIY SONLAR
      // -----------------------
      const totalAmount = totalAmountData[0] ? totalAmountData[0].total : 0;
      const totalExpenses = totalExpensesData[0]
        ? totalExpensesData[0].total
        : 0;
      const totalGivenSalaries = totalGivenSalariesData[0]
        ? totalGivenSalariesData[0].total
        : 0;
      const totalClientPayments = totalClientPaymentsData[0]
        ? totalClientPaymentsData[0].total
        : 0;

      // Jami qarz (bazaviyda)
      const totalDebts = totalAmount - totalClientPayments;

      const data = {
        totalOrders,
        finishedOrders,
        totalAmount, // USD da
        totalExpenses: totalExpenses + totalGivenSalaries, // USD da
        totalClientPayments, // USD da
        totalDebts, // USD da
        monthlyStatistics, // hammasi USD ga o'tkazilgan
      };

      return response.success(res, "Dashboard ma'lumotlari", data);
    } catch (error) {
      return response.error(res, error.message, error);
    }
  }
}

module.exports = new DashboardController();
