const mongoose = require('mongoose')
const validator = require('validator');
require('dotenv').config();

const eventSchema = new mongoose.Schema({
    title:{
         type: String,
         required: true 
    },
    description:{ 
        type: String,
        required: true
    },
    category:{ 
        type: String,
        required: true
    },
    venue:{ 
        type: String,
        required: true
    },
    startDate:{ 
        type: Date,
        default: Date.now(),
        sortable: true,
        required: true 
    },
    endDate:{ 
        type: Date,
        default: Date.now(), 
        sortable: true,
        required: true 
    },
    batch:{ 
        type: String,
        required: true
    },
    hostedBy: {
        type: String,
        required: true
    },
    createdAt:{ 
        type: Date,
        default: Date.now(), 
        sortable: true 
    },
    createdBy:{
        type: String,
        required: true
    },
    updatedAt:{ 
        type: Date, 
        sortable: true,
        default: Date.now() 
    },
    updatedBy:{
        type: String
    }
}, {versionKey: false, collection:"event"})

const EventModel = mongoose.model('event', eventSchema)
module.exports = {EventModel};