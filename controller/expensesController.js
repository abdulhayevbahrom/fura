const response = require("../utils/response");
const Expense = require("../model/expensesModel");
const Order = require("../model/orderModel");
const mongoose = require("mongoose");
const Currency = require("../model/currencyModel"); // model("currency")

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

      // let repairs = await Expense.find(filter)
      //   .sort({ createdAt: -1 })
      //   .populate("car", "title number")
      //   .populate("trailer", "number")
      //   .populate("order_id")
      //   .populate("currency_id", "name rate"); // YANGI: valyuta ma'lumotlari
      let repairs = await Expense.find(filter)
        .sort({ createdAt: -1 })
        .populate("car", "title number")
        .populate("trailer", "number")
        .populate("currency_id", "name rate")
        .populate({
          path: "order_id",
          populate: {
            path: "partner", // Order modelidagi field nomi
            // select: "name phone", // Kerakli fieldlar (istalgancha o'zgartir)
          },
        })
        .populate("receiver", "firstName lastName")
        .populate("client_id", "fullname"); // mijoz nomi

      if (!repairs.length) {
        return response.notFound(res, "Harajatlar topilmadi");
      }

      // Valyuta bo'yicha bazaviy summani hisoblash
      const normalizedRepairs = repairs.map((item) => {
        const obj = item.toObject();

        const rate = obj.currency_id?.rate || 1;
        const currencyName = obj.currency_id?.name || null;

        return {
          ...obj,
          amountBase: obj.amount * rate, // bitta valyutada (masalan, UZS) hisoblangan qiymat
          currencyName,
          currencyRate: rate,
        };
      });

      return response.success(
        res,
        "Harajatlar muvaffaqiyatli topildi",
        normalizedRepairs
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
      })
        .populate({
          path: "order_id",
        })
        .populate("car", "title number")
        .populate("trailer", "number")
        .populate("order_id")
        .populate("part_id");

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

  async getByOrderId(req, res) {
    try {
      const { orderId } = req.params;

      // orderId to'g'riligini tekshiramiz
      if (!mongoose.Types.ObjectId.isValid(orderId)) {
        return response.error(res, "Noto'g'ri orderId");
      }

      const orderObjectId = new mongoose.Types.ObjectId(orderId);

      const expenses = await Expense.aggregate([
        {
          $match: {
            order_id: orderObjectId,
            deleted: false,
          },
        },

        // 🔹 EXPENSE CURRENCY ulash va amountBase hisoblash + currency_id ni populate qilish
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
            // Bazaviy valyuta (USD) ga o'tkazish: amountBase = amount / rate
            amountBase: {
              $round: [
                {
                  $divide: ["$amount", { $ifNull: ["$currency.rate", 1] }],
                },
                2, // 2 xonali kasrga yaxlitlash
              ],
            },
            // currency_id ni obyektga aylantiramiz
            currency_id: {
              _id: "$currency._id",
              name: "$currency.name",
              rate: "$currency.rate",
            },
          },
        },

        // 🔹 CAR ulash
        {
          $lookup: {
            from: "cars",
            localField: "car",
            foreignField: "_id",
            as: "car",
            pipeline: [
              {
                $project: {
                  _id: 1,
                  title: 1,
                  number: 1,
                },
              },
            ],
          },
        },
        {
          $unwind: {
            path: "$car",
            preserveNullAndEmptyArrays: true,
          },
        },

        // 🔹 TRAILER ulash
        {
          $lookup: {
            from: "trailers",
            localField: "trailer",
            foreignField: "_id",
            as: "trailer",
            pipeline: [
              {
                $project: {
                  _id: 1,
                  number: 1,
                },
              },
            ],
          },
        },
        {
          $unwind: {
            path: "$trailer",
            preserveNullAndEmptyArrays: true,
          },
        },

        // 🔹 ORDER ulash + order.currency_id va driver_salary_currency_id ni populate
        {
          $lookup: {
            from: "orders",
            localField: "order_id",
            foreignField: "_id",
            as: "order_id", // shu nom bilan ketadi
            pipeline: [
              // Orderning asosiy valyutasi
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

              // Haydovchi oyligi valyutasi
              {
                $lookup: {
                  from: "currencies",
                  localField: "driver_salary_currency_id",
                  foreignField: "_id",
                  as: "driverSalaryCurrency",
                },
              },
              {
                $unwind: {
                  path: "$driverSalaryCurrency",
                  preserveNullAndEmptyArrays: true,
                },
              },

              // Field-larni obyektga o'girish
              // {
              //   $addFields: {
              //     currency_id: {
              //       _id: "$orderCurrency._id",
              //       name: "$orderCurrency.name",
              //       rate: "$orderCurrency.rate",
              //     },
              //     driver_salary_currency_id: {
              //       _id: "$driverSalaryCurrency._id",
              //       name: "$driverSalaryCurrency.name",
              //       rate: "$driverSalaryCurrency.rate",
              //     },
              //   },
              // },

              // SHU YERDA trailer, car, partner, driver ni olib tashlaymiz
              {
                $project: {
                  orderCurrency: 0,
                  driverSalaryCurrency: 0,
                  trailer: 0,
                  car: 0,
                  partner: 0,
                  driver: 0,
                },
              },
            ],
          },
        },
        {
          $unwind: {
            path: "$order_id",
            preserveNullAndEmptyArrays: true,
          },
        },

        // 🔹 PART ulash
        {
          $lookup: {
            from: "parts",
            localField: "part_id",
            foreignField: "_id",
            as: "part",
          },
        },
        {
          $unwind: {
            path: "$part",
            preserveNullAndEmptyArrays: true,
          },
        },

        // 🔹 keraksiz ichki obyektlarni olib tashlash
        {
          $project: {
            currency: 0, // expense tarafdagi lookup natijasini olib tashladik
          },
        },

        { $sort: { createdAt: -1 } },
      ]);

      if (!expenses.length) {
        return response.notFound(res, "Xarajatlar topilmadi", []);
      }

      return response.success(res, "Xarajatlar ro'yxati", expenses);
    } catch (error) {
      return response.error(res, error.message, error);
    }
  }

  // async create(req, res) {
  //   try {
  //     const { order_id } = req.body;
  //     let order = await Order.findOne({ _id: order_id, deleted: false });
  //     if (req.body.type === "order_expense" && req.body.from !== "client") {
  //       const order = await Order.findOne({
  //         _id: order_id,
  //         state: { $ne: "finished" },
  //         deleted: false,
  //       });

  //       if (!order) {
  //         return response.notFound(res, "Buyurtma topilmadi");
  //       }
  //       req.body.part_id = order.part_id;
  //     }

  //     let totalPayments = await Expense.find({
  //       order_id: order_id,
  //       type: "order_expense",
  //       deleted: false,
  //       from: "client",
  //     });

  //     let totalPaymentSum = totalPayments?.reduce((acc, expense) => {
  //       return acc + expense.amount;
  //     }, 0);

  //     if (totalPaymentSum >= order?.totalPrice) {
  //       return response.error(res, "Buyurtma to'ldirilgan");
  //     }

  //     if (
  //       req.body.type === "order_expense" &&
  //       req.body.from === "client" &&
  //       order?.totalPrice - totalPaymentSum < req.body.amount
  //     ) {
  //       return response.error(
  //         res,
  //         `ortiqcha summa kiritildi, ${
  //           order?.totalPrice - totalPaymentSum
  //         } summa qoldi`
  //       );
  //     }

  //     const newExpense = await Expense.create({
  //       ...req.body,
  //       part_id: order?.part_id,
  //     });
  //     return response.created(res, "Xarajat qo'shildi", newExpense);
  //   } catch (error) {
  //     return response.error(res, error.message, error);
  //   }
  // }

  // yoqilgi quyish uchun

  async create(req, res) {
    try {
      const { order_id, type, from, amount, currency_id } = req.body;

      let orderTotalBase = 0;
      let order = null;
      let orderRate = 0;

      if (type === "repair") {
        order = await Order.findOne({ _id: order_id, deleted: false });
      }

      if (type !== "repair" && type !== "office_expense") {
        if (!order_id || !type || !from || !amount || !currency_id) {
          return response.error(res, "Ma'lumotlar to'liq emas");
        }

        // 1️⃣ Orderni topamiz (valyutasi bilan)
        order = await Order.findOne({
          _id: order_id,
          deleted: false,
        }).populate("currency_id", "name rate");

        if (!order) {
          return response.notFound(res, "Buyurtma topilmadi");
        }

        // 2️⃣ order_expense va from !== client bo'lsa → faqat FINISHED bo'lmagan orderga qo'shish
        if (type === "order_expense" && from !== "client") {
          if (order.state === "finished") {
            return response.error(
              res,
              "Yakunlangan buyurtmaga xarajat qo'shib bo'lmaydi"
            );
          }
          // part_id ni orderdan olamiz
          req.body.part_id = order.part_id;
        }
        // 3️⃣ Order umumiy summasini USD ga o‘tkazamiz
        orderRate =
          order.currency_id && order.currency_id.rate
            ? order.currency_id.rate
            : 1;
        orderTotalBase = order.totalPrice / orderRate; // USD
      }
      // 4️⃣ Shu order bo'yicha CLIENT to'lovlarini USD da hisoblaymiz
      const totalPayments = await Expense.find({
        order_id,
        type: "order_expense",
        deleted: false,
        from: "client",
      }).populate("currency_id", "rate");

      let totalPaymentBase = 0; // USD
      for (const exp of totalPayments) {
        const expRate =
          exp.currency_id && exp.currency_id.rate ? exp.currency_id.rate : 1;
        totalPaymentBase += exp.amount / expRate;
      }

      if (type !== "repair" && type !== "office_expense" && from === "client") {
        // 5️⃣ Order allaqachon to'liq to'langan bo'lsa
        if (totalPaymentBase >= orderTotalBase) {
          return response.error(res, "Buyurtma to'ldirilgan");
        }
      }

      // 6️⃣ Yangi kiritilayotgan summani ham USD ga o‘tkazamiz
      const newCurrency = await Currency.findById(currency_id).select("rate");
      const newRate = newCurrency && newCurrency.rate ? newCurrency.rate : 1;
      const newAmountBase = amount / newRate; // USD

      // Faqat client to'lovi bo'lsa overpay tekshiruv
      if (type === "order_expense" && from === "client") {
        const afterPaymentBase = totalPaymentBase + newAmountBase;

        if (afterPaymentBase > orderTotalBase) {
          // Qolgan summa USD da
          const remainingBase = orderTotalBase - totalPaymentBase;

          // Qolgan summani ORDER valyutasida ko'rsatamiz
          const remainingInOrderCurrency = remainingBase * orderRate;

          return response.error(
            res,
            `Ortiqcha summa kiritildi, ${
              Math.round(remainingInOrderCurrency * 100) / 100
            } summa qoldi`
          );
        }
      }

      if (req.body.receiverModel === "drivers") {
        req.body.receiver = order.driver;
      }
      req.body.client_id = order?.partner || null;

      // 7️⃣ Xarajatni yaratamiz (part_id ni orderdan olamiz)
      const newExpense = await Expense.create({
        ...req.body,
        part_id: order?.part_id || null,
      });

      return response.created(res, "Xarajat qo'shildi", newExpense);
    } catch (error) {
      return response.error(res, error.message, error);
    }
  }

  async createFuelExpense(req, res) {
    try {
      const { order_id } = req.body;
      const order = await Order.findOne({
        _id: order_id,
        state: { $ne: "finished" },
        deleted: false,
      });

      if (!order) {
        return response.notFound(res, "Buyurtma topilmadi");
      }

      const newExpense = await Expense.create({
        ...req.body,
        order_id,
        from: "expense",
        type: "order_expense",
        category: "fuels",
        part_id: order?.part_id,
      });
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
