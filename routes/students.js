var express = require("express");
var router = express.Router();
const { hashCompare, hashPassword, createToken, isSignedIn } = require("../config/auth");
const nodemailer = require("nodemailer");
const { StudentModel } = require("../schema/batchSchema");
require("dotenv").config();

fe_url = "http://localhost:3000";

// Get all students
router.get('/list', isSignedIn, async (req, res) => {
  try {
      const data = await StudentModel.find({});
      res.status(200).json({ students: data });
    } catch (error) {
      console.log(error);
      res.status(500).json({ message: "Internal Server Error", error });
    }
});

// Get student by id
router.get('/:id', isSignedIn, async(req, res)=>{
  try {
      const { id } = req.params;
      let student = await StudentModel.findById(id);

      res.status(200).json( student );
  } catch (error) {
      console.log(error);
      res.status(500).json({ message:"Internal Server Error", error });
  }
})

// Add new student
router.post("/add", isSignedIn, async (req, res) => {
    try {
      let stud = await StudentModel.findOne({ email: req.body.email });
      let stuemail = req.body.email;
      let pass = req.body.password
  
      if (!stud) {
        req.body.password = await hashPassword(req.body.password);
        const createdBy = req.user.firstName + ' ' + req.user.lastName;
        let token = Math.random().toString(36).slice(-8); // Initialize token here
        let data = new StudentModel({ 
            fullName: req.body.fullName,
            email: req.body.email,
            mobile: req.body.mobile,
            password: req.body.password,
            batch: req.body.batch,
            resetlink: token,
            createdBy,
            resetExpiresAt: Date.now() + 360000 });
        await data.save();
  
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth:{
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASSWORD
            }
        });
  
        const message = {
          from: process.env.EMAIL_USER,
          to: stuemail,
          subject: "password for zen account",
          text: `Dear ${data.fullName}, 
          Your password to login to Zen account is ${pass}.
          The Credential for your Zen account can be set through the following link: 
          ${fe_url}/reset-password/${data.id}/${token}`,
        };
  
        transporter.sendMail(message, (error, info) => {
          if (error) {
            console.log(error);
            res.status(500).json({ message: "Something went wrong. Please try again." });
          } else {
            console.log(info.response);
            res.status(200).json({ message: "User signed up successfully. Password sent." });
          }
        });
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
    let user = await StudentModel.findOne({ email: req.body.email });
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

router.post('/forgot-password', async (req, res)=>{
    try {
      let user = await StudentModel.findOne({email: req.body.email})
        if(user){
          let token = Math.random().toString(36).slice(-8);
          user.resetlink = token;
          user.resetExpiresAt = Date.now() + 360000 //1hr
          await user.save()
  
          const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth:{
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASSWORD
            }
        });
   
        const message = {
          from: process.env.EMAIL_USER,
          to: user.email,
          subject: "password reset request",
          text: `To reset your password, Kindly click on the following link reset your password:
               ${fe_url}/reset-password/${user.id}/${token}
           Kindly ignore the mail if you have not requested a password reset.`
      }
  
      transporter.sendMail(message, (error, info)=>{
        if(error){
          res.status(404).json({message: "Something went wrong. Please try again."})
        }
        console.log(info.response)
        res.status(200).json({message: "Password reset requested successfully"})
      })
  
        } else {
            res.status(404).send({message: "User not found"})
        }  
    } catch (error) {
      console.log(error);
      res.status(500).json({ message: "Internal Server Error", error });
    }
  })

router.post("/reset-password/:id/:token", async (req, res) => {
  const { token } = req.params;
  const { _id } = req.params;
  const { password } = req.body;

  try {
    // const data = await decodeToken(token);
    const user = await StudentModel.findOne({
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

// Update student
router.put("/update/:id", isSignedIn, async(req,res)=>{
    try {
        const { id } = req.params;
        const updatedData = req.body;
    
        if (!id || !updatedData) {
          return res.status(404).json({ message: "Bad Request or no Data had passed" });
        }
    
        const stud = await StudentModel.findById(id);
    
        if (!stud) {
          return res.status(404).json({ message: "Student not found" });
        }
    
        stud.fullName = updatedData.fullName || stud.fullName;
        stud.email = updatedData.email || stud.email;
        stud.mobile = updatedData.mobile || stud.mobile;
        stud.batch = updatedData.batch || stud.batch;

        await stud.save();
    
        res.status(200).json({ message: "Student updated successfully" });
    } catch (error) {
      console.log(error);
      res.status(500).send({ message: "Internal Server Error", error });
    }
  })

// Delete student
router.delete('/delete/:id', isSignedIn, async(req, res)=> {
    try {
        const { id } = req.params;
        const data = await StudentModel.deleteOne({ _id: id });
        res.status(201).json({ message: "Student removed successfully" });
    } catch (error) {
        console.log(error);
      res.status(500).send({ message: "Internal Server Error", error });
    }
})

module.exports = router;
