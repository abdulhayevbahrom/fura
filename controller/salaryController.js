// controllers/salaryController.js
const Salary = require("../model/salaryModel");
const Drivers = require("../model/driversModel");
const Orders = require("../model/orderModel");
const Currency = require("../model/currencyModel");
const Expenses = require("../model/expensesModel");
const mongoose = require("mongoose");
const response = require("../utils/response");

async function convertToBase(amount, currency_id) {
  const currency = await Currency.findById(currency_id).lean();
  if (!currency || currency.deleted || !currency.status) {
    throw new Error("Valyuta topilmadi yoki faol emas");
  }
  if (!currency.rate || currency.rate <= 0) {
    throw new Error("Valyuta kursi noto'g'ri");
  }

  const amount_base = amount / currency.rate;
  return { amount_base, currency };
}

/**
 * HAR OYDA:
 * salary > 0 va currency_id bor bo'lgan xodimlar uchun
 * oylikni balansga qo'shadi.
 *
 * month: 'YYYY-MM' formatida (masalan '2025-03')
 *
 * E'tibor: bitta xodimga bitta oy uchun faqat 1 marta 'oylik' yozadi.
 */
async function accrueMonthlySalaryForAll(month) {
  // Oylik stavkasi bor xodimlar (usta, manager, boshqalar)
  const employees = await Drivers.find({
    is_deleted: false,
    salary: { $gt: 0 },
    currency_id: { $ne: null },
  });

  if (!employees.length) return { count: 0 };

  let successCount = 0;

  for (const emp of employees) {
    // Shu oy uchun allaqachon oylik yozilganmi?
    const exists = await Salary.exists({
      driver: emp._id,
      type: "oylik",
      month: month,
    });

    if (exists) {
      // bu xodimga shu oy allaqachon oylik yozilgan, skip
      continue;
    }

    // amount_base hisoblash
    const { amount_base } = await convertToBase(emp.salary, emp.currency_id);

    // Salary logiga yozamiz (type: 'oylik')
    await Salary.create({
      driver: emp._id,
      amount: emp.salary,
      currency_id: emp.currency_id,
      amount_base,
      type: "oylik", // balansga +
      paymentType: null,
      month,
      description: `Oylik accrual: ${month}`,
    });

    // Balansga + (bazaviy valyutada)
    emp.balance = (emp.balance || 0) + amount_base;
    await emp.save();

    successCount++;
  }

  return { count: successCount };
}

class SalaryController {
  /**
   * Barcha tranzaksiyalar ro'yhati (order/oylik/payment/avans)
   * Query:
   *   from, to (date)
   *   driver (id)
   *   type: 'order' | 'oylik' | 'payment' | 'avans'
   */
  async getAllPayments(req, res) {
    try {
      let { from, to, driver, type } = req.query;
      let filter = {};

      if (from && to) {
        filter.createdAt = {
          $gte: new Date(new Date(from).setHours(0, 0, 0)),
          $lte: new Date(new Date(to).setHours(23, 59, 59)),
        };
      }

      if (driver) filter.driver = driver;
      if (type) filter.type = type;

      const payments = await Salary.find(filter)
        .populate("currency_id", "name rate")
        .populate("driver", "firstName lastName phone role")
        .populate("order_id", "title");

      if (!payments.length)
        return response.notFound(res, "Ma'lumotlar topilmadi", []);

      return response.success(res, "Ma'lumotlar topildi", payments);
    } catch (error) {
      return response.serverError(res, error.message, error);
    }
  }

  /**
   * Xodimlar ro'yhati (haydovchi, usta, manager hammasi)
   */
  async getDrivers(req, res) {
    try {
      const drivers = await Drivers.find({ is_deleted: false })
        .select("firstName lastName phone salary balance role")
        .populate("currency_id", "name rate");

      if (!drivers.length)
        return response.notFound(res, "Ma'lumotlar topilmadi", []);

      return response.success(res, "Ma'lumotlar topildi", drivers);
    } catch (error) {
      return response.serverError(res, error.message, error);
    }
  }

  /**
   * Xodimga pul berish / avans berish
   * body:
   *   driver: ObjectId
   *   amount: Number
   *   currency_id: ObjectId
   *   type: 'payment' | 'avans'
   *   paymentType: 'naqd' | 'karta'
   *   description: String
   *   month: 'YYYY-MM' (ixtiyoriy)
   *
   * Natija:
   *   Salary ga yoziladi, driver.balance -= amount_base
   */
  async paymentToDriver(req, res) {
    const session = await mongoose.startSession();

    try {
      const {
        driver,
        amount,
        currency_id,
        type,
        paymentType,
        description,
        month,
      } = req.body;

      if (!driver || !amount || !currency_id || !type) {
        return response.error(res, "Ma'lumotlar to'liq emas");
      }

      // bonusni ham ruxsat etamiz
      if (!["payment", "avans", "oylik", "bonus"].includes(type)) {
        return response.error(
          res,
          "type faqat 'payment', 'avans', 'oylik' va 'bonus' bo'lishi mumkin"
        );
      }

      // Transaction boshlaymiz
      session.startTransaction();

      // Xodimni session bilan o'qiymiz
      const emp = await Drivers.findById(driver).session(session);
      if (!emp || emp.is_deleted) {
        await session.abortTransaction();
        session.endSession();
        return response.error(res, "Xodim topilmadi");
      }

      // Valyutani bazaviyga konvert qilish (USD)
      const { amount_base } = await convertToBase(amount, currency_id);

      // Salary yozish
      const salary = await Salary.create(
        [
          {
            driver,
            amount,
            currency_id,
            amount_base,
            type, // 'payment' | 'avans' | 'bonus'
            paymentType,
            description,
            month,
          },
        ],
        { session }
      );

      if (!salary || !salary[0]) {
        await session.abortTransaction();
        session.endSession();
        return response.error(res, "Ma'lumotlar saqlanmadi");
      }

      // Agar BONUS bo'lsa – expenses ga ham yozamiz, lekin balance ga TEGMAYMIZ
      if (type === "bonus") {
        await Expenses.create(
          [
            {
              name: `${emp.firstName} ${emp.lastName} bonus berildi`,
              amount: amount,
              currency_id,
              description:
                description || `${emp.firstName} ${emp.lastName} bonus berildi`,
              paymentType: paymentType,
              category: "bonus",
              type: "office_expense",
              from: "expense", // agar sendagi schema shunday bo'lsa
              deleted: false,
            },
          ],
          { session }
        );
      }

      // Balansdan pul chiqaramiz – faqat payment va avans uchun
      if (type !== "bonus") {
        emp.balance = (emp.balance || 0) - amount_base;
        await emp.save({ session });
      }

      // Hammasi muvaffaqiyatli – commit
      await session.commitTransaction();
      session.endSession();

      return response.success(res, "Ma'lumotlar saqlandi", salary[0]);
    } catch (error) {
      // xatolik bo'lsa hammasini bekor qilamiz
      try {
        await session.abortTransaction();
      } catch {}
      session.endSession();
      return response.serverError(res, error.message, error);
    }
  }

  /**
   * Bitta xodim bo'yicha tranzaksiyalar tarixi
   */
  async getPaymentByDriverId(req, res) {
    try {
      const { id } = req.params;

      const payments = await Salary.find({ driver: id })
        .populate("currency_id", "name rate")
        .populate("order_id", "title");

      if (!payments.length)
        return response.notFound(res, "Ma'lumotlar topilmadi", []);

      return response.success(res, "Ma'lumotlar topildi", payments);
    } catch (error) {
      return response.serverError(res, error.message, error);
    }
  }

  /**
   * (ixtiyoriy) – Admin paneldan qo'l bilan oylik accrual qilish uchun endpoint
   * body: { month: 'YYYY-MM' }
   */
  async accrueMonthlySalary(req, res) {
    try {
      const { month } = req.body;
      if (!month) {
        return response.error(res, "month (YYYY-MM) kiritish kerak");
      }

      const result = await accrueMonthlySalaryForAll(month);
      return response.success(res, "Oyliklar balansga qo'shildi", {
        month,
        count: result.count,
      });
    } catch (error) {
      return response.serverError(res, error.message, error);
    }
  }

  /**
   * ZAKAZ TUGAGANDA haydovchi balansiga zakazdan chiqadigan oylikni qo'shish
   * Bundan express route emas, ichki servis sifatida foydalanasan.
   */
  async addOrderSalaryToDriver(orderId) {
    const order = await Orders.findById(orderId);
    if (!order) throw new Error("Zakaz topilmadi");

    if (
      !order.driver ||
      !order.driver_salary ||
      !order.driver_salary_currency_id
    ) {
      // haydovchi yoki summa belgilanmagan
      return;
    }

    if (order.driver_salary_paid) {
      // allaqachon yozilgan bo'lsa
      return;
    }

    const driverObj = await Drivers.findById(order.driver);
    if (!driverObj || driverObj.is_deleted) {
      throw new Error("Haydovchi topilmadi");
    }

    const { amount_base } = await convertToBase(
      order.driver_salary,
      order.driver_salary_currency_id
    );

    // Salary logiga yozamiz
    await Salary.create({
      driver: order.driver,
      order_id: order._id,
      amount: order.driver_salary,
      currency_id: order.driver_salary_currency_id,
      amount_base,
      type: "order", // balans +
      paymentType: null,
      description: `Zakazdan oylik #${order._id}`,
    });

    // Balansga +
    driverObj.balance = (driverObj.balance || 0) + amount_base;
    order.driver_salary_paid = true;

    await Promise.all([driverObj.save(), order.save()]);
  }
}

module.exports = new SalaryController();
