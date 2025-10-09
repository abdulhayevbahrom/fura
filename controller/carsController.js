const Cars = require("../model/carModel");
const response = require("../utils/response");

class carsController {
  async getAllCars(req, res) {
    try {
      const cars = await Cars.find();
      if (!cars.length)
        return response.notFound(res, "Mashinalar topilmadi", []);
      return response.success(res, "Mashinalar topildi", cars);
    } catch (error) {
      return response.serverError(res, "Server Error", error);
    }
  }

  async getCarById(req, res) {
    try {
      const car = await Cars.findById(req.params.id);
      if (!car) return response.notFound(res, "Mashina topilmadi");
      return response.success(res, "Mashina topildi", car);
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
      const newCar = await Cars.create(req.body);
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
      // check number

      let car = await Cars.findOne({
        number: req.body.number,
        _id: { $ne: req.params.id },
      });
      if (car) return response.error(res, "Mashina raqami mavjud");

      const updated_car = await Cars.findByIdAndUpdate(
        req.params.id,
        req.body,
        {
          new: true,
        }
      );
      if (!updated_car) return response.notFound(res, "Mashina topilmadi");
      return response.success(res, "Mashina yangilandi", updated_car);
    } catch (error) {
      return response.serverError(res, error.message, error);
    }
  }

  async changeVehicles(req, res) {
    try {
      const { carId, vehicles } = req.body;

      let drive = await Cars.findById(carId);
      if (!drive) return response.notFound(res, "Mashina topilmadi");
      if (vehicles.right_front) {
        drive.vehicles.right_front.push(vehicles.right_front);
      }
      if (vehicles.left_front) {
        drive.vehicles.left_front.push(vehicles.left_front);
      }
      if (vehicles.right_back) {
        drive.vehicles.right_back.push(vehicles.right_back);
      }
      if (vehicles.left_back) {
        drive.vehicles.left_back.push(vehicles.left_back);
      }
      if (vehicles.back_right_in) {
        drive.vehicles.back_right_in.push(vehicles.back_right_in);
      }
      if (vehicles.back_left_in) {
        drive.vehicles.back_left_in.push(vehicles.back_left_in);
      }
      await drive.save();
      return response.success(res, "Mashina malumotlari o'zgartirildi", drive);
    } catch (error) {
      return response.serverError(res, error.message, error);
    }
  }
}

module.exports = new carsController();
