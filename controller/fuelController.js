const response = require("../utils/response");
const Fuel = require("../model/fuelModel");

class FuelController {
  async getFuels(req, res) {
    try {
      const fuels = await Fuel.find();
      if (!fuels.length) return response.notFound(res, "Fuels topilmadi");
      return response.success(res, "Fuels", fuels);
    } catch (error) {
      return response.error(res, error.message, error);
    }
  }

  async create(req, res) {
    try {
      let { name, from, to } = req.body;
      if (!name || !from || !to) {
        return response.error(res, "Malumotlar to'liq emas");
      }
      const newFuel = await Fuel.create(req.body);
      if (!newFuel) return response.error(res, "Malumotlar saqlanmadi");
      return response.created(res, "Muvaffaqiyatli saqlandi", newFuel);
    } catch (error) {
      return response.serverError(res, error.message, error);
    }
  }

  async update(req, res) {
    try {
      const { id } = req.params;
      const updatedFuel = await Fuel.findByIdAndUpdate(id, req.body, {
        new: true,
      });
      if (!updatedFuel) return response.notFound(res, "Fuel topilmadi");
      return response.success(res, "Fuel yangilandi", updatedFuel);
    } catch (error) {
      return response.serverError(res, error.message, error);
    }
  }

  async delete(req, res) {
    try {
      const fuel = await Fuel.findByIdAndUpdate(req.params.id, {
        deleted: true,
      });
      if (!fuel) return response.notFound(res, "Fuel topilmadi");
      return response.success(res, "Muvaffaqiyatli o'chirildi", fuel);
    } catch (error) {
      return response.serverError(res, error.message, error);
    }
  }
}

module.exports = new FuelController();
