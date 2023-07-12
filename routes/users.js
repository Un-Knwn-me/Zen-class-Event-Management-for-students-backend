var express = require("express");
var router = express.Router();
const { UserModel } = require("../schema/userSchema");
const { hashCompare, hashPassword, createToken } = require("../config/auth");
const nodemailer = require("nodemailer");
require("dotenv").config();

fe_url = "http://localhost:3000";


router.post("/signup", async (req, res) => {
  try {
    let user = await UserModel.findOne({ email: req.body.email });

    if (!user) {
      req.body.password = await hashPassword(req.body.password);
      let data = new UserModel(req.body);
      await data.save();
      res.status(200).json({ message: "User signed up successfully" });
    } else {
      res.status(401).json({ message: "User already exists" });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal Server Error", error });
  }
});

router.post("/signin", async (req, res) => {
  try {
    let user = await UserModel.findOne({ email: req.body.email });
    if (user) {
      if (await hashCompare(req.body.password, user.password)) {
        let token = await createToken({
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
        });

        res
          .status(200)
          .send({
            message: "User successfully logged in",
            token,
            role: user.role,
            user: user._id,
          });
      } else {
        res.status(401).send({ message: "Invalid credentials" });
      }
    } else {
      res.status(404).send({ message: "User not found" });
    }
    console.log(user);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal Server Error", error });
  }
});

router.post("/forgot-password", async (req, res) => {
  try {
    let user = await UserModel.findOne({ email: req.body.email });
    if (user) {
      let token = Math.random().toString(36).slice(-8);
      user.resetlink = token;
      user.resetExpiresAt = Date.now() + 360000; //1hr
      await user.save();

      const transporter = nodemailer.createTransport({
        host: "smtp.gmail.com",
        port: 587,
        secure: true,
        auth: {
          user: process.env.EMAIL_USER,
          password: process.env.EMAIL_PASSWORD,
        },
      });

      const message = {
        from: "nodemailer@gmail.com",
        to: user.email,
        subject: "password reset request",
        text: `To reset your password, Kindly click on the following link reset your password:
             ${fe_url}/reset-password/${user.id}/${token}
         Kindly ignore the mail if you have not requested a password reset.`,
      };

      transporter.sendMail(message, (error, info) => {
        if (error) {
          res
            .status(404)
            .json({ message: "Something went wrong. Please try again." });
        }
        console.log(info.response);
        res
          .status(200)
          .json({ message: "Password reset requested successfully" });
      });
    } else {
      res.status(404).send({ message: "User not found" });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal Server Error", error });
  }
});

router.post("/reset-password/:id/:token", async (req, res) => {
  const { token } = req.params;
  const { id } = req.params;
  const { password } = req.body;

  try {
    // const data = await decodeToken(token);
    const user = await UserModel.findOne({
      id: _id,
      resetlink: token,
      resetExpiresAt: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(404).json({ message: "Invalid Token" });
    }

    // Reset the user's password
    user.password = await hashPassword(password);
    user.resetlink = null;
    user.resetExpiresAt = null;

    await user.save();

    res.status(200).json({ message: "Password reset successfully" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal Server Error", error });
  }
});

module.exports = router;
