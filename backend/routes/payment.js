import express from "express";
import crypto from "crypto";
import "dotenv/config";
import Razorpay from "razorpay";
import Payment from "../models/Payment.js";

const router = express.Router();

const razorpayInstance = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_SECRET,
});

// Order Api
router.post("/order", (req, res) => {
  const { amount } = req.body;

  try {
    const options = {
      amount: Number(amount * 100),
      currency: "INR",
      receipt: crypto.randomBytes(10).toString("hex"),
    };

    razorpayInstance.orders.create(options, (error, order) => {
      if (error) {
        console.log(error);
        return res.status(500).json({ message: "Something Went Wrong !!!" });
      }
      console.log(order);
      res.status(200).json({ data: order });
    });
  } catch (error) {
    console.log(error);
  }
});

// Verify Api
router.post("/verify", async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
    req.body;

  try {
    const sign = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSign = crypto
      .createHmac("sha256", process.env.RAZORPAY_SECRET)
      .update(sign)
      .digest("hex");

    const isAuthentic = expectedSign === razorpay_signature;

    if (isAuthentic) {
      const payment = new Payment({
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature,
      });

      await payment.save();

      return res.json({
        message: "Payment Successfully Verified",
      });
    } else {
      return res.status(400).json({ message: "Payment Verification Failed" });
    }
  } catch (error) {
    console.error("Error in payment verification:", error);
    return res.status(500).json({ message: "Internal Server Error!" });
  }
});

export default router;
