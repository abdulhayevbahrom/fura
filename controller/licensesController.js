const response = require("../utils/response");
const License = require("../model/licenseModel");
const mongoose = require("mongoose");
const Cars = require("../model/carModel");
const Fuels = require("../model/fuelModel");

class LicenseController {
  async getAll(req, res) {
    try {
      const licenses = await License.find({ status: true, deleted: false })
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

  // get notification
  async getNotification(req, res) {
    try {
      const now = new Date();
      // Bugungi kun boshini olish
      const start = new Date(now);
      start.setHours(0, 0, 0, 0);

      // 15 kundan keyingi kun oxiri
      const end = new Date(now);
      end.setDate(end.getDate() + 15);
      end.setHours(23, 59, 59, 999);

      // 1) Aktiv hujjatlarni olish
      const allLicenses = await License.find({
        deleted: false,
        status: true,
      })
        .populate("car_id", "title number")
        .populate("trailer_id", "number")
        .lean();

      const result = [];

      for (const lic of allLicenses) {
        if (!lic.to) continue;

        const toDate = new Date(lic.to); // "2025-11-30" → Date

        if (Number.isNaN(toDate.getTime())) continue;

        // Hujjat 15 kun ichida tugaydimi?
        if (toDate >= start && toDate <= end) {
          // Necha kun qoldi?
          const diffMs = toDate - now;
          const remainingDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

          result.push({
            ...lic,
            remainingDays,
          });
        }
      }

      // 2) Cars + Fuels: hammasi bitta aggregation
      let cars1 = await Cars.aggregate([
        {
          $match: {
            deleted: false,
          },
        },
        {
          // Har bir mashina uchun oxirgi aktif yoqilg'ini olib kelamiz
          $lookup: {
            from: "fuels", // Fuels.collection.name bilan mos bo‘lishi kerak
            let: { carId: "$_id" },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: ["$car_id", "$$carId"] },
                      { $eq: ["$deleted", false] },
                    ],
                  },
                },
              },
              { $sort: { createdAt: -1 } }, // eng so‘nggisi
              { $limit: 1 },
            ],
            as: "fuel",
          },
        },
        {
          $unwind: {
            path: "$fuel",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $addFields: {
            warning_distance: {
              $subtract: ["$fuel.to", "$probeg"],
            },
          },
        },
        {
          $match: {
            warning_distance: { $lte: 3000 },
          },
        },
        {
          $project: {
            vehicles: 0,
            cpu: 0,
          },
        },
      ]);

      if (!result.length && !cars1.length) {
        return response.notFound(res, "Bildirishnomalar topilmadi", result);
      }
      return response.success(res, "Bildirishnomalar topildi", {
        licenses: result,
        cars: cars1,
        count: result.length + cars1.length,
      });
    } catch (error) {
      return response.serverError(res, error.message, error);
    }
  }
}

module.exports = new LicenseController();
