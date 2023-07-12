var express = require('express');
var router = express.Router();
const { isSignedIn, roleAdmin } = require('../config/auth');
const { BatchModel } = require('../schema/batchSchema');
require('dotenv').config();

// Get all batch list
router.get('/list', isSignedIn, roleAdmin, async (req, res) => {
    try {
        const data = await BatchModel.find({});
        res.status(200).json({ batch: data });
      } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Internal Server Error", error });
      }
});

// Post a batch
router.post('/add', isSignedIn, roleAdmin, async (req, res) => {
    try {
        const existingBatch = await BatchModel.findOne({ batch: req.body.batch });
        if(!existingBatch){
        const createdBy = req.user.firstName + ' ' + req.user.lastName;
        let data = new BatchModel({ ...req.body, createdBy, updatedBy: "", updatedAt: "" }); 
      await data.save();
      res.status(200).json({ message: "Batch added successfully" });
    } else {
        res.status(401).json({ message: "Batch already existed" });
    }
      
    } catch (error) {
      console.log(error);
      res.status(500).send({ message: "Internal Server Error", error });
    }
  });
  
  // Update the details of an existing batch by id
  router.put("/update/:id", isSignedIn, roleAdmin, async(req,res)=>{
    try {
        const { id } = req.params;
        const updatedData = req.body;
        const updatedBy = req.user.firstName + " " + req.user.lastName;
    
        if (!id || !updatedData) {
          return res.status(404).json({ message: "Bad Request or no Data had passed" });
        }
    
        const batch = await BatchModel.findById(id);
    
        if (!batch) {
          return res.status(404).json({ message: "Batch not found" });
        }
    
        let updatedstartDate = batch.start_date;
    
        if (updatedData.start_date) {
          updatedstartDate = moment( updatedData.start_date, "DD.MM.YYYY", true ).toDate();
        }
    
        batch.category = updatedData.category || batch.category;
        batch.mentors = updatedData.mentors || batch.mentors;
        batch.start_date = updatedstartDate;
        batch.updatedBy = updatedBy; // append the updated user
        batch.updatedAt = Date.now(); // append the updated date and time
    
        await batch.save();
    
        res.status(200).json({ message: "Batch updated successfully" });
    } catch (error) {
      console.log(error);
      res.status(500).send({ message: "Internal Server Error", error });
    }
  })
  
// Delete batch
router.delete('/delete/:id', isSignedIn, roleAdmin, async(req, res)=> {
    try {
        const { id } = req.params;
        const data = await BatchModel.deleteOne({ _id: id });
        res.status(201).json({ message: "Batch removed successfully" });
    } catch (error) {
        console.log(error);
      res.status(500).send({ message: "Internal Server Error", error });
    }
})

module.exports = router;