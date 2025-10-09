const router = require("express").Router();

// Controllers and Validations
const adminController = require("../controller/adminController");
const adminValidation = require("../validation/adminValidation");

router.post("/admin/login", adminController.login);
router.get("/admin/all", adminController.getAdmins);
router.get("/admin/:id", adminController.getAdminById);
router.post("/admin/create", adminValidation, adminController.createAdmin);
router.put("/admin/update/:id", adminValidation, adminController.updateAdmin);
router.delete("/admin/delete/:id", adminController.deleteAdmin);

// cars
const carsController = require("../controller/carsController");
const carsValidation = require("../validation/carsValidation");

router.get("/cars/all", carsController.getAllCars);
router.get("/cars/:id", carsController.getCarById);
router.post("/cars/create", carsValidation, carsController.createCar);
router.delete("/cars/delete/:id", carsController.deleteCar);
router.put("/cars/update/:id", carsValidation, carsController.updateCar);
router.patch("/cars/change-vehicles/", carsController.changeVehicles);

// TRAILERS
const trailerController = require("../controller/trailerController");
const trailerValidation = require("../validation/trailerValidation");

router.get("/trailers/all", trailerController.getAllTrailers);
router.post(
  "/trailers/create",
  trailerValidation,
  trailerController.createTrailer
);
router.delete("/trailers/delete/:id", trailerController.deleteTrailer);
router.put(
  "/trailers/update/:id",
  trailerValidation,
  trailerController.updateTrailer
);

// DRIVERS
const drivesController = require("../controller/driversController");
const drivesValidation = require("../validation/driversValidation");

router.post("/drivers/login", drivesController.login);
router.get("/drivers/roles", drivesController.getRoles);
router.get("/drivers/all", drivesController.getDrivers);
router.get("/drivers/:id", drivesController.getDriverById);
router.post("/drivers/create", drivesValidation, drivesController.createDriver);
router.delete("/drivers/delete/:id", drivesController.deleteDriver);
router.put(
  "/drivers/update/:id",
  drivesValidation,
  drivesController.updateDriver
);
router.put("/drivers/status/:id", drivesController.changeStatus);

// ORDERS
const orderController = require("../controller/orderController");
const orderValidation = require("../validation/orderValidation");

router.get("/orders/all", orderController.getOrders);
router.get("/orders/:id", orderController.getOrderById);
router.get("/orders/driver/:driver_id", orderController.getOrdersByDriverId);
router.post("/orders/create", orderValidation, orderController.createOrder);
router.put("/orders/update/:id", orderValidation, orderController.updateOrder);
router.delete("/orders/delete/:id", orderController.deleteOrder);
router.put("/orders/state/:id", orderController.changeState);

// PARTS
const partController = require("../controller/partController");

router.get("/parts/all", partController.getParts);
router.get("/parts/:id", partController.getPartById);
router.put("/parts/status/:id", partController.changeStatus);

// EXPENSES
const expensesController = require("../controller/expensesController");
const expenseValidation = require("../validation/expensesValidation");

// ⚙️ 1. Statik va maxsus GET yo‘llar birinchi bo‘lishi kerak
router.get("/expenses/categories", expensesController.getCategories);
router.get("/expenses/all", expensesController.getAll);
router.get("/expenses/order/:orderId", expensesController.getByOrderId);

// ⚙️ 2. CRUD yo‘llar keyin
router.post("/expenses/create", expenseValidation, expensesController.create);
router.put(
  "/expenses/update/:id",
  expenseValidation,
  expensesController.update
);
router.delete("/expenses/delete/:id", expensesController.delete);

// ⚙️ 3. Dinamik ID yo‘li eng oxirida
router.get("/expenses/:id", expensesController.getById);

// PARTNERS
const partnerController = require("../controller/partnerController");

router.get("/partners/all", partnerController.getPartners);
router.get("/partners/:id", partnerController.getPartnerById);
router.post("/partners/create", partnerController.createPartner);
router.delete("/partners/delete/:id", partnerController.deletePartner);
router.put("/partners/update/:id", partnerController.updatePartner);

// SALARY
const salaryController = require("../controller/salaryController");
const salaryValidation = require("../validation/salaryValidation");

router.get("/salaries/all", salaryController.getAllSalaries);
router.get("/salaries/driver/:id", salaryController.getSalaryByDriverId);
router.post(
  "/salaries/create",
  salaryValidation,
  salaryController.createSalary
);
router.put(
  "/salaries/update/:id",
  salaryValidation,
  salaryController.updateSalary
);
router.delete("/salaries/delete/:id", salaryController.deleteSalary);

module.exports = router;
