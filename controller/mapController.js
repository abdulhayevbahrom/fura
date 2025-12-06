const response = require("../utils/response");
const Map = require("../model/mapModel");
let Drivers = require("../model/driversModel");

class MapController {
  async update(req, res) {
    try {
      let io = req.app.get("socket");
      let { driver, lat, long, speed } = req.body;
      // bolmasa yaratadi aks holda yangilaydi
      await Map.findOneAndUpdate(
        { driver },
        { driver, lat, long, speed },
        { upsert: true, new: true }
      );

      driver = await Drivers.findById(driver)
        .select("firstName lastName")
        .lean();

      io.emit("map", { driver, lat, long, speed });
      return response.success(res, "Muvaffaqiyatli yangilandi");
    } catch (err) {
      return response.serverError(res, err.message, err);
    }
  }

  async getMap(req, res) {
    try {
      let allData = await Map.find().populate("driver", "firstName lastName");
      if (!allData.length) return response.notFound(res, "Hodimlar topilmadi");
      return response.success(res, "Hodimlar topildi", allData);
    } catch (err) {
      return response.serverError(res, err.message, err);
    }
  }
}

module.exports = new MapController();
