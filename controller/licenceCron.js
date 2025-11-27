const cron = require("node-cron");
const License = require("../model/licenseModel");

const licenceCron = async (io) => {
  // cron.schedule("0 1 * * *", async () => {  // Prod
  cron.schedule("*/1 * * * *", async () => {
    // Test: har 1 daqiqa
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

    if (!result.length) return;

    io.emit("licenses_notification", {
      licenses: result,
      count: result.length,
    });
  });
};

module.exports = licenceCron;
