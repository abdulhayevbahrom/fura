const Drives = require("../model/carModel");
const response = require("../utils/response");

class carsController {
  async getAllCars(req, res) {
    try {
      const drives = await Drives.find();
      if (!drives.length)
        return response.notFound(res, "Mashinalar topilmadi", []);
      return response.success(res, "Mashinalar topildi", drives);
    } catch (error) {
      return response.serverError(res, "Server Error", error);
    }
  }

  async getCarById(req, res) {
    try {
      const drive = await Drives.findById(req.params.id);
      if (!drive) return response.notFound(res, "Mashina topilmadi");
      return response.success(res, "Mashina topildi", drive);
    } catch (error) {
      return response.serverError(res, error.message, error);
    }
  }

  // create
  async createCar(req, res) {
    try {
      // check number
      let drive = await Drives.findOne({ number: req.body.number });
      if (drive) return response.error(res, "Mashina raqami mavjud");
      const newDrive = await Drives.create(req.body);
      return response.created(res, "Mashina qo'shildi", newDrive);
    } catch (error) {
      return response.serverError(res, error.message, error);
    }
  }

  // delete
  async deleteCar(req, res) {
    try {
      const drive = await Drives.findByIdAndDelete(req.params.id);
      if (!drive) return response.notFound(res, "Mashina topilmadi");
      return response.success(res, "Mashina o'chirildi", drive);
    } catch (error) {
      return response.serverError(res, error.message, error);
    }
  }

  // update
  async updateCar(req, res) {
    try {
      // check number

      let drive = await Drives.findOne({
        number: req.body.number,
        _id: { $ne: req.params.id },
      });
      if (drive) return response.error(res, "Mashina raqami mavjud");

      const updated_drive = await Drives.findByIdAndUpdate(
        req.params.id,
        req.body,
        {
          new: true,
        }
      );
      if (!updated_drive) return response.notFound(res, "Mashina topilmadi");
      return response.success(res, "Mashina yangilandi", updated_drive);
    } catch (error) {
      return response.serverError(res, error.message, error);
    }
  }
}

module.exports = new carsController();
