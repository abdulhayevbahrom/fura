const response = require("../utils/response");
const Salary = require("../model/salaryModel");

class SalaryController {
  async getAllSalaries(req, res) {
    try {
      let { month, status, paymentType } = req.query;
      let filter = {};
      if (month) filter.month = month;
      if (status) filter.status = status;
      if (paymentType) filter.paymentType = paymentType;
      const salaries = await Salary.find(filter).populate(
        "driver",
        "firstName lastName phone"
      );

      if (!salaries.length) {
        return response.notFound(res, "Oylik ma'lumotlari topilmadi", salaries);
      }
      return response.success(res, "Oylik ma'lumotlari", salaries);
    } catch (error) {
      return response.serverError(res, error.message, error);
    }
  }

  async getSalaryByDriverId(req, res) {
    try {
      let { id } = req.params;
      let salaries = await Salary.find({ driver: id }).populate(
        "driver",
        "firstName lastName phone"
      );
      if (!salaries.length) {
        return response.notFound(res, "Oylik ma'lumotlari topilmadi");
      }
      return response.success(res, "Oylik ma'lumotlari", salaries);
    } catch (error) {
      return response.serverError(res, error.message, error);
    }
  }

  async createSalary(req, res) {
    try {
      let newSalary = await Salary.create(req.body);
      if (!newSalary) {
        return response.error(res, "Malumot saqlanmadi");
      }
      return response.created(
        res,
        "Ma'lumot muvaffaqiyatli saqlandi",
        newSalary
      );
    } catch (error) {
      return response.serverError(res, error.message, error);
    }
  }

  async updateSalary(req, res) {
    try {
      let { id } = req.params;
      let updatedSalary = await Salary.findByIdAndUpdate(id, req.body, {
        new: true,
      });
      if (!updatedSalary) {
        return response.notFound(res, "Oylik ma'lumotlari topilmadi");
      }
      return response.success(
        res,
        "Oylik ma'lumotlari muvaffaqiyatli yangilandi",
        updatedSalary
      );
    } catch (error) {
      return response.serverError(res, error.message, error);
    }
  }

  async deleteSalary(req, res) {
    try {
      let { id } = req.params;
      let deletedSalary = await Salary.findByIdAndDelete(id);
      if (!deletedSalary) {
        return response.notFound(res, "Oylik ma'lumotlari topilmadi");
      }
      return response.success(
        res,
        "Oylik ma'lumotlari muvaffaqiyatli o'chirildi"
      );
    } catch (error) {
      return response.serverError(res, error.message, error);
    }
  }
}

module.exports = new SalaryController();
