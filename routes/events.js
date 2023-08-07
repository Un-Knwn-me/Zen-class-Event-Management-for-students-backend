var express = require("express");
var router = express.Router();
const moment = require("moment");
const { EventModel } = require("../schema/eventSchema");
const { isSignedIn } = require("../config/auth");

// Get all events
router.get("/all-events", isSignedIn, async (req, res) => {
  try {
    const events = await EventModel.find({}).sort({
      startDate: 1,
      startTime: 1,
    });

    if (events.length > 0) {
      res
        .status(200)
        .json({
          message: "The Events list are:",
          events,
          count: events.length,
        });
    } else {
      res
        .status(404)
        .json({ message: "No events found", count: events.length });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal Server Error", error });
  }
});

// Add new event
router.post("/add", isSignedIn, async (req, res) => {
  try {
    const createdBy = req.user.firstName + " " + req.user.lastName;
    const Sdate = req.body.startDate;
    const startDate = moment.parseZone(Sdate.substring(0, Sdate.length-6), 'YYYY-MM-DDTHH:mm').startOf("day").toDate();
    const endDate =moment(startDate).add(1, "day").toDate();

   
    // Check if the slot and batch are available for the event
    const existingEvent = await EventModel.findOne({
      $and: [
        { startDate: { $gte: startDate } },
        { startDate: { $lt: endDate } },
        { batch: req.body.batch }
      ]
    });
   
    if (!existingEvent) { 
      let data = new EventModel({
        ...req.body,
        startDate: moment.parseZone(req.body.startDate).toDate(),
        createdBy,
        updatedBy: "",
        updatedAt: ""
      });
      await data.save();
    } else {
      return res.status(401).json({ message: "Event slot unavailable" });
    }
    res.status(200).json({ message: "Event added successfully" });
  } catch (error) {
    console.log(error);
    res.status(500).send({ message: "Internal Server Error", error });
  }
});

// Get events by month
router.get("/bymonth", isSignedIn, async (req, res) => {
  const { month, year } = req.body;

  try {
    const startDate = moment(`${year}-${month}-01`, "YYYY-MM-DD")
      .startOf("month")
      .toDate();
    const endDate = moment(startDate).endOf("month").toDate();

    const events = await EventModel.find({
      startDate: { $gte: startDate },
      endDate: { $lte: endDate },
    }).sort({ startDate: 1, startTime: 1 });

    if (events.length > 0) {
      res.status(200).json({ message: "Events found", events });
    } else {
      res
        .status(404)
        .json({ message: "No events found for the specified month and year" });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal Server Error", error });
  }
});

// Get events by date
router.get("/bydate/:date", async (req, res) => {
  try {
    const date = req.params.date;
    const startDate = moment.parseZone(date.substring(0, date.length-6), 'YYYY-MM-DDTHH:mm:ss.SSS').startOf("day").toDate();
    const endDate =moment(startDate).add(1, "day").toDate();

    console.log(startDate, endDate)
    
    // const endDate = moment(startDate).endOf("day").toDate();

    const events = await EventModel.find({
      $and: [
        { startDate: { $gte: startDate } },
        { startDate: { $lt: endDate } },
      ]
    }).sort({ startDate: 1, startTime: 1 });

    if (events.length > 0) {
      res.status(200).json({ message: "Events found", events });
    } else {
      res
        .status(404)
        .json({ message: "No events found for the specified date" });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal Server Error", error });
  }
});


// Get events by week
router.get("/byweek", isSignedIn, async (req, res) => {
  const { startDate, endDate } = req.body;

  try {
    const startOfWeek = moment(startDate, "YYYY-MM-DD").startOf("week");
    const endOfWeek = moment(endDate, "YYYY-MM-DD").endOf("week");

    const events = await EventModel.find({
      startDate: { $gte: startOfWeek.toDate(), $lte: endOfWeek.toDate() },
    }).sort({ startDate: 1, startTime: 1 });

    if (events.length > 0) {
      res.status(200).json({ message: "Week's events found", events });
    } else {
      res
        .status(404)
        .json({ message: "No events found for the specified week" });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal Server Error", error });
  }
});

// Get event by id
router.get('/:id', isSignedIn, async(req, res)=>{
  try {
      const { id } = req.params;
      let events = await EventModel.findById(id);

      res.status(200).json( events );
  } catch (error) {
      console.log(error);
      res.status(500).json({ message:"Internal Server Error", error });
  }
})


// Update the event
router.put("/update/:id", isSignedIn, async (req, res) => {
  try {
    const { id } = req.params;
    const updatedData = req.body;
    const updatedBy = req.user.firstName + " " + req.user.lastName;

    if (!id || !updatedData) {
      return res
        .status(400)
        .json({ message: "Bad Request or no Data had passed" });
    }

    const event = await EventModel.findById(id);

    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    event.title = updatedData.title || event.title;
    event.description = updatedData.description || event.description;
    event.category = updatedData.category || event.category;
    event.venue = updatedData.venue || event.venue;
    event.batch = updatedData.batch || event.batch;
    event.batchId = updatedData.batchId || event.batchId;
    event.startDate = updatedData.startDate || event.startDate;
    event.endDate = updatedData.endDate || event.endDate;
    event.updatedBy = updatedBy; // append the updated user
    event.updatedAt = Date.now(); // append the updated date and time

    await event.save();

    res.status(200).json({ message: "Event updated successfully" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal Server Error", error });
  }
});

// Delete an event
router.delete("/delete/:id", isSignedIn, async (req, res) => {
  try {
    const { id } = req.params;
    const data = await EventModel.deleteOne({ _id: id });
    res.status(201).json({ message: "Event removed successfully" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal Server Error", error });
  }
});

module.exports = router;
