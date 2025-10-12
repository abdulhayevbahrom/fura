const response = require("../utils/response");
const Trailers = require("../model/trailerModel");
const Expenses = require("../model/expensesModel");
const mongoose = require("mongoose");

class trailerController {
  async getAllTrailers(req, res) {
    try {
      const trailers = await Trailers.find();
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
      const trailer = await Trailers.findByIdAndDelete(req.params.id);
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
    // Transaction uchun session yaratish
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const { trailerId, vehicles, paymentType } = req.body;
      const trailer = await Trailers.findById(trailerId).session(session);
      if (!trailer) {
        await session.abortTransaction();
        session.endSession();
        return response.notFound(res, "Pritsep topilmadi");
      }

      if (vehicles?.right_front) {
        trailer.vehicles.right_front.unshift(vehicles.right_front);
        const newVehicleId = trailer.vehicles.right_front[0]._id;

        await Expenses.create(
          [
            {
              vehicleId: newVehicleId,
              name: vehicles.right_front.name,
              amount: vehicles.right_front.price,
              description: "oldi o'ng gildirak o'zgartirildi",
              trailer: trailerId,
              quantity: 1,
              category: "vehicle",
              type: "repair",
              paymentType: paymentType,
            },
          ],
          { session }
        );
      }

      if (vehicles?.left_front) {
        trailer.vehicles.left_front.unshift(vehicles.left_front);
        const newVehicleId = trailer.vehicles.left_front[0]._id;

        await Expenses.create(
          [
            {
              vehicleId: newVehicleId,
              name: vehicles.left_front.name,
              amount: vehicles.left_front.price,
              description: "oldi chap gildirak o'zgartirildi",
              trailer: trailerId,
              quantity: 1,
              category: "vehicle",
              type: "repair",
              paymentType: paymentType,
            },
          ],
          { session }
        );
      }

      if (vehicles?.right_back) {
        trailer.vehicles.right_back.unshift(vehicles.right_back);
        const newVehicleId = trailer.vehicles.right_back[0]._id;

        await Expenses.create(
          [
            {
              vehicleId: newVehicleId,
              name: vehicles.right_back.name,
              amount: vehicles.right_back.price,
              description: "orqa o'ng gildirak o'zgartirildi",
              trailer: trailerId,
              quantity: 1,
              category: "vehicle",
              type: "repair",
              paymentType: paymentType,
            },
          ],
          { session }
        );
      }

      if (vehicles?.left_back) {
        trailer.vehicles.left_back.unshift(vehicles.left_back);
        const newVehicleId = trailer.vehicles.left_back[0]._id;

        await Expenses.create(
          [
            {
              vehicleId: newVehicleId,
              name: vehicles.left_back.name,
              amount: vehicles.left_back.price,
              description: "orqa chap gildirak o'zgartirildi",
              trailer: trailerId,
              quantity: 1,
              category: "vehicle",
              type: "repair",
              paymentType: paymentType,
            },
          ],
          { session }
        );
      }

      if (vehicles.right_center) {
        trailer.vehicles.right_center.unshift(vehicles.right_center);
        const newVehicleId = trailer.vehicles.right_center[0]._id;

        await Expenses.create(
          [
            {
              vehicleId: newVehicleId,
              name: vehicles.right_center.name,
              amount: vehicles.right_center.price,
              description: "orta o'ng gildirak o'zgartirildi",
              trailer: trailerId,
              quantity: 1,
              category: "vehicle",
              type: "repair",
              paymentType: paymentType,
            },
          ],
          { session }
        );
      }

      if (vehicles.left_center) {
        trailer.vehicles.left_center.unshift(vehicles.left_center);
        const newVehicleId = trailer.vehicles.left_center[0]._id;

        await Expenses.create(
          [
            {
              vehicleId: newVehicleId,
              name: vehicles.left_center.name,
              amount: vehicles.left_center.price,
              description: "orta chap gildirak o'zgartirildi",
              trailer: trailerId,
              quantity: 1,
              category: "vehicle",
              type: "repair",
              paymentType: paymentType,
            },
          ],
          { session }
        );
      }

      await trailer.save({ session });
      await session.commitTransaction();
      session.endSession();
      return response.success(res, "Gildiraklar o'zgartirildi", trailer);
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
      const { trailerId, vehicles } = req.body;

      const trailer = await Trailers.findById(trailerId).session(session);
      if (!trailer) {
        await session.abortTransaction();
        session.endSession();
        return response.notFound(res, "Pritsep topilmadi");
      }

      if (vehicles?.right_front) {
        let vehicleIndex = trailer.vehicles.right_front.findIndex(
          (v) => v._id.toString() === vehicles.right_front._id
        );

        if (vehicleIndex !== -1) {
          trailer.vehicles.right_front[vehicleIndex].name =
            vehicles.right_front.name ||
            trailer.vehicles.right_front[vehicleIndex].name;
          trailer.vehicles.right_front[vehicleIndex].price =
            vehicles.right_front.price ||
            trailer.vehicles.right_front[vehicleIndex].price;

          await Expenses.findOneAndUpdate(
            {
              vehicleId: vehicles.right_front._id,
              type: "repair",
              category: "vehicle",
            },
            {
              name: vehicles.right_front.name,
              amount: vehicles.right_front.price,
            },
            { session }
          );
        }
      }

      if (vehicles?.left_front) {
        let vehicleIndex = trailer.vehicles.left_front.findIndex(
          (v) => v._id.toString() === vehicles.left_front._id
        );

        if (vehicleIndex !== -1) {
          trailer.vehicles.left_front[vehicleIndex].name =
            vehicles.left_front.name ||
            trailer.vehicles.left_front[vehicleIndex].name;
          trailer.vehicles.left_front[vehicleIndex].price =
            vehicles.left_front.price ||
            trailer.vehicles.left_front[vehicleIndex].price;

          await Expenses.findOneAndUpdate(
            {
              vehicleId: vehicles.left_front._id,
              type: "repair",
              category: "vehicle",
            },
            {
              name: vehicles.left_front.name,
              amount: vehicles.left_front.price,
            },
            { session }
          );
        }
      }

      if (vehicles?.right_back) {
        let vehicleIndex = trailer.vehicles.right_back.findIndex(
          (v) => v._id.toString() === vehicles.right_back._id
        );

        if (vehicleIndex !== -1) {
          trailer.vehicles.right_back[vehicleIndex].name =
            vehicles.right_back.name ||
            trailer.vehicles.right_back[vehicleIndex].name;
          trailer.vehicles.right_back[vehicleIndex].price =
            vehicles.right_back.price ||
            trailer.vehicles.right_back[vehicleIndex].price;

          await Expenses.findOneAndUpdate(
            {
              vehicleId: vehicles.right_back._id,
              type: "repair",
              category: "vehicle",
            },
            {
              name: vehicles.right_back.name,
              amount: vehicles.right_back.price,
            },
            { session }
          );
        }
      }

      if (vehicles?.left_back) {
        let vehicleIndex = trailer.vehicles.left_back.findIndex(
          (v) => v._id.toString() === vehicles.left_back._id
        );

        if (vehicleIndex !== -1) {
          trailer.vehicles.left_back[vehicleIndex].name =
            vehicles.left_back.name ||
            trailer.vehicles.left_back[vehicleIndex].name;
          trailer.vehicles.left_back[vehicleIndex].price =
            vehicles.left_back.price ||
            trailer.vehicles.left_back[vehicleIndex].price;

          await Expenses.findOneAndUpdate(
            {
              vehicleId: vehicles.left_back._id,
              type: "repair",
              category: "vehicle",
            },
            {
              name: vehicles.left_back.name,
              amount: vehicles.left_back.price,
            },
            { session }
          );
        }
      }

      if (vehicles?.right_center) {
        let vehicleIndex = trailer.vehicles.right_center.findIndex(
          (v) => v._id.toString() === vehicles.right_center._id
        );

        if (vehicleIndex !== -1) {
          trailer.vehicles.right_center[vehicleIndex].name =
            vehicles.right_center.name ||
            trailer.vehicles.right_center[vehicleIndex].name;
          trailer.vehicles.right_center[vehicleIndex].price =
            vehicles.right_center.price ||
            trailer.vehicles.right_center[vehicleIndex].price;

          await Expenses.findOneAndUpdate(
            {
              vehicleId: vehicles.right_center._id,
              type: "repair",
              category: "vehicle",
            },
            {
              name: vehicles.right_center.name,
              amount: vehicles.right_center.price,
            },
            { session }
          );
        }
      }

      if (vehicles?.left_center) {
        let vehicleIndex = trailer.vehicles.left_center.findIndex(
          (v) => v._id.toString() === vehicles.left_center._id
        );

        if (vehicleIndex !== -1) {
          trailer.vehicles.left_center[vehicleIndex].name =
            vehicles.left_center.name ||
            trailer.vehicles.left_center[vehicleIndex].name;
          trailer.vehicles.left_center[vehicleIndex].price =
            vehicles.left_center.price ||
            trailer.vehicles.left_center[vehicleIndex].price;

          await Expenses.findOneAndUpdate(
            {
              vehicleId: vehicles.left_center._id,
              type: "repair",
              category: "vehicle",
            },
            {
              name: vehicles.left_center.name,
              amount: vehicles.left_center.price,
            },
            { session }
          );
        }
      }

      await trailer.save();

      await session.commitTransaction();
      session.endSession();

      return response.success(res, "Pritsep o'zgartirildi", trailer);
    } catch (error) {
      return response.serverError(res, error.message, error);
    }
  }
}

module.exports = new trailerController();
