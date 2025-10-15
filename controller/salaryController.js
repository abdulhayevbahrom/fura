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
      const payments = await Salary.find().populate("driver");
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

  // async getDrivers(req, res) {
  //   try {
  //     let month = req.query.month
  //       ? req.query.month
  //       : moment().format("YYYY-MM");
  //     const drivers = await Driver.find(
  //       { is_deleted: false },
  //       {
  //         password: 0,
  //         is_active: 0,
  //         is_deleted: 0,
  //         role: 0,
  //         __v: 0,
  //         role: 0,
  //         status: 0,
  //         balance: 0,
  //         login: 0,
  //       }
  //     );

  //     if (!drivers.length)
  //       return response.notFound(res, "Haydovchilar topilmadi", []);

  //     let data = [];

  //     for (let driver of drivers) {
  //       const driver_payments = await Salary.find({
  //         driver: driver._id,
  //         month,
  //       });
  //       let total = driver_payments.reduce((acc, payment) => {
  //         return acc + payment.amount;
  //       }, 0);

  //       // for drivers
  //       let parts = await Parts.find({ createdAt: { $gte: new Date(month) } });
  //       let total_part_id = parts.map((part) => part._id);

  //       let orders = await Order.find({
  //         driver: driver._id,
  //         part_id: { $in: total_part_id },
  //         state: { $ne: "finished" },
  //       });

  //       data.push({
  //         ...driver._doc,
  //         totalPayments: total,
  //         debt: driver.salary - total,
  //       });
  //     }

  //     return response.success(res, "Haydovchilar topildi", data);
  //   } catch (err) {
  //     return response.error(res, err.message, err);
  //   }
  // }
  async getDrivers(req, res) {
    try {
      let month = req.query.month
        ? req.query.month
        : moment().format("YYYY-MM");

      // Haydovchilar va boshqa ishchilarni olish
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

      let data = [];
      const startOfMonth = moment(month, "YYYY-MM").startOf("month").toDate();
      const endOfMonth = moment(month, "YYYY-MM").endOf("month").toDate();

      // Faqat haydovchilar uchun partiyalarni olish
      const parts = await Parts.find({
        createdAt: { $gte: startOfMonth, $lte: endOfMonth },
      });

      for (let driver of drivers) {
        // To'lovlarni olish (barcha foydalanuvchilar uchun)
        const driver_payments = await Salary.find({
          driver: driver._id,
          month,
        });
        const totalPayments = driver_payments.reduce((acc, payment) => {
          return acc + (payment.amount || 0);
        }, 0);

        let result = {
          ...driver._doc,
          totalPayments,
          totalDebt: driver.salary - totalPayments, // Umumiy qarz (barcha uchun)
          partDebts: [], // Faqat haydovchilar uchun
        };

        // Agar foydalanuvchi haydovchi bo'lsa
        if (driver.role === "driver") {
          for (let part of parts) {
            // Yakunlangan partiyaga tegishli buyurtmalarni olish
            const orders = await Order.find({
              driver: driver._id,
              part_id: part._id,
              createdAt: { $gte: startOfMonth, $lte: endOfMonth },
              state: "finished", // Faqat yakunlangan buyurtmalar
            });

            // Buyurtmalardagi driver_salary summasini hisoblash
            const totalDriverSalary = orders.reduce((acc, order) => {
              return acc + (order.driver_salary || 0);
            }, 0);

            // Ushbu partiya bo'yicha to'langan summalarni olish
            const partPayments = await Salary.find({
              driver: driver._id,
              part_id: part._id,
            });

            const totalPaidAmount = partPayments.reduce((acc, payment) => {
              return acc + (payment.amount || 0);
            }, 0);

            // Qarzni hisoblash
            const debt = totalDriverSalary - totalPaidAmount;

            if (totalDriverSalary > 0 || totalPaidAmount > 0) {
              result.partDebts.push({
                part_id: part._id,
                part_name: part.name || part._id,
                totalDriverSalary, // Partiyadagi buyurtmalar summasi
                totalPaidAmount, // To'langan summa
                debt: debt > 0 ? debt : 0, // Qarz (faqat musbat bo'lsa)
              });
            }
          }
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
