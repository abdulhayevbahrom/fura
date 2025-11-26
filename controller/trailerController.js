const response = require("../utils/response");
const Trailers = require("../model/trailerModel");
const Expenses = require("../model/expensesModel");
const mongoose = require("mongoose");

class trailerController {
  async getAllTrailers(req, res) {
    try {
      const trailers = await Trailers.find({ deleted: false });
      if (!trailers.length)
        return response.notFound(res, "Pritseplar topilmadi", []);
      return response.success(res, "Pritseplar topildi", trailers);
    } catch (error) {
      return response.serverError(res, "Server Error", error);
    }
  }

  async createTrailer(req, res) {
    try {
      // check number
      let trailer = await Trailers.findOne({ number: req.body.number });
      if (trailer) return response.error(res, "Pritsep raqami mavjud");
      const newTrailer = await Trailers.create(req.body);
      return response.created(res, "Pritsep qo'shildi", newTrailer);
    } catch (error) {
      return response.serverError(res, error.message, error);
    }
  }

  async deleteTrailer(req, res) {
    try {
      // const trailer = await Trailers.findByIdAndDelete(req.params.id);
      const trailer = await Trailers.findByIdAndUpdate(req.params.id, {
        deleted: true,
      });
      if (!trailer) return response.notFound(res, "Pritsep topilmadi");
      return response.success(res, "Pritsep o'chirildi", trailer);
    } catch (error) {
      return response.serverError(res, error.message, error);
    }
  }

  async updateTrailer(req, res) {
    try {
      // check number
      let trailer = await Trailers.findOne({
        number: req.body.number,
        _id: { $ne: req.params.id },
      });
      if (trailer) return response.error(res, "Pritsep raqami mavjud");
      const updated_trailer = await Trailers.findByIdAndUpdate(
        req.params.id,
        req.body,
        {
          new: true,
        }
      );
      if (!updated_trailer) return response.notFound(res, "Pritsep topilmadi");
      return response.success(res, "Pritsep yangilandi", updated_trailer);
    } catch (error) {
      return response.serverError(res, error.message, error);
    }
  }

  async changeVehicles(req, res) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const { trailerId, vehicles = {}, paymentType } = req.body;

      const trailer = await Trailers.findById(trailerId).session(session);
      if (!trailer) {
        await session.abortTransaction();
        session.endSession();
        return response.notFound(res, "Pritsep topilmadi");
      }

      // Barcha pozitsiyalar description map’lari
      const DESCRIPTIONS = {
        left_front: "oldi chap g'ildirak o'zgartirildi",
        left_front_2: "oldi chap (2) g'ildirak o'zgartirildi",

        right_front: "oldi o'ng g'ildirak o'zgartirildi",
        right_front_2: "oldi o'ng (2) g'ildirak o'zgartirildi",

        left_back: "orqa chap g'ildirak o'zgartirildi",
        left_back_2: "orqa chap (2) g'ildirak o'zgartirildi",

        right_back: "orqa o'ng g'ildirak o'zgartirildi",
        right_back_2: "orqa o'ng (2) g'ildirak o'zgartirildi",

        left_center: "o'rta chap g'ildirak o'zgartirildi",
        left_center_2: "o'rta chap (2) g'ildirak o'zgartirildi",

        right_center: "o'rta o'ng g'ildirak o'zgartirildi",
        right_center_2: "o'rta o'ng (2) g'ildirak o'zgartirildi",

        extra_tir: "zaxira g'ildirak o'zgartirildi",
      };

      // vehicles obyektini loop qilish
      for (const [pos, vehicleData] of Object.entries(vehicles)) {
        if (!vehicleData) continue;

        // trailer schema’da bormi?
        if (!trailer.vehicles?.[pos]) continue;

        // 1) yangi balon qo‘shish
        trailer.vehicles[pos].unshift(vehicleData);

        const newVehicleId = trailer.vehicles[pos][0]._id;

        // 2) Expenses yozish
        await Expenses.create(
          [
            {
              vehicleId: newVehicleId,
              name: vehicleData.name,
              amount: vehicleData.price,
              currency_id: vehicleData.currency_id,
              description:
                DESCRIPTIONS[pos] || `${pos} g'ildirak o'zgartirildi`,
              trailer: trailerId,
              quantity: 1,
              category: "vehicle",
              type: "repair",
              paymentType,
            },
          ],
          { session }
        );
      }

      await trailer.save({ session });
      await session.commitTransaction();
      session.endSession();

      return response.success(res, "G'ildiraklar o'zgartirildi", trailer);
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      return response.serverError(res, error.message, error);
    }
  }

  async updateVehicle(req, res) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const { trailerId, vehicles = {} } = req.body;

      const trailer = await Trailers.findById(trailerId).session(session);
      if (!trailer) {
        await session.abortTransaction();
        session.endSession();
        return response.notFound(res, "Pritsep topilmadi");
      }

      // Schema’dagi barcha pozitsiyalar ro‘yxati
      const POSITIONS = [
        "left_front",
        "left_front_2",
        "right_front",
        "right_front_2",
        "left_back",
        "left_back_2",
        "right_back",
        "right_back_2",
        "left_center",
        "left_center_2",
        "right_center",
        "right_center_2",
        "extra_tir",
      ];

      for (const pos of POSITIONS) {
        const v = vehicles[pos];

        if (!v || !v._id) continue; // request’da bu pozitsiya yo‘q bo‘lsa

        const list = trailer.vehicles[pos];
        if (!Array.isArray(list) || list.length === 0) continue;

        const idx = list.findIndex(
          (item) => item._id.toString() === v._id.toString()
        );
        if (idx === -1) continue;

        // Eski qiymatni saqlab qolish prinsipini saqlaymiz
        list[idx].name = v.name || list[idx].name;
        list[idx].price = v.price || list[idx].price;
        list[idx].currency_id = v.currency_id || list[idx].currency_id;

        // Expenses dagi mos yozuvni ham yangilaymiz
        const updateData = {};
        if (v.name) updateData.name = v.name;
        if (v.price) updateData.amount = v.price;

        if (Object.keys(updateData).length > 0) {
          await Expenses.findOneAndUpdate(
            {
              vehicleId: v._id,
              type: "repair",
              category: "vehicle",
            },
            {
              name: v.name,
              amount: v.price,
              currency_id: v.currency_id,
            },
            { session }
          );
        }
      }

      await trailer.save({ session });
      await session.commitTransaction();
      session.endSession();

      return response.success(res, "Pritsep o'zgartirildi", trailer);
    } catch (error) {
      await session.abortTransaction().catch(() => {});
      session.endSession();
      return response.serverError(res, error.message, error);
    }
  }
}

module.exports = new trailerController();
