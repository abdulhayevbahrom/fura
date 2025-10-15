const router = require("express").Router();

const multer = require("multer");
const upload = multer({ storage: multer.memoryStorage() });
const v1 = upload.single("file");
// const v2 = upload.fields([{ name: "images" }, { name: "documents" }]);

const parser = require("../middleware/image.parser");

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

// CARS - Asosiy CRUD operatsiyalar
router.get("/cars/all", carsController.getAllCars);
router.get("/cars/:id", carsController.getCarById);
router.post(
  "/cars/create",
  v1,
  parser,
  carsValidation,
  carsController.createCar
);
router.put("/cars/update/:id", carsValidation, carsController.updateCar);
router.delete("/cars/delete/:id", carsController.deleteCar);

// // CARS - Vehicles (Gildiraklar) boshqaruvi
router.put("/cars/change-vehicles", carsController.changeVehicles);
router.put("/cars/update-vehicle", carsController.updateVehicle);

// CARS - CPU boshqaruvi
router.put("/cars/change-cpu", carsController.addCPU);
router.put("/cars/update-cpu", carsController.updateCPU);

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
router.put("/trailers/change-vehicles", trailerController.changeVehicles);
router.put("/trailers/update-vehicle", trailerController.updateVehicle);

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
const orderValidationByPartId = require("../validation/orderValidationByPartId");

router.get("/orders/all", orderController.getOrders);
router.get("/orders/:id", orderController.getOrderById);
router.get("/orders/driver/:driver_id", orderController.getOrdersByDriverId);
router.post("/orders/create", orderValidation, orderController.createOrder);
router.post(
  "/orders/create-by-part",
  orderValidationByPartId,
  orderController.createOrderByPartId
);
router.put("/orders/update/:id", orderValidation, orderController.updateOrder);
router.delete("/orders/delete/:id", orderController.deleteOrder);
router.put("/orders/state/:id", orderController.changeState);

// PARTS
const partController = require("../controller/partController");

router.get("/parts/all", partController.getParts);
router.get("/parts/:id", partController.getPartById);
router.put("/parts/status/:part_id", partController.changeStatus);

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

router.post("/salary/pay", salaryController.payToDriver);
router.get("/salary/drivers", salaryController.getDrivers);
router.get("/salary/payments", salaryController.getAllPaymetns);
router.get("/salary/:driver", salaryController.getByDriverId);

// DASHBOARD
const dashboardController = require("../controller/dashboardController");
router.get("/dashboard", dashboardController.getDashboardData);

module.exports = router;
