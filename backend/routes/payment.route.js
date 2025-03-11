import express from "express";
import { createCheckoutSession } from "../controllers/payment.controller";
import { protectRoute } from "../middleware/auth.middleware";
import Coupon from "../models/coupon.model";
import { stripe } from "stripe";

const router = express.Router();

router.post("create-checkout-session", protectRoute, async (req, res) => {
  try {
    const { products, couponCode } = req.body;

    if (!Array.isArray(products) || products.length === 0) {
      return res.status(400).json({ error: "Invalid or empty prodcuts array" });
    }

    let totalAmount = 0;

    const lineItems = products.map((product) => {
      const amount = Math.round(product.price * 100); //stripe wants you to send the amount in cents
      totalAmount += amount * product.quantity;
      return {
        price_data: {
          currency: "usd",
          product_data: {
            name: product.name,
            image: [product.image],
          },
          unit_amount: amount,
        },
      };
    });

    let coupon = null;
    if (couponCode) {
      coupon = await Coupon.findOne({
        code: couponCode,
        userId: req.user._id,
        isActive: true,
      });
      totalAmount -= Math.round(
        (totalAmount * coupon.discountPercentage) / 100
      );
    }

    const session = await stripe.checkout.session.create({
      payment_method_types: ["card"],
      line_items: lineItems,
      mode: "payment",
      success_url: `${process.env.CLIENT_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.CLIENT_URL}/purchase-cancel`,
      discounts: coupon
        ? [
            {
              coupon: await createStripeCoupon(coupon.discountPercentage),
            },
          ]
        : [],
    });
  } catch (error) {}
});

export default router;
