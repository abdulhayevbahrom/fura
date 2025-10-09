const response = require("../utils/response");
const Partner = require("../model/partnerModel");
const Order = require("../model/orderModel");
const Expense = require("../model/expensesModel");
const mongoose = require("mongoose");

class PartnerController {
  async createPartner(req, res) {
    try {
      let { fullname, phone, address } = req.body;
      if (!fullname || !address) {
        return response.error(res, "Ism va manzil kiritish shart");
      }
      if (!phone?.length) {
        return response.error(res, "Kamida telefon raqam kiritish shart");
      }
      // check fullname
      let exist = await Partner.findOne({
        fullname: fullname.trim().toLowerCase(),
      });
      if (exist) {
        return response.error(res, "Bunday ismli hamkor mavjud");
      }
      const newPartner = await Partner.create(req.body);
      return response.created(res, "Hamkor qo'shildi", newPartner);
    } catch (err) {
      return response.serverError(res, err.message, err);
    }
  }

  async getPartners(req, res) {
    try {
      const results = await Partner.aggregate([
        // 1️⃣ Faqat o'chirilmagan hamkorlar
        { $match: { deleted: false } },

        // 2️⃣ Hamkorga tegishli orderlarni biriktirish
        {
          $lookup: {
            from: "orders",
            localField: "_id",
            foreignField: "partner",
            pipeline: [{ $match: { deleted: false } }],
            as: "orders",
          },
        },

        // 3️⃣ Order IDlarni ajratib olish
        {
          $addFields: {
            orderIds: "$orders._id",
          },
        },

        // 4️⃣ Expenslarni biriktirish
        {
          $lookup: {
            from: "expenses",
            let: { orderIds: "$orderIds" },
            pipeline: [
              {
                $match: {
                  $expr: { $in: ["$order_id", "$$orderIds"] },
                  from: "client",
                  deleted: false,
                },
              },
              {
                $group: {
                  _id: null,
                  totalPaid: { $sum: "$amount" },
                },
              },
            ],
            as: "payments",
          },
        },

        // 5️⃣ Hisob-kitoblarni bajarish
        {
          $project: {
            fullname: 1,
            phone: 1,
            address: 1,
            createdAt: 1,
            updatedAt: 1,
            // Hamkorning barcha fieldlari (kerakli bo'lganlarini qo'shing)
            totalPrice: {
              $sum: "$orders.totalPrice",
            },
            paidAmount: {
              $ifNull: [{ $arrayElemAt: ["$payments.totalPaid", 0] }, 0],
            },
            debt: {
              $subtract: [
                { $sum: "$orders.totalPrice" },
                { $ifNull: [{ $arrayElemAt: ["$payments.totalPaid", 0] }, 0] },
              ],
            },
          },
        },
      ]);

      if (!results.length) {
        return response.notFound(res, "Hamkorlar topilmadi");
      }

      return response.success(res, "Hamkorlar va qarzlar ro'yxati", results);
    } catch (err) {
      return response.serverError(res, err.message, err);
    }
  }

  // async getPartnerById(req, res) {
  //   try {
  //     const { id } = req.params;

  //     const result = await Partner.aggregate([
  //       // 1️⃣ ID bo'yicha hamkorni topish
  //       {
  //         $match: {
  //           _id: new mongoose.Types.ObjectId(id),
  //           deleted: false,
  //         },
  //       },

  //       // 2️⃣ Hamkorga tegishli orderlarni biriktirish
  //       {
  //         $lookup: {
  //           from: "orders",
  //           localField: "_id",
  //           foreignField: "partner",
  //           pipeline: [{ $match: { deleted: false } }],
  //           as: "orders",
  //         },
  //       },

  //       // 3️⃣ Order IDlarni ajratib olish
  //       {
  //         $addFields: {
  //           orderIds: "$orders._id",
  //         },
  //       },

  //       // 4️⃣ Expenslarni biriktirish
  //       {
  //         $lookup: {
  //           from: "expenses",
  //           let: { orderIds: "$orderIds" },
  //           pipeline: [
  //             {
  //               $match: {
  //                 $expr: { $in: ["$order_id", "$$orderIds"] },
  //                 from: "client",
  //                 deleted: false,
  //               },
  //             },
  //             {
  //               $group: {
  //                 _id: null,
  //                 totalPaid: { $sum: "$amount" },
  //               },
  //             },
  //           ],
  //           as: "payments",
  //         },
  //       },

  //       // 5️⃣ Hisob-kitoblarni bajarish
  //       {
  //         $project: {
  //           fullname: 1,
  //           phone: 1,
  //           address: 1,
  //           // Hamkorning barcha fieldlari
  //           totalPrice: {
  //             $sum: "$orders.totalPrice",
  //           },
  //           paidAmount: {
  //             $ifNull: [{ $arrayElemAt: ["$payments.totalPaid", 0] }, 0],
  //           },
  //           debt: {
  //             $subtract: [
  //               { $sum: "$orders.totalPrice" },
  //               { $ifNull: [{ $arrayElemAt: ["$payments.totalPaid", 0] }, 0] },
  //             ],
  //           },
  //           orders: 1, // Agar orderlarni ham qaytarish kerak bo'lsa
  //         },
  //       },
  //     ]);

  //     if (!result.length) {
  //       return response.notFound(res, "Hamkor topilmadi");
  //     }

  //     return response.success(res, "Hamkor ma'lumotlari", result[0]);
  //   } catch (err) {
  //     return response.serverError(res, err.message, err);
  //   }
  // }

  async getPartnerById(req, res) {
    try {
      const { id } = req.params;

      const result = await Partner.aggregate([
        // 1️⃣ ID bo'yicha hamkorni topish
        {
          $match: {
            _id: new mongoose.Types.ObjectId(id),
            deleted: false,
          },
        },

        // 2️⃣ Hamkorga tegishli orderlarni biriktirish
        {
          $lookup: {
            from: "orders",
            localField: "_id",
            foreignField: "partner",
            pipeline: [{ $match: { deleted: false } }],
            as: "orders",
          },
        },

        // 3️⃣ Har bir order uchun to'lovlarni hisoblash
        {
          $lookup: {
            from: "expenses",
            let: { orderId: "$orders._id" },
            pipeline: [
              {
                $match: {
                  $expr: { $in: ["$order_id", "$$orderId"] },
                  from: "client",
                  deleted: false,
                },
              },
              {
                $group: {
                  _id: "$order_id",
                  paidForOrder: { $sum: "$amount" },
                },
              },
            ],
            as: "orderPayments",
          },
        },

        // 4️⃣ Orderlarni to'lovlar bilan birlashtirish
        {
          $addFields: {
            orders: {
              $map: {
                input: "$orders",
                as: "order",
                in: {
                  $mergeObjects: [
                    "$$order",
                    {
                      paidAmount: {
                        $let: {
                          vars: {
                            payment: {
                              $arrayElemAt: [
                                {
                                  $filter: {
                                    input: "$orderPayments",
                                    cond: {
                                      $eq: ["$$this._id", "$$order._id"],
                                    },
                                  },
                                },
                                0,
                              ],
                            },
                          },
                          in: {
                            $ifNull: ["$$payment.paidForOrder", 0],
                          },
                        },
                      },
                      remainingPrice: {
                        $subtract: [
                          "$$order.totalPrice",
                          {
                            $let: {
                              vars: {
                                payment: {
                                  $arrayElemAt: [
                                    {
                                      $filter: {
                                        input: "$orderPayments",
                                        cond: {
                                          $eq: ["$$this._id", "$$order._id"],
                                        },
                                      },
                                    },
                                    0,
                                  ],
                                },
                              },
                              in: {
                                $ifNull: ["$$payment.paidForOrder", 0],
                              },
                            },
                          },
                        ],
                      },
                    },
                  ],
                },
              },
            },
          },
        },

        // 5️⃣ Umumiy hisob-kitoblar
        {
          $project: {
            fullname: 1,
            phone: 1,
            address: 1,
            orders: 1,
            totalPrice: {
              $sum: "$orders.totalPrice",
            },
            paidAmount: {
              $sum: "$orders.paidAmount",
            },
            debt: {
              $sum: "$orders.remainingPrice",
            },
          },
        },
      ]);

      if (!result.length) {
        return response.notFound(res, "Hamkor topilmadi");
      }

      return response.success(res, "Hamkor ma'lumotlari", result[0]);
    } catch (err) {
      return response.serverError(res, err.message, err);
    }
  }

  async deletePartner(req, res) {
    try {
      const { id } = req.params;
      const partner = await Partner.findByIdAndUpdate(
        id,
        { deleted: true },
        { new: true }
      );
      if (!partner) {
        return response.notFound(res, "Hamkor topilmadi");
      }
      return response.success(res, "Hamkor o'chirildi", partner);
    } catch (err) {
      return response.serverError(res, err.message, err);
    }
  }

  async updatePartner(req, res) {
    try {
      const { id } = req.params;
      const { fullname, phone, address } = req.body;
      if (!fullname || !address) {
        return response.error(res, "Ism va manzil kiritish shart");
      }
      if (!phone?.length) {
        return response.error(res, "Kamida telefon raqam kiritish shart");
      }
      const partner = await Partner.findByIdAndUpdate(
        id,
        { fullname, phone, address },
        { new: true }
      );
      if (!partner) {
        return response.notFound(res, "Hamkor topilmadi");
      }
      return response.success(res, "Hamkor ma'lumotlari yangilandi", partner);
    } catch (err) {
      return response.serverError(res, err.message, err);
    }
  }
}

module.exports = new PartnerController();
