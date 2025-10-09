const Drivers = require("../model/driversModel");
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
      const categories = await Drivers.aggregate([
        { $match: { category: { $exists: true, $ne: "" } } }, // faqat to‘ldirilganlar
        { $group: { _id: "$role" } }, // unikal kategoriya
        { $sort: { _id: 1 } }, // tartiblash
      ]);

      const result = categories.map((c) => c._id);

      if (!result.length) {
        return response.notFound(res, "Rollar topilmadi", []);
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
      const driver = await Drivers.findOne({ login: req.body.login });
      if (driver) return response.error(res, "Bu login allaqachon mavjud");

      const hashedPassword = await bcrypt.hash(req.body.password, 10);
      req.body.password = hashedPassword;

      const newDriver = await Drivers.create(req.body);
      return response.success(res, "Haydovchi qo'shildi", newDriver);
    } catch (err) {
      return response.error(res, err);
    }
  }

  async updateDriver(req, res) {
    try {
      const driver = await Drivers.findOne({
        login: req.body.login,
        _id: { $ne: req.params.id },
      });
      if (driver) return response.error(res, "Bu login allaqachon mavjud");

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
}

module.exports = new DriversController();
