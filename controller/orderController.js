const responses = require("../utils/response");
const Orders = require("../model/orderModel");
const mongoose = require("mongoose");
const Drivers = require("../model/driversModel");
const Cars = require("../model/carModel");
const Trailers = require("../model/trailerModel");
const Parts = require("../model/partModel");

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
        .populate("part_id", "name");

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
        is_active: true,
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
      let { part_id, part_name, ...rest } = req.body;

      // Agar part_id kelsa — mavjud partiyani ishlatamiz
      if (!part_id && part_name) {
        const existingPart = await Parts.findOne({
          name: part_name.trim(),
        }).session(session);

        if (existingPart) {
          // Agar partiya nomi mavjud bo‘lsa — xatolik bilan chiqamiz
          await session.abortTransaction();
          session.endSession();
          return responses.warning(res, "Bunday partiya nomi mavjud");
        }

        // Yangi partiya yaratamiz
        const newPart = await Parts.create([{ name: part_name.trim() }], {
          session,
        });
        if (!newPart || !newPart[0]?._id) {
          await session.abortTransaction();
          session.endSession();
          return responses.error(res, "Partiya qo‘shilmadi");
        }

        part_id = newPart[0]._id;
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

      // Hammasi muvaffaqiyatli bo‘ldi
      await session.commitTransaction();
      session.endSession();

      return responses.created(res, "Buyurtma qo'shildi", newOrder[0]);
    } catch (err) {
      await session.abortTransaction();
      session.endSession();
      return responses.serverError(res, err.message, err);
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
}

module.exports = new OrderController();
