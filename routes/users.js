var express = require("express");
var router = express.Router();
const { UserModel } = require("../schema/userSchema");
const { hashCompare, hashPassword, createToken, isSignedIn } = require("../config/auth");
const nodemailer = require("nodemailer");
const moment = require("moment");
require("dotenv").config();

fe_url = "https://zenclass-event-management-app.netlify.app";

// Get all users
router.get('/list', isSignedIn, async (req, res) => {
  try {
      const data = await UserModel.find({});
      res.status(200).json({ users: data });
    } catch (error) {
      console.log(error);
      res.status(500).json({ message: "Internal Server Error", error });
    }
});

// Get user by id
router.get('/:id', isSignedIn, async(req, res)=>{
  try {
      const { id } = req.params;
      let user = await UserModel.findById(id);
      if(!user){
        res.status(404).json({ message: "No data" })
      }
  
      const outputFormat = 'MMM DD YYYY, hh:mm A';
     
      const formattedUser = {
        ...user._doc,
      createdAt: moment(user.createdAt).format(outputFormat),
      }
      if (user.updatedAt) {
        formattedUser.updatedAt = moment(user.updatedAt).format(outputFormat);
      }
      res.status(200).json( formattedUser );
  } catch (error) {
      console.log(error);
      res.status(500).json({ message:"Internal Server Error", error });
  }
})

// Update user
router.put("/update/:id", isSignedIn, async(req,res)=>{
  try {
      const { id } = req.params;
      const updatedData = req.body;
  
      if (!id || !updatedData) {
        return res.status(404).json({ message: "Bad Request or no Data had passed" });
      }
  
      const user = await UserModel.findById(id);
  
      if (!user) {
        return res.status(404).json({ message: "Mentor not found" });
      }
  
     const mentor = await UserModel.updateOne(req.body)
      await user.save();
  
      res.status(200).json({ message: "Mentor updated successfully" });
  } catch (error) {
    console.log(error);
    res.status(500).send({ message: "Internal Server Error", error });
  }
})

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
    console.log(req.body)
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
