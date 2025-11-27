const Cars = require("../model/carModel");
const response = require("../utils/response");
const Expenses = require("../model/expensesModel");
const mongoose = require("mongoose");

class carsController {
  async getAllCars(req, res) {
    try {
      const cars = await Cars.aggregate([
        { $match: { deleted: { $ne: true } } }, // <-- faqat deleted=false
        {
          $project: {
            title: 1,
            number: 1,
            year: 1,
            fuelFor100km: 1,
            probeg: 1,
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

  // get car vehicles
  async getCarVehicles(req, res) {
    try {
      const car = await Cars.findOne({ _id: req.params.id })
        .select("vehicles")
        .populate([
          { path: "vehicles.right_front.currency_id" },
          { path: "vehicles.left_front.currency_id" },
          { path: "vehicles.right_back.currency_id" },
          { path: "vehicles.left_back.currency_id" },
          { path: "vehicles.back_right_in.currency_id" },
          { path: "vehicles.back_left_in.currency_id" },
          { path: "vehicles.additional_left.currency_id" },
          { path: "vehicles.additional_right.currency_id" },
          { path: "vehicles.extra_tir.currency_id" },
        ]);

      if (!car) {
        return response.notFound(res, "Mashina gildiraklari topilmadi", []);
      }

      return response.success(res, "Mashina gildiraklari", car.vehicles);
    } catch (error) {
      return response.serverError(res, error.message, error);
    }
  }

  // get car cpu
  async getCarCpu(req, res) {
    try {
      const car = await Cars.findOne({ _id: req.params.id })
        .select("cpu")
        .populate("cpu.currency_id");
      if (!car) {
        return response.notFound(res, "Mashina microsxemasi topilmadi", []);
      }
      return response.success(res, "Mashina microsxemasi", car?.cpu);
    } catch (error) {
      return response.serverError(res, error.message, error);
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
      // const car = await Cars.findByIdAndDelete(req.params.id);
      const car = await Cars.findByIdAndUpdate(req.params.id, {
        deleted: true,
      });
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
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const { carId, vehicles = {}, paymentType } = req.body;

      let drive = await Cars.findById(carId).session(session);
      if (!drive) {
        await session.abortTransaction();
        session.endSession();
        return response.notFound(res, "Mashina topilmadi");
      }

      let DESCRIPTIONS = {
        right_front: "oldi o'ng gildirak o'zgartirildi",
        left_front: "oldi chap gildirak o'zgartirildi",
        right_back: "oldi o'ng gildirak o'zgartirildi",
        left_back: "oldi chap gildirak o'zgartirildi",
        back_right_in: "oldi o'ng gildirak o'zgartirildi",
        back_left_in: "oldi chap gildirak o'zgartirildi",
        additional_left: "oldi chap gildirak o'zgartirildi",
        additional_right: "oldi o'ng gildirak o'zgartirildi",
        extra_tir: "oldi chap gildirak o'zgartirildi",
      };

      for (const [pos, vehicleData] of Object.entries(vehicles)) {
        if (!vehicleData) continue;

        if (!drive.vehicles?.[pos]) continue;

        drive.vehicles[pos].unshift(vehicleData);
        const newVehicleId = drive.vehicles[pos][0]._id;

        await Expenses.create(
          [
            {
              vehicleId: newVehicleId,
              name: vehicleData.name,
              amount: vehicleData.price,
              currency_id: vehicleData.currency_id,
              description: DESCRIPTIONS[pos],
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

      // Yagona maydonlar ro'yxati
      const fields = [
        "right_front",
        "left_front",
        "right_back",
        "left_back",
        "back_right_in",
        "back_left_in",
        "additional_left",
        "additional_right",
        "extra_tir",
      ];

      for (const field of fields) {
        if (!vehicles[field]) continue; // agar bu field jo'natilmagan bo'lsa skip

        let arr = car.vehicles[field];
        if (!Array.isArray(arr)) continue;

        let updatedItem = vehicles[field];

        let idx = arr.findIndex((v) => v._id.toString() === updatedItem._id);
        if (idx === -1) continue;

        // Update name
        arr[idx].name = updatedItem.name || arr[idx].name;

        // Update price
        arr[idx].price = updatedItem.price || arr[idx].price;

        // update currency_id
        arr[idx].currency_id = updatedItem.currency_id || arr[idx].currency_id;

        // Expense update
        await Expenses.findOneAndUpdate(
          {
            vehicleId: updatedItem._id,
            type: "repair",
            category: "vehicle",
          },
          {
            name: arr[idx].name,
            amount: arr[idx].price,
          },
          { new: true, session }
        );
      }

      // Car ni saqlash
      await car.save({ session });

      await session.commitTransaction();
      session.endSession();

      return response.success(res, "Gildiraklar yangilandi", car);
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
  async addCPU(req, res) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const { carId, cpu, paymentType } = req.body;

      let car = await Cars.findById(carId).session(session);
      if (!car) {
        await session.abortTransaction();
        session.endSession();
        return response.notFound(res, "Mashina topilmadi");
      }

      car.cpu.unshift(cpu);
      const newCpuId = car.cpu[0]._id;

      // Expense log for the new CPU
      await Expenses.create(
        [
          {
            cpuId: newCpuId,
            name: `${cpu.marka} ${cpu.model}`,
            amount: cpu.price || 0,
            currency_id: cpu.currency_id,
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

      await car.save({ session });

      await session.commitTransaction();
      session.endSession();

      return response.success(res, "CPU qo'shildi", car.cpu[0]);
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
      const fieldsToUpdate = [
        "marka",
        "model",
        "year",
        "number",
        "price",
        "currency_id",
      ];
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
          currency_id: existingCpu.currency_id,
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

  async getStatictics(req, res) {
    try {
      let { startDate, endDate } = req.query;
      let matchStage = { deleted: { $ne: true } };

      if (startDate && endDate) {
        matchStage.createdAt = {
          $gte: new Date(new Date(startDate).setHours(0, 0, 0)),
          $lte: new Date(new Date(endDate).setHours(23, 59, 59)),
        };
      }

      const data = await Cars.aggregate([
        {
          $match: matchStage,
        },
        {
          $lookup: {
            from: "orders",
            localField: "_id",
            foreignField: "car",
            as: "orders",
            pipeline: [
              { $match: { deleted: false } },
              {
                $lookup: {
                  from: "expenses",
                  localField: "_id",
                  foreignField: "order_id",
                  as: "order_expenses",
                  pipeline: [
                    { $match: { type: "order_expense", deleted: false } },
                    { $project: { amount: 1 } },
                  ],
                },
              },
              {
                $project: {
                  totalPrice: 1,
                  driver_salary: 1,
                  order_expenses: 1,
                },
              },
            ],
          },
        },
        {
          $lookup: {
            from: "expenses",
            localField: "_id",
            foreignField: "car",
            as: "repairs",
            pipeline: [
              { $match: { type: "repair", deleted: false } },
              { $project: { amount: 1 } },
            ],
          },
        },
        {
          $addFields: {
            totalOrders: { $size: "$orders" },
            totalPrice: { $sum: "$orders.totalPrice" },
            driverSalary: { $sum: "$orders.driver_salary" },
            totalRepairPrice: { $sum: "$repairs.amount" },
            totalOrderExpense: {
              $sum: {
                $map: {
                  input: "$orders.order_expenses",
                  as: "expList",
                  in: { $sum: "$$expList.amount" },
                },
              },
            },
          },
        },
        {
          $addFields: {
            totalExpenses: {
              $add: [
                "$totalRepairPrice",
                "$totalOrderExpense",
                "$driverSalary",
              ],
            },
            profit: {
              $subtract: [
                "$totalPrice",
                { $add: ["$totalRepairPrice", "$driverSalary"] },
              ],
            },
          },
        },
        {
          $project: {
            vehicles: 0,
            cpu: 0,
            orders: 0,
            repairs: 0,
            totalOrderExpense: 0,
          },
        },
        {
          $addFields: {
            car: {
              _id: "$_id",
              title: "$title",
              number: "$number",
              year: "$year",
              fuelFor100km: "$fuelFor100km",
              probeg: "$probeg",
              licens: "$licens",
              sugurta: "$sugurta",
              status: "$status",
              createdAt: "$createdAt",
              updatedAt: "$updatedAt",
              __v: "$__v",
            },
          },
        },
        {
          $project: {
            _id: 0,
            title: 0,
            number: 0,
            year: 0,
            fuelFor100km: 0,
            probeg: 0,
            licens: 0,
            sugurta: 0,
            status: 0,
            createdAt: 0,
            updatedAt: 0,
            __v: 0,
          },
        },
      ]);

      if (!data.length)
        return response.notFound(res, "Ma'lumotlar topilmadi", []);

      return response.success(res, "Ma'lumotlar", data);
    } catch (error) {
      return response.serverError(res, error.message, error);
    }
  }
}

module.exports = new carsController();
