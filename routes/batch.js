var express = require('express');
var router = express.Router();
const { isSignedIn } = require('../config/auth');
const { BatchModel } = require('../schema/batchSchema');
const moment = require("moment");
require('dotenv').config();

// Get all batch list
router.get('/list', isSignedIn, async (req, res) => {
    try {
        const data = await BatchModel.find({});
        res.status(200).json({ batches: data });
      } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Internal Server Error", error });
      }
});

// Get batch by id
router.get('/:id', isSignedIn, async(req, res)=>{
  try {
      const { id } = req.params;
      let batch = await BatchModel.findById(id);
      if(!batch){
        res.status(404).json({ message: "No data" })
      }
  
      const outputFormat = 'MMM DD YYYY, hh:mm A';
     
      const formattedBatch = {
        ...batch._doc,
      startDate: moment(batch.startDate).format(outputFormat),
      createdAt: moment(batch.createdAt).format(outputFormat),
      }
      if (batch.updatedAt) {
        formattedBatch.updatedAt = moment(batch.updatedAt).format(outputFormat);
      }
      res.status(200).json( formattedBatch );
  } catch (error) {
      console.log(error);
      res.status(500).json({ message:"Internal Server Error", error });
  }
})

// Post a batch
router.post('/add', isSignedIn, async (req, res) => {
    try {
        const existingBatch = await BatchModel.findOne({ batch: req.body.batch });
        if(!existingBatch){
        const createdBy = req.user.firstName + ' ' + req.user.lastName;
        let data = new BatchModel({ ...req.body, createdBy, startDate: moment.parseZone(req.body.startDate).toDate(), updatedBy: "", updatedAt: "" }); 
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
  router.put("/update/:id", isSignedIn, async (req, res) => {
    try {
      const { id } = req.params;
      const updatedData = req.body;
      const updatedBy = req.user.firstName + " " + req.user.lastName;
  
      if (!id || !updatedData) {
        return res.status(400).json({ message: "Bad Request or no Data had been passed" });
      }
  
      const batch = await BatchModel.findById(id);
  
      if (!batch) {
        return res.status(404).json({ message: "Batch not found" });
      }
  
  
      // Check if mentor is being updated and add the existing mentor to prevMentors
      if (updatedData.mentor && updatedData.mentor !== batch.mentor) {
        batch.prevMentors.push(batch.mentor);
      }
      
      batch.batch = updatedData.batch || batch.batch;
      batch.category = updatedData.category || batch.category;
      batch.mentor = updatedData.mentor || batch.mentor;
      batch.prevMentors = updatedData.prevMentors || batch.prevMentors;
      batch.startDate = updatedData.startDate || batch.startDate;
      batch.updatedBy = updatedBy; // append the updated user
      batch.updatedAt = Date.now(); // append the updated date and time
  
      await batch.save();
  
      res.status(200).json({ message: "Batch updated successfully" });
    } catch (error) {
      console.log(error);
      res.status(500).send({ message: "Internal Server Error", error });
    }
  });
  
// Delete batch
router.delete('/delete/:id', isSignedIn, async(req, res)=> {
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
