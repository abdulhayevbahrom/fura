const response = require("../utils/response");
const Currency = require("../model/currencyModel");

class currencyController {
  async getAll(req, res) {
    try {
      const currency = await Currency.find({ status: true });
      if (!currency.length)
        return response.notFound(res, "Valyutalar topilmadi");
      return response.success(res, "Valyutalar topildi", currency);
    } catch (error) {
      return response.serverError(res, error.message, error);
    }
  }

  // get by id sort status true
  async getById(req, res) {
    try {
      const currency = await Currency.find({ _id: req.params.id });
      if (!currency.length) return response.notFound(res, "Valyuta topilmadi");
      return response.success(res, "Valyuta topildi", currency);
    } catch (error) {
      return response.serverError(res, error.message, error);
    }
  }

  // create
  async create(req, res) {
    try {
      let { name, rate } = req.body;

      if (!name || !rate)
        return response.error(res, "Valyuta va kurs kiritish shart");

      if (typeof rate === "string")
        return response.error(res, "Kurs raqam kiritish shart");

      let exactCurrency = await Currency.findOne({ name, deleted: false });
      if (exactCurrency) return response.error(res, "Bunday valyuta mavjud");

      const currency = await Currency.create(req.body);
      return response.created(res, "Muvaffaqiyatli saqlandi", currency);
    } catch (error) {
      return response.serverError(res, error.message, error);
    }
  }

  // delete
  async delete(req, res) {
    try {
      const currency = await Currency.findByIdAndUpdate(req.params.id, {
        deleted: true,
      });
      if (!currency) return response.notFound(res, "Valyuta topilmadi");
      return response.success(res, "Muvaffaqiyatli o'chirildi", currency);
    } catch (error) {
      return response.serverError(res, error.message, error);
    }
  }

  // update
  async update(req, res) {
    try {
      let { name, rate } = req.body;
      let exactCurrency = await Currency.findOne({
        name: req.body.name,
        deleted: false,
        _id: { $ne: req.params.id },
      });
      if (exactCurrency) return response.error(res, "Bunday valyuta mavjud");

      if (!name || !rate)
        return response.error(res, "Valyuta va kurs kiritish shart");

      if (typeof rate === "string" || name === null)
        return response.error(res, "Kurs raqam kiritish shart");

      const currency = await Currency.findByIdAndUpdate(
        req.params.id,
        { name: req.body.name, rate: req.body.rate },
        {
          new: true,
        }
      );
      if (!currency) return response.notFound(res, "Valyuta topilmadi");
      return response.success(res, "Muvaffaqiyatli yangilandi", currency);
    } catch (error) {
      return response.serverError(res, error.message, error);
    }
  }
}

module.exports = new currencyController();
