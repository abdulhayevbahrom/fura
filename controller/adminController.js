const response = require("../utils/response");
const adminsDB = require("../model/adminModel");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

class AdminController {
  async getAdmins(req, res) {
    try {
      const admins = await adminsDB.find();
      if (!admins.length) return response.notFound(res, "Adminlar topilmadi");
      response.success(res, "Barcha adminlar", admins);
    } catch (err) {
      response.serverError(res, err.message, err);
    }
  }

  async getAdminById(req, res) {
    try {
      const admin = await adminsDB.findById(req.params.id).select("-password");
      if (!admin) return response.notFound(res, "Admin topilmadi");
      response.success(res, "Admin topildi", admin);
    } catch (err) {
      response.serverError(res, err.message, err);
    }
  }

  // Yangi admin qo‘shish (Create)
  async createAdmin(req, res) {
    try {
      let io = req.app.get("socket");
      const { login, password } = req.body;

      const existingAdmin = await adminsDB.findOne({ login });
      if (existingAdmin) {
        return response.error(res, "Bu login allaqachon mavjud");
      }
      const hashedPassword = await bcrypt.hash(password, 10);

      req.body.password = hashedPassword;

      const admin = await adminsDB.create(req.body);

      io.emit("new_admin", admin);

      response.created(res, "Admin qo‘shildi", admin);
    } catch (err) {
      response.serverError(res, err.message, err);
    }
  }

  // Adminni yangilash (Update)
  async updateAdmin(req, res) {
    try {
      let io = req.app.get("socket");
      const { login, password } = req.body;

      if (login) {
        const existingAdmin = await adminsDB.findOne({
          login,
          _id: { $ne: req.params.id },
        });
        if (existingAdmin)
          return response.error(res, "Bu login allaqachon mavjud");
      }

      const updateData = { ...req.body };
      if (password) {
        updateData.password = await bcrypt.hash(password, 10);
      }

      const updatedAdmin = await adminsDB.findByIdAndUpdate(
        req.params.id,
        updateData,
        { new: true }
      );

      if (!updatedAdmin)
        return response.error(res, "Admin yangilashda xatolik");

      io.emit("admin_updated", updatedAdmin);
      response.success(res, "Admin yangilandi", updatedAdmin);
    } catch (err) {
      response.serverError(res, err.message, err);
    }
  }

  // Adminni o‘chirish (Delete)
  async deleteAdmin(req, res) {
    try {
      let io = req.app.get("socket");
      const admin = await adminsDB.findByIdAndDelete(req.params.id);
      if (!admin) return response.error(res, "Admin o‘chirilmadi");

      io.emit("admin_deleted", null);
      response.success(res, "Admin o‘chirildi");
    } catch (err) {
      response.serverError(res, err.message, err);
    }
  }

  // Admin kirishi (Login)
  async login(req, res) {
    try {
      const { login, password } = req.body;
      const admin = await adminsDB.findOne({ login });
      if (!admin) return response.error(res, "Login yoki parol xato");

      const isMatch = await bcrypt.compare(password, admin.password);
      if (!isMatch) return response.error(res, "Login yoki parol xato");

      const token = jwt.sign(
        { id: admin._id, login: admin.login },
        process.env.JWT_SECRET_KEY,
        { expiresIn: "1w" }
      );

      response.success(res, "Kirish muvaffaqiyatli", {
        admin,
        token,
      });
    } catch (err) {
      response.serverError(res, err.message, err);
    }
  }
}

module.exports = new AdminController();
