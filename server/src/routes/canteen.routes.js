const { Router } = require("express");
const {
  getAllCanteens, getCanteenById, createCanteen, updateCanteen, toggleCanteen, getMyCanteen,
} = require("../controllers/canteen.controller");
const { authenticate, authorize } = require("../middleware/auth");

const router = Router();

router.get("/", getAllCanteens);
router.get("/me", authenticate, authorize("CANTEEN_ADMIN"), getMyCanteen);
router.get("/:id", getCanteenById);
router.post("/", authenticate, authorize("SUPER_ADMIN"), createCanteen);
router.put("/:id", authenticate, authorize("SUPER_ADMIN", "CANTEEN_ADMIN"), updateCanteen);
router.patch("/:id/toggle", authenticate, authorize("CANTEEN_ADMIN"), toggleCanteen);

module.exports = router;
