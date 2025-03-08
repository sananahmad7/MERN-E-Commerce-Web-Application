import express from "express";

const router = express.Router();

router.get("/", protectRoute, adminRoute, getAllProducts);

export default router;
