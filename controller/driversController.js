const Drivers = require("../model/driversModel");
const Admins = require("../model/adminModel");
const response = require("../utils/response");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

class DriversController {
  async getDrivers(req, res) {
    try {
      const drivers = await Drivers.find({ is_deleted: false });
      if (!drivers.length)
        return response.notFound(res, "Haydovchilar topilmadi", []);
      return response.success(res, "Haydovchilar topildi", drivers);
    } catch (err) {
      return response.error(res, err);
    }
  }

  async getRoles(req, res) {
    try {
      const roles = await Drivers.aggregate([
        { $match: { role: { $exists: true, $ne: "" } } }, // faqat role mavjud va bo'sh emas
        { $group: { _id: "$role" } }, // unikal rollar
        { $sort: { _id: 1 } }, // tartiblash alfavit bo‘yicha
      ]);

      const result = roles.map((r) => r._id);
      if (!result?.find((r) => r === "driver")) {
        result.unshift("driver");
        result.push("manager");
      }
      return response.success(res, "Rollar ro'yxati", result);
    } catch (error) {
      return response.serverError(res, error.message, error);
    }
  }

  async getDriverById(req, res) {
    try {
      const driver = await Drivers.findOne({
        _id: req.params.id,
        is_deleted: false,
      });

      if (!driver) return response.notFound(res, "Haydovchi topilmadi");
      return response.success(res, "Haydovchi topildi", driver);
    } catch (err) {
      return response.error(res, err);
    }
  }

  async createDriver(req, res) {
    try {
      if (req.body.login) {
        const driver = await Drivers.findOne({ login: req.body.login });
        const admin = await Admins.findOne({ login: req.body.login });
        if (driver || admin)
          return response.error(res, "Bu login allaqachon mavjud");
      }

      if (req.body.password) {
        const hashedPassword = await bcrypt.hash(req.body.password, 10);
        req.body.password = hashedPassword;
      }

      const newDriver = await Drivers.create(req.body);
      return response.success(res, "Haydovchi qo'shildi", newDriver);
    } catch (err) {
      return response.serverError(res, err.message, err);
    }
  }

  async updateDriver(req, res) {
    try {
      if (req.body.login) {
        const driver = await Drivers.findOne({
          login: req.body.login,
          _id: { $ne: req.params.id },
        });
        if (driver) return response.error(res, "Bu login allaqachon mavjud");
      }

      if (req.body.password) {
        const hashedPassword = await bcrypt.hash(req.body.password, 10);
        req.body.password = hashedPassword;
      }

      const updateDriver = await Drivers.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true }
      );
      return response.success(res, "Haydovchi yangilandi", updateDriver);
    } catch (err) {
      return response.error(res, err);
    }
  }

  async deleteDriver(req, res) {
    try {
      const driver = await Drivers.findByIdAndUpdate(
        req.params.id,
        {
          is_deleted: true,
        },
        { new: true }
      );
      if (!driver) return response.error(res, "Haydovchi o'chirilmadi");
      return response.success(res, "Haydovchi o'chirildi");
    } catch (err) {
      return response.error(res, err);
    }
  }

  async changeStatus(req, res) {
    try {
      const exact_driver = await Drivers.findById(req.params.id);
      if (!exact_driver) return response.error(res, "Haydovchi topilmadi");

      if (exact_driver.is_active === true) {
        return response.error(
          res,
          "Haydovchi yo'lda, uni statusini o'zgartirish mumkin emas"
        );
      }

      const driver = await Drivers.findByIdAndUpdate(
        req.params.id,
        {
          status: req.body.status,
        },
        { new: true }
      );
      if (!driver) return response.error(res, "Driver statusi o'zgartirilmadi");
      return response.success(res, "Driver o'zgartirildi");
    } catch (err) {
      return response.error(res, err);
    }
  }

  async login(req, res) {
    try {
      const { login, password } = req.body;
      const driver = await Drivers.findOne({ login, is_deleted: false });

      if (!driver) return response.error(res, "Login yoki parol xato");
      const isMatch = await bcrypt.compare(password, driver.password);
      if (!isMatch) return response.error(res, "Login yoki parol xato");
      const token = jwt.sign(
        { id: driver._id, login: driver.login },
        process.env.JWT_SECRET_KEY,
        { expiresIn: "1w" }
      );

      return response.success(res, "Kirish muvaffaqiyatli", {
        driver,
        token,
      });
    } catch (err) {
      return response.serverError(res, err.message, err);
    }
  }

  // update permissions
  async updatePermissions(req, res) {
    try {
      let { id } = req.params;
      let { permissions } = req.body;
      let update = await Drivers.findByIdAndUpdate(
        id,
        { permissions },
        { new: true }
      );

      if (!update) return response.notFound(res, "Driver topilmadi");
      return response.success(res, "Muvaffaqiyatli yangilandi", update);
    } catch (err) {
      return response.serverError(res, err.message, err);
    }
  }

  // get permission
  async getPermissions(req, res) {
    try {
      let { id } = req.params;
      let driver = await Drivers.findById(id).select("permissions");
      let admins = await Admins.findById(id).select("permissions");
      if (!driver && !admins) return response.notFound(res, "Driver topilmadi");
      return response.success(
        res,
        "Hodimga ruxsat berilgan qismlar",
        driver?.permissions || admins?.permissions
      );
    } catch (err) {
      return response.serverError(res, err.message, err);
    }
  }
}

module.exports = new DriversController();
