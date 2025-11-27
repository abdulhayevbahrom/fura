const responses = require("../utils/response");
const Orders = require("../model/orderModel");
const mongoose = require("mongoose");
const Drivers = require("../model/driversModel");
const Cars = require("../model/carModel");
const Parts = require("../model/partModel");
const Trailers = require("../model/trailerModel");
const Expenses = require("../model/expensesModel");

class OrderController {
  async getOrders(req, res) {
    try {
      const { status } = req.query;

      const filter = { deleted: false };
      if (status) filter.status = status;

      const orders = await Orders.find(filter)
        .populate("driver", "firstName lastName")
        .populate("car", "title number")
        .populate("trailer", "number")
        .populate("partner", "fullname")
        .populate("part_id", "name")
        .populate("currency_id", "name rate")
        .populate("driver_salary_currency_id", "name rate")
        .sort({ createdAt: -1 });

      if (!orders.length) {
        return responses.notFound(res, "Buyurtmalar topilmadi");
      }

      return responses.success(res, "Buyurtmalar topildi", orders);
    } catch (err) {
      return responses.serverError(res, err.message, err);
    }
  }

  // by id
  async getOrderById(req, res) {
    try {
      const { id } = req.params;
      const order = await Orders.findOne({ _id: id, deleted: false });
      if (!order) return responses.notFound(res, "Buyurtma topilmadi");
      return responses.success(res, "Buyurtma topildi", order);
    } catch (err) {
      return responses.serverError(res, err.message, err);
    }
  }

  // get by driver id
  async getOrdersByDriverId(req, res) {
    try {
      const { driver_id } = req.params;
      const driver = await Drivers.findOne({
        _id: driver_id,
        // is_active: true,
      });
      if (!driver) return responses.notFound(res, "Haydovchi topilmadi");
      const orders = await Orders.find({
        driver: driver_id,
        deleted: false,
        state: { $ne: "finished" },
      });
      if (!orders.length)
        return responses.notFound(res, "Buyurtmalar topilmadi");
      return responses.success(res, "Buyurtmalar topildi", orders);
    } catch (err) {
      return responses.serverError(res, err.message, err);
    }
  }

  // create
  async createOrder(req, res) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      let { part_name, deposit, ...rest } = req.body;
      let part_id = req.body.part_id;

      // Agar part_id kiritilmagan bo'lsa, part_name orqali yangi partiya yaratamiz
      if (!part_id && part_name) {
        const existingPart = await Parts.findOne({
          name: part_name.trim(),
        }).session(session);

        if (existingPart) {
          // Agar partiya nomi mavjud bo'lsa, xatolik qaytariladi
          await session.abortTransaction();
          session.endSession();
          return responses.warning(res, "Bunday partiya nomi mavjud");
        }

        // Yangi partiya yaratish
        const newPart = await Parts.create(
          [
            {
              name: part_name.trim(),
              avarage_fuel: req.body.avarage_fuel,
              start_fuel: req.body.start_fuel,
              start_probeg: req.body.start_probeg,
              driver: req.body.driver,
            },
          ],
          {
            session,
          }
        );
        if (!newPart || !newPart[0]?._id) {
          await session.abortTransaction();
          session.endSession();
          return responses.error(res, "Partiya qo‘shilmadi");
        }
        part_id = newPart[0]._id;
        if (deposit > 0) {
          await Expenses.create(
            [
              {
                name: "Deposit kirim " + part_name.trim(),
                amount: deposit,
                currency_id: req.body.deposit_currency_id,
                from: "owner",
                order_id: null,
                part_id: part_id,
                description: "Deposit kirim " + part_name.trim() + " uchun",
                paymentType: req.body.deposit_paymentType,
                category: "deposit",
                type: "order_expense",
              },
            ],
            { session }
          );
        }
      }

      // Mavjud partiyani olish
      const part = await Parts.findById(part_id).session(session);
      if (!part) {
        await session.abortTransaction();
        session.endSession();
        return responses.error(res, "Partiya topilmadi");
      }

      if (part.status === "finished") {
        await session.abortTransaction();
        session.endSession();
        return responses.warning(res, "Partiya yopilgan");
      }

      // Buyurtma yaratish
      const newOrder = await Orders.create(
        [{ ...rest, part_id, state: "accepted" }],
        { session }
      );

      if (!newOrder || !newOrder[0]) {
        await session.abortTransaction();
        session.endSession();
        return responses.error(res, "Buyurtma qo‘shilmadi");
      }

      // Mashina holatini yangilash
      if (newOrder[0].car) {
        await Cars.findByIdAndUpdate(
          newOrder[0].car,
          { status: false },
          { session }
        );
      }

      // Haydovchi holatini yangilash
      if (newOrder[0].driver) {
        await Drivers.findByIdAndUpdate(
          newOrder[0].driver,
          { is_active: false },
          { session }
        );
      }

      // Tirkama holatini yangilash
      if (newOrder[0].trailer) {
        await Trailers.findByIdAndUpdate(
          newOrder[0].trailer,
          { status: false },
          { session }
        );
      }

      // Hammasi muvaffaqiyatli bo'lsa, tranzaksiyani tasdiqlash
      await session.commitTransaction();
      session.endSession();

      return responses.created(res, "Buyurtma qo'shildi", newOrder[0]);
    } catch (err) {
      // Xatolik yuz bersa, tranzaksiyani bekor qilish
      await session.abortTransaction();
      session.endSession();
      return responses.serverError(res, err.message, err);
    }
  }

  // create order by part_id
  async createOrderByPartId(req, res) {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      let { part_id } = req.body;

      let part = await Parts.findById(part_id).session(session);
      if (!part) return responses.error(res, "Partiya topilmadi");
      if (part.status === "finished")
        return responses.warning(res, "Partiya yopilgan");

      let order = await Orders.findOne({
        part_id,
        deleted: false,
      }).session(session);
      if (!order) return responses.error(res, "Buyurtma topilmadi");

      let newData = {
        ...req.body,
        part_id,
        driver: order.driver,
        car: order.car,
        trailer: order.trailer,
      };

      const newOrder = await Orders.create([newData], { session });

      if (!newOrder || !newOrder[0]) {
        await session.abortTransaction();
        session.endSession();
        return responses.error(res, "Buyurtma qo‘shilmadi");
      }

      // Hammasi muvaffaqiyatli bo‘ldi
      await session.commitTransaction();
      session.endSession();

      return responses.created(res, "Buyurtma qo'shildi", newOrder[0]);
    } catch (err) {
      responses.serverError(res, err.message, err);
    }
  }

  // update
  async updateOrder(req, res) {
    try {
      const { id } = req.params;

      // Faqat deleted: false bo‘lgan buyurtmalarni yangilaymiz
      const order = await Orders.findOneAndUpdate(
        { _id: id, deleted: false },
        req.body,
        { new: true }
      );

      if (!order)
        return responses.error(
          res,
          "Buyurtma topilmadi yoki o‘zgartirib bo‘lmaydi"
        );

      return responses.success(res, "Buyurtma o‘zgartirildi", order);
    } catch (err) {
      return responses.serverError(res, err.message, err);
    }
  }

  // change status
  async changeState(req, res) {
    try {
      const { id } = req.params;
      if (
        !["pending", "accepted", "rejected", "finished"].includes(
          req.body.state
        )
      ) {
        return responses.warning(
          res,
          "Noto'g'ri holat kiritildi, quyidagilardan biri bo'lsin [pending, accepted, rejected,finished]",
          ["pending", "accepted", "rejected", "finished"]
        );
      }
      // const order = await Orders.findByIdAndUpdate(id, req.body, { new: true });
      const order = await Orders.findOneAndUpdate(
        { _id: id, deleted: false },
        req.body,
        { new: true }
      );

      if (!order) {
        return responses.error(
          res,
          "Buyurtma topilmadi yoki o‘zgartirib bo‘lmaydi"
        );
      }

      // update car probeg
      if (req.body.state === "finished") {
        if (order.car) {
          const car = await Cars.findById(order.car);
          if (car) {
            car.probeg = (car.probeg || 0) + (order.distance || 0);
            await car.save();
          }
        }
      }

      return responses.success(res, "Buyurtma o'zgartirildi", order);
    } catch (err) {
      return responses.serverError(res, err.message, err);
    }
  }
  // delete
  async deleteOrder(req, res) {
    try {
      const { id } = req.params;
      const order = await Orders.findByIdAndUpdate(
        id,
        { deleted: true },
        { new: true }
      );
      if (!order) return responses.error(res, "Buyurtma o'chirilmadi");
      return responses.success(res, "Buyurtma o'chirildi", order);
    } catch (err) {
      return responses.serverError(res, err.message, err);
    }
  }

  // get by car id
  async getOrdersByCarId(req, res) {
    try {
      const { id, startDate, endDate } = req.params;
      let filter = { car: id, deleted: false };

      if (startDate && endDate) {
        filter.createdAt = {
          $gte: new Date(new Date(startDate).setHours(0, 0, 0)),
          $lte: new Date(new Date(endDate).setHours(23, 59, 59)),
        };
      }
      const orders = await Orders.find(filter)
        .populate("driver", "firstName lastName")
        .populate("car", "title number")
        .populate("trailer", "number")
        .populate("partner", "fullname")
        .populate("part_id", "name");
      if (!orders.length)
        return responses.notFound(res, "Buyurtmalar topilmadi", []);
      return responses.success(res, "Buyurtmalar topildi", orders);
    } catch (err) {
      return responses.serverError(res, err.message, err);
    }
  }

  // get pending orders
  async getPendingOrders(req, res) {
    try {
      const orders = await Orders.find({ state: "pending", deleted: false })
        .populate("driver", "firstName lastName")
        .populate("car", "title number")
        .populate("trailer", "number")
        .populate("partner", "fullname")
        .populate("part_id", "name")
        .sort({ createdAt: -1 });
      if (!orders.length)
        return responses.notFound(res, "Buyurtmalar topilmadi", []);
      return responses.success(res, "Buyurtmalar topildi", orders);
    } catch (err) {
      return responses.serverError(res, err.message, err);
    }
  }
}

module.exports = new OrderController();
