const Cars = require("../model/carModel");
const response = require("../utils/response");
const Expenses = require("../model/expensesModel");
const mongoose = require("mongoose");

class carsController {
  async getAllCars(req, res) {
    try {
      const cars = await Cars.aggregate([
        {
          $project: {
            title: 1,
            number: 1,
            year: 1,
            fuelFor100km: 1,
            probeg: 1,
            licens: 1,
            sugurta: 1,
            status: 1,
            image: {
              $cond: {
                if: { $ifNull: ["$image", false] },
                then: { $concat: ["/cars-image/", "$image"] },
                else: null,
              },
            },
          },
        },
      ]);

      if (!cars.length) {
        return response.notFound(res, "Mashinalar topilmadi", []);
      }

      return response.success(res, "Mashinalar topildi", cars);
    } catch (error) {
      return response.serverError(res, "Server Error", error);
    }
  }

  async getCarById(req, res) {
    try {
      const car = await Cars.aggregate([
        {
          $match: { _id: new mongoose.Types.ObjectId(req.params.id) }, // "new" qo'shildi
        },
        {
          $project: {
            title: 1,
            number: 1,
            year: 1,
            fuelFor100km: 1,
            probeg: 1,
            licens: 1,
            sugurta: 1,
            status: 1,
            image: {
              $cond: {
                if: { $ifNull: ["$image", false] },
                then: { $concat: ["/cars-image/", "$image"] },
                else: null,
              },
            },
          },
        },
      ]);

      if (!car.length) {
        return response.notFound(res, "Mashina topilmadi");
      }

      return response.success(res, "Mashina topildi", car[0]);
    } catch (error) {
      return response.serverError(res, error.message, error);
    }
  }

  // create
  async createCar(req, res) {
    try {
      // check number
      let car = await Cars.findOne({ number: req.body.number });
      if (car) return response.error(res, "Mashina raqami mavjud");
      const newCar = await Cars.create({ ...req.body, image: req.body.image });
      return response.created(res, "Mashina qo'shildi", newCar);
    } catch (error) {
      return response.serverError(res, error.message, error);
    }
  }

  // delete
  async deleteCar(req, res) {
    try {
      const car = await Cars.findByIdAndDelete(req.params.id);
      if (!car) return response.notFound(res, "Mashina topilmadi");
      return response.success(res, "Mashina o'chirildi", car);
    } catch (error) {
      return response.serverError(res, error.message, error);
    }
  }

  // update
  async updateCar(req, res) {
    try {
      const { id } = req.params;
      // check number
      let car = await Cars.findOne({
        number: req.body.number,
        _id: { $ne: id },
      });
      if (car) return response.error(res, "Mashina raqami mavjud");
      const updatedCar = await Cars.findByIdAndUpdate(id, req.body, {
        new: true,
      });
      if (!updatedCar) return response.notFound(res, "Mashina topilmadi");
      return response.success(res, "Mashina yangilandi", updatedCar);
    } catch (error) {
      return response.serverError(res, error.message, error);
    }
  }

  // ============================================
  // VEHICLES (GILDIRAKLAR) OPERATSIYALARI
  // ============================================

  // Gildirak qo'shish
  async changeVehicles(req, res) {
    // Transaction uchun session yaratish
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const { carId, vehicles, paymentType } = req.body;

      let drive = await Cars.findById(carId).session(session);
      if (!drive) {
        await session.abortTransaction();
        session.endSession();
        return response.notFound(res, "Mashina topilmadi");
      }

      if (vehicles?.right_front) {
        drive.vehicles.right_front.unshift(vehicles.right_front);
        const newVehicleId = drive.vehicles.right_front[0]._id;

        await Expenses.create(
          [
            {
              vehicleId: newVehicleId,
              name: vehicles.right_front.name,
              amount: vehicles.right_front.price,
              description: "oldi o'ng gildirak o'zgartirildi",
              car: carId,
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
        drive.vehicles.left_front.unshift(vehicles.left_front);
        const newVehicleId = drive.vehicles.left_front[0]._id;

        await Expenses.create(
          [
            {
              vehicleId: newVehicleId,
              name: vehicles.left_front.name,
              amount: vehicles.left_front.price,
              description: "oldi chap gildirak o'zgartirildi",
              car: carId,
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
        drive.vehicles.right_back.unshift(vehicles.right_back);
        const newVehicleId = drive.vehicles.right_back[0]._id;

        await Expenses.create(
          [
            {
              vehicleId: newVehicleId,
              name: vehicles.right_back.name,
              amount: vehicles.right_back.price,
              description: "orqa o'ng gildirak o'zgartirildi",
              car: carId,
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
        drive.vehicles.left_back.unshift(vehicles.left_back);
        const newVehicleId = drive.vehicles.left_back[0]._id;

        await Expenses.create(
          [
            {
              vehicleId: newVehicleId,
              name: vehicles.left_back.name,
              amount: vehicles.left_back.price,
              description: "orqa chap gildirak o'zgartirildi",
              car: carId,
              quantity: 1,
              category: "vehicle",
              type: "repair",
              paymentType: paymentType,
            },
          ],
          { session }
        );
      }

      if (vehicles?.back_right_in) {
        drive.vehicles.back_right_in.unshift(vehicles.back_right_in);
        const newVehicleId = drive.vehicles.back_right_in[0]._id;

        await Expenses.create(
          [
            {
              vehicleId: newVehicleId,
              name: vehicles.back_right_in.name,
              amount: vehicles.back_right_in.price,
              description: "orqa o'ng ichki gildirak o'zgartirildi",
              car: carId,
              quantity: 1,
              category: "vehicle",
              type: "repair",
              paymentType: paymentType,
            },
          ],
          { session }
        );
      }

      if (vehicles?.back_left_in) {
        drive.vehicles.back_left_in.unshift(vehicles.back_left_in);
        const newVehicleId = drive.vehicles.back_left_in[0]._id;

        await Expenses.create(
          [
            {
              vehicleId: newVehicleId,
              name: vehicles.back_left_in.name,
              amount: vehicles.back_left_in.price,
              description: "orqa chap ichki gildirak o'zgartirildi",
              car: carId,
              quantity: 1,
              category: "vehicle",
              type: "repair",
              paymentType: paymentType,
            },
          ],
          { session }
        );
      }

      await drive.save({ session });

      // Hammasi muvaffaqiyatli bo'lsa commit qilish
      await session.commitTransaction();
      session.endSession();

      return response.success(res, "Gildirak qo'shildi", drive);
    } catch (error) {
      // Xatolik bo'lsa hamma o'zgarishlarni bekor qilish
      await session.abortTransaction();
      session.endSession();
      return response.serverError(res, error.message, error);
    }
  }

  async updateVehicle(req, res) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const { carId, vehicles } = req.body;

      let car = await Cars.findById(carId).session(session);
      if (!car) {
        await session.abortTransaction();
        session.endSession();
        return response.notFound(res, "Mashina topilmadi");
      }

      // O'ng old gildirak
      if (vehicles?.right_front) {
        let vehicleIndex = car.vehicles.right_front.findIndex(
          (v) => v._id.toString() === vehicles.right_front._id
        );

        if (vehicleIndex !== -1) {
          car.vehicles.right_front[vehicleIndex].name =
            vehicles.right_front.name ||
            car.vehicles.right_front[vehicleIndex].name;
          car.vehicles.right_front[vehicleIndex].price =
            vehicles.right_front.price ||
            car.vehicles.right_front[vehicleIndex].price;

          await Expenses.findOneAndUpdate(
            {
              vehicleId: vehicles.right_front._id,
              type: "repair",
              category: "vehicle",
            },
            {
              name: car.vehicles.right_front[vehicleIndex].name,
              amount: car.vehicles.right_front[vehicleIndex].price,
            },
            { new: true, session }
          );
        }
      }

      // Chap old gildirak
      if (vehicles?.left_front) {
        let vehicleIndex = car.vehicles.left_front.findIndex(
          (v) => v._id.toString() === vehicles.left_front._id
        );

        if (vehicleIndex !== -1) {
          car.vehicles.left_front[vehicleIndex].name =
            vehicles.left_front.name ||
            car.vehicles.left_front[vehicleIndex].name;
          car.vehicles.left_front[vehicleIndex].price =
            vehicles.left_front.price ||
            car.vehicles.left_front[vehicleIndex].price;

          await Expenses.findOneAndUpdate(
            {
              vehicleId: vehicles.left_front._id,
              type: "repair",
              category: "vehicle",
            },
            {
              name: car.vehicles.left_front[vehicleIndex].name,
              amount: car.vehicles.left_front[vehicleIndex].price,
            },
            { new: true, session }
          );
        }
      }

      // O'ng orqa gildirak
      if (vehicles?.right_back) {
        let vehicleIndex = car.vehicles.right_back.findIndex(
          (v) => v._id.toString() === vehicles.right_back._id
        );

        if (vehicleIndex !== -1) {
          car.vehicles.right_back[vehicleIndex].name =
            vehicles.right_back.name ||
            car.vehicles.right_back[vehicleIndex].name;
          car.vehicles.right_back[vehicleIndex].price =
            vehicles.right_back.price ||
            car.vehicles.right_back[vehicleIndex].price;

          await Expenses.findOneAndUpdate(
            {
              vehicleId: vehicles.right_back._id,
              type: "repair",
              category: "vehicle",
            },
            {
              name: car.vehicles.right_back[vehicleIndex].name,
              amount: car.vehicles.right_back[vehicleIndex].price,
            },
            { new: true, session }
          );
        }
      }

      // Chap orqa gildirak
      if (vehicles?.left_back) {
        let vehicleIndex = car.vehicles.left_back.findIndex(
          (v) => v._id.toString() === vehicles.left_back._id
        );

        if (vehicleIndex !== -1) {
          car.vehicles.left_back[vehicleIndex].name =
            vehicles.left_back.name ||
            car.vehicles.left_back[vehicleIndex].name;
          car.vehicles.left_back[vehicleIndex].price =
            vehicles.left_back.price ||
            car.vehicles.left_back[vehicleIndex].price;

          await Expenses.findOneAndUpdate(
            {
              vehicleId: vehicles.left_back._id,
              type: "repair",
              category: "vehicle",
            },
            {
              name: car.vehicles.left_back[vehicleIndex].name,
              amount: car.vehicles.left_back[vehicleIndex].price,
            },
            { new: true, session }
          );
        }
      }

      // O'ng ichki gildirak
      if (vehicles?.back_right_in) {
        let vehicleIndex = car.vehicles.back_right_in.findIndex(
          (v) => v._id.toString() === vehicles.back_right_in._id
        );

        if (vehicleIndex !== -1) {
          car.vehicles.back_right_in[vehicleIndex].name =
            vehicles.back_right_in.name ||
            car.vehicles.back_right_in[vehicleIndex].name;
          car.vehicles.back_right_in[vehicleIndex].price =
            vehicles.back_right_in.price ||
            car.vehicles.back_right_in[vehicleIndex].price;

          await Expenses.findOneAndUpdate(
            {
              vehicleId: vehicles.back_right_in._id,
              type: "repair",
              category: "vehicle",
            },
            {
              name: car.vehicles.back_right_in[vehicleIndex].name,
              amount: car.vehicles.back_right_in[vehicleIndex].price,
            },
            { new: true, session }
          );
        }
      }

      // Chap ichki gildirak
      if (vehicles?.back_left_in) {
        let vehicleIndex = car.vehicles.back_left_in.findIndex(
          (v) => v._id.toString() === vehicles.back_left_in._id
        );

        if (vehicleIndex !== -1) {
          car.vehicles.back_left_in[vehicleIndex].name =
            vehicles.back_left_in.name ||
            car.vehicles.back_left_in[vehicleIndex].name;
          car.vehicles.back_left_in[vehicleIndex].price =
            vehicles.back_left_in.price ||
            car.vehicles.back_left_in[vehicleIndex].price;

          await Expenses.findOneAndUpdate(
            {
              vehicleId: vehicles.back_left_in._id,
              type: "repair",
              category: "vehicle",
            },
            {
              name: car.vehicles.back_left_in[vehicleIndex].name,
              amount: car.vehicles.back_left_in[vehicleIndex].price,
            },
            { new: true, session }
          );
        }
      }

      // MUHIM: Car ni saqlash
      await car.save({ session });

      // Hammasi muvaffaqiyatli bo'lsa commit
      await session.commitTransaction();
      session.endSession();

      return response.success(res, "Gildirak yangilandi", car);
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      return response.serverError(res, error.message, error);
    }
  }

  // ============================================
  // CPU OPERATSIYALARI
  // ============================================

  // CPU qo'shish
  // CPU qo'shish
  async addCPU(req, res) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const { carId, cpu, paymentType } = req.body;

      let drive = await Cars.findById(carId).session(session);
      if (!drive) {
        await session.abortTransaction();
        session.endSession();
        return response.notFound(res, "Mashina topilmadi");
      }

      drive.cpu.unshift(cpu);
      const newCpuId = drive.cpu[drive.cpu.length - 1]._id;

      // Expense log for the new CPU
      await Expenses.create(
        [
          {
            cpuId: newCpuId,
            name: `${cpu.marka} ${cpu.model}`,
            amount: cpu.price || 0,
            description: "Yangi CPU qo'shildi",
            car: carId,
            quantity: 1,
            category: "cpu",
            type: "repair",
            paymentType: paymentType,
          },
        ],
        { session }
      );

      await drive.save({ session });

      await session.commitTransaction();
      session.endSession();

      return response.success(res, "CPU qo'shildi", drive);
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      return response.serverError(res, error.message, error);
    }
  }

  // CPU yangilash
  async updateCPU(req, res) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const { carId, cpu, paymentType } = req.body;

      // Find the car by ID with session
      const car = await Cars.findById(carId).session(session);
      if (!car) {
        await session.abortTransaction();
        session.endSession();
        return response.notFound(res, "Mashina topilmadi");
      }

      // Find the CPU by ID
      const cpuIndex = car.cpu.findIndex(
        (c) => c._id.toString() === cpu?.cpuId
      );
      if (cpuIndex === -1) {
        await session.abortTransaction();
        session.endSession();
        return response.notFound(res, "CPU topilmadi");
      }

      const existingCpu = car.cpu[cpuIndex];

      // Update CPU fields if provided
      const fieldsToUpdate = ["marka", "model", "year", "number", "price"];
      fieldsToUpdate.forEach((field) => {
        if (cpu[field] !== undefined) {
          existingCpu[field] = cpu[field];
        }
      });

      // Update or create an expense log for the updated CPU
      await Expenses.findOneAndUpdate(
        {
          cpuId: cpu.cpuId,
          type: "repair",
          category: "cpu",
        },
        {
          name: `${existingCpu.marka} ${existingCpu.model}`,
          amount: existingCpu.price || 0,
          description: "CPU ma'lumotlari yangilandi",
          paymentType: paymentType,
        },
        { new: true, upsert: true, session }
      );

      // Save the updated car
      await car.save({ session });

      // Commit the transaction
      await session.commitTransaction();
      session.endSession();

      return response.success(res, "CPU ma'lumotlari yangilandi", car);
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      return response.serverError(res, error.message, error);
    }
  }
}

module.exports = new carsController();
