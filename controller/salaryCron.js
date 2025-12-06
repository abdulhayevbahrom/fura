// cron/salaryCron.js
const cron = require("node-cron");
const dayjs = require("dayjs");
const Drivers = require("../model/driversModel");
const Salary = require("../model/salaryModel");

async function accrueMonthlySalaryForAll(month) {
  // Oylik stavkasi bor xodimlar (usta, manager, boshqalar)
  const employees = await Drivers.find({
    is_deleted: false,
    salary: { $gt: 0 },
    currency_id: { $ne: null },
  });

  if (!employees.length) return { count: 0 };

  let successCount = 0;

  for (const emp of employees) {
    // Shu oy uchun allaqachon oylik yozilganmi?
    const exists = await Salary.exists({
      driver: emp._id,
      type: "oylik",
      month: month,
    });

    if (exists) {
      // bu xodimga shu oy allaqachon oylik yozilgan, skip
      continue;
    }

    // amount_base hisoblash
    const { amount_base } = await convertToBase(emp.salary, emp.currency_id);

    // Salary logiga yozamiz (type: 'oylik')
    await Salary.create({
      driver: emp._id,
      amount: emp.salary,
      currency_id: emp.currency_id,
      amount_base,
      type: "oylik", // balansga +
      paymentType: null,
      month,
      description: `Oylik accrual: ${month}`,
    });

    // Balansga + (bazaviy valyutada)
    emp.balance = (emp.balance || 0) + amount_base;
    await emp.save();

    successCount++;
  }

  return { count: successCount };
}

// "0 1 1 * *" => har oyning 1-kuni, soat 01:00, daqiqa 0
cron.schedule("0 1 1 * *", async () => {
  try {
    const now = dayjs();
    const month = now.format("YYYY-MM"); // masalan: "2025-03"

    const result = await accrueMonthlySalaryForAll(month);
  } catch (err) {}
});
