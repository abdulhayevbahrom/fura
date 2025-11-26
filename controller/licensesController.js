const response = require("../utils/response");
const License = require("../model/licenseModel");
const mongoose = require("mongoose");

class LicenseController {
  async getAll(req, res) {
    try {
      //   const licenses = await License.find({ status: true, deleted: false })
      const licenses = await License.find()
        .populate("car_id", "title number")
        .populate("trailer_id", "number");
      if (!licenses.length)
        return response.notFound(res, "Litsenziyalar topilmadi", []);
      return response.success(res, "Litsenziyalar topildi", licenses);
    } catch (error) {
      return response.serverError(res, error.message, error);
    }
  }

  // get license by car  id
  async getByCarId(req, res) {
    try {
      const license = await License.find({
        car_id: req.params.id,
        deleted: false,
        status: true,
      }).populate("car_id", "title number");
      if (!license) return response.notFound(res, "Litsenziya topilmadi");
      return response.success(res, "Litsenziya topildi", license);
    } catch (error) {
      return response.serverError(res, error.message, error);
    }
  }

  // get license bu car id story
  async getByCarIdStory(req, res) {
    try {
      const license = await License.find({
        car_id: req.params.id,
        deleted: false,
        status: false,
      }).populate("car_id", "title number");
      if (!license)
        return response.notFound(res, "Litsenziya tarixi topilmadi");
      return response.success(res, "Litsenziyalaf tarixi topildi", license);
    } catch (error) {
      return response.serverError(res, error.message, error);
    }
  }

  // get license by trailer id
  async getByTrailerId(req, res) {
    try {
      const license = await License.find({
        trailer_id: req.params.id,
        deleted: false,
        status: true,
      }).populate("trailer_id", "number");
      if (!license.length)
        return response.notFound(res, "Litsenziya topilmadi");
      return response.success(res, "Litsenziya topildi", license);
    } catch (error) {
      return response.serverError(res, error.message, error);
    }
  }

  // get license by trailer id story
  async getByTrailerIdStory(req, res) {
    try {
      const license = await License.find({
        trailer_id: req.params.id,
        deleted: false,
        status: false,
      }).populate("trailer_id", "number");
      if (!license)
        return response.notFound(res, "Litsenziya tarixi topilmadi");
      return response.success(res, "Litsenziyalaf tarixi topildi", license);
    } catch (error) {
      return response.serverError(res, error.message, error);
    }
  }

  // create
  async create(req, res) {
    try {
      let { name, from, to, car_id, trailer_id } = req.body;

      // check relevant_id mongoose _id
      if (car_id && !mongoose.Types.ObjectId.isValid(car_id))
        return response.error(res, "Bunday Mashina topilmadi");
      if (trailer_id && !mongoose.Types.ObjectId.isValid(trailer_id))
        return response.error(res, "Bunday Tirkama topilmadi");

      if (!name || !from || !to) {
        return response.error(res, "Malumotlar to'liq emas");
      }

      const license = await License.create(req.body);
      return response.created(res, "Muvaffaqiyatli saqlandi", license);
    } catch (error) {
      return response.serverError(res, error.message, error);
    }
  }

  // delete
  async delete(req, res) {
    try {
      const license = await License.findByIdAndUpdate(req.params.id, {
        deleted: true,
      });
      if (!license) return response.notFound(res, "Litsenziya topilmadi");
      return response.success(res, "Muvaffaqiyatli o'chirildi", license);
    } catch (error) {
      return response.serverError(res, error.message, error);
    }
  }

  // update
  async update(req, res) {
    try {
      let { id } = req.params;
      let exactLicense = await License.findById(id);
      if (!exactLicense) return response.notFound(res, "Litsenziya topilmadi");

      let { _id, __v, ...rest } = exactLicense.toObject();
      let newLicense = await License.create({
        name: exactLicense.name,
        ...rest,
        ...req.body,
        status: true,
        deleted: false,
      });

      exactLicense.status = false;
      await exactLicense.save();

      return response.success(res, "Muvaffaqiyatli yangilandi", newLicense);
    } catch (error) {
      return response.serverError(res, error.message, error);
    }
  }

  // mavjudni malumotlarini yangilash
  async edit(req, res) {
    try {
      const license = await License.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
      });
      return response.success(res, "Litsenziya yangilandi", license);
    } catch (error) {
      return response.serverError(res, error.message, error);
    }
  }
}

module.exports = new LicenseController();
