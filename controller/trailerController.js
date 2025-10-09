const response = require("../utils/response");
const Trailers = require("../model/trailerModel");

class trailerController {
  async getAllTrailers(req, res) {
    try {
      const trailers = await Trailers.find();
      if (!trailers.length)
        return response.notFound(res, "Pritseplar topilmadi", []);
      return response.success(res, "Pritseplar topildi", trailers);
    } catch (error) {
      return response.serverError(res, "Server Error", error);
    }
  }

  async createTrailer(req, res) {
    try {
      // check number
      let trailer = await Trailers.findOne({ number: req.body.number });
      if (trailer) return response.error(res, "Pritsep raqami mavjud");
      const newTrailer = await Trailers.create(req.body);
      return response.created(res, "Pritsep qo'shildi", newTrailer);
    } catch (error) {
      return response.serverError(res, error.message, error);
    }
  }

  async deleteTrailer(req, res) {
    try {
      const trailer = await Trailers.findByIdAndDelete(req.params.id);
      if (!trailer) return response.notFound(res, "Pritsep topilmadi");
      return response.success(res, "Pritsep o'chirildi", trailer);
    } catch (error) {
      return response.serverError(res, error.message, error);
    }
  }

  async updateTrailer(req, res) {
    try {
      // check number
      let trailer = await Trailers.findOne({
        number: req.body.number,
        _id: { $ne: req.params.id },
      });
      if (trailer) return response.error(res, "Pritsep raqami mavjud");
      const updated_trailer = await Trailers.findByIdAndUpdate(
        req.params.id,
        req.body,
        {
          new: true,
        }
      );
      if (!updated_trailer) return response.notFound(res, "Pritsep topilmadi");
      return response.success(res, "Pritsep yangilandi", updated_trailer);
    } catch (error) {
      return response.serverError(res, error.message, error);
    }
  }
}

module.exports = new trailerController();
