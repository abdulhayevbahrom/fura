const Salary = require("../model/salaryModel");
const Driver = require("../model/driversModel");
const Order = require("../model/orderModel");
const response = require("../utils/response");
const moment = require("moment");
const Parts = require("../model/partModel");

class SalaryController {
  async payToDriver(req, res) {
    try {
      const { driver } = req.body;

      const exact_driver = await Driver.findById(driver);
      if (!exact_driver) return response.notFound(res, "Haydovchi topilmadi");

      let saved = await Salary.create(req.body);

      return response.created(res, "Muvaffaqiyatli saqlandi", saved);
    } catch (err) {
      response.serverError(res, err.message, err);
    }
  }

  async getAllPaymetns(req, res) {
    try {
      const payments = await Salary.find()
        .populate("driver")
        .sort({ createdAt: -1 });
      if (!payments.length)
        return response.notFound(res, "To'lovlar topilmadi");
      return response.success(res, "To'lovlar topildi", payments);
    } catch (err) {
      response.serverError(res, err.message, err);
    }
  }

  async getByDriverId(req, res) {
    try {
      const { driver } = req.params;
      const driver_payments = await Salary.find({ driver }).populate("driver");
      if (!driver_payments.length)
        return response.notFound(res, "To'lovlar topilmadi");
      return response.success(res, "To'lovlar topildi", driver_payments);
    } catch (err) {
      response.serverError(res, err.message, err);
    }
  }


  async getDrivers(req, res) {
    try {
      let month = req.query.month
        ? req.query.month
        : moment().format("YYYY-MM");

      const startOfMonth = moment(month, "YYYY-MM").startOf("month").toDate();
      const endOfMonth = moment(month, "YYYY-MM").endOf("month").toDate();

      // Barcha ishchilarni olish
      const drivers = await Driver.find(
        { is_deleted: false },
        {
          password: 0,
          is_active: 0,
          is_deleted: 0,
          __v: 0,
          status: 0,
          balance: 0,
          login: 0,
        }
      );

      if (!drivers.length) {
        return response.notFound(res, "Foydalanuvchilar topilmadi", []);
      }

      const parts = await Parts.find({
        createdAt: { $gte: startOfMonth, $lte: endOfMonth },
      });

      let data = [];

      for (let driver of drivers) {
        // To‘lovlarni olish
        const driver_payments = await Salary.find({
          driver: driver._id,
          month,
        });

        const totalPaymentsFromDB = driver_payments.reduce(
          (acc, payment) => acc + (payment.amount || 0),
          0
        );

        let result = {
          ...driver._doc,
          totalPayments: totalPaymentsFromDB,
          totalDebt: driver.salary - totalPaymentsFromDB,
          partDebts: [],
        };

        // faqat haydovchilar uchun partiyalarni hisoblash
        if (driver.role === "driver") {
          for (let part of parts) {
            const orders = await Order.find({
              driver: driver._id,
              part_id: part._id,
              // createdAt: { $gte: startOfMonth, $lte: endOfMonth },
              // state: "finished",
            });

            const totalDriverSalary = orders.reduce(
              (acc, order) => acc + (order.driver_salary || 0),
              0
            );

            const partPayments = await Salary.find({
              driver: driver._id,
              part_id: part._id,
            });

            const totalPaidAmount = partPayments.reduce(
              (acc, payment) => acc + (payment.amount || 0),
              0
            );

            const debt = totalDriverSalary - totalPaidAmount;

            if (totalDriverSalary > 0 || totalPaidAmount > 0) {
              result.partDebts.push({
                part_id: part._id,
                part_name: part.name || part._id,
                totalDriverSalary,
                totalPaidAmount,
                debt: debt > 0 ? debt : 0,
              });
            }
          }

          // 🔹 faqat role === "driver" bo'lganlarda umumiy yig‘indilarni yangilaymiz
          result.totalPayments = result.partDebts.reduce(
            (acc, p) => acc + (p.totalPaidAmount || 0),
            0
          );
          result.totalDebt = result.partDebts.reduce(
            (acc, p) => acc + (p.debt || 0),
            0
          );
        }

        data.push(result);
      }

      return response.success(res, "Foydalanuvchilar topildi", data);
    } catch (err) {
      return response.error(res, err.message, err);
    }
  }
}

module.exports = new SalaryController();
