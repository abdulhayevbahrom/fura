const response = require("../utils/response");
const Parts = require("../model/partModel");
const Orders = require("../model/orderModel");

class partController {
  // 🔹 Barcha partiyalarni olish
  async getParts(req, res) {
    try {
      let { status } = req.query;
      let filter = {};
      if (status) filter.status = status;
      const parts = await Parts.find(filter);

      if (!parts.length) return response.notFound(res, "Partiyalar topilmadi");

      return response.success(res, "Partiyalar topildi", parts);
    } catch (err) {
      return response.serverError(res, err.message, err);
    }
  }

  // 🔹 Bitta partiyani ID orqali olish
  async getPartById(req, res) {
    try {
      const { id } = req.params;

      const part = await Parts.findById(id);
      if (!part) return response.notFound(res, "Partiya topilmadi");

      let orders = await Orders.find({
        part_id: id,
        deleted: false,
        // state: { $ne: "finished" },
      })
        .populate("driver", "firstName lastName")
        .populate("car", "title number")
        .populate("trailer", "number")
        .populate("partner", "fullname")
        .populate("part_id", "name");

      return response.success(res, "Partiya topildi", { part, orders });
    } catch (err) {
      return response.serverError(res, err.message, err);
    }
  }

  // 🔹 Partiya statusini o‘zgartirish
  async changeStatus(req, res) {
    try {
      const { id } = req.params;
      const { status } = req.body;

      if (status && !["active", "in_progress", "finished"].includes(status)) {
        return response.error(
          res,
          "Noto'g'ri status qiymati yubrildi, tog'ri qiymat: finished"
        );
      }

      const part = await Parts.findById(id);
      if (!part) return response.notFound(res, "Partiya topilmadi");

      // Agar status kiritilmagan bo‘lsa, mavjudini saqlaydi
      part.status = status ?? part.status;

      await part.save();

      return response.success(res, "Partiya statusi o'zgartirildi", part);
    } catch (err) {
      return response.serverError(res, err.message, err);
    }
  }
}

module.exports = new partController();
