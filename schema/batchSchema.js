const mongoose = require('mongoose');
const validator = require('validator');
require('dotenv').config();

const batchSchema = new mongoose.Schema(
  {
    batch: {
      type: String,
    },
    startDate: {
      type: Date,
    },
    category: {
      type: String,
    },
    mentor: {
      type: String,
    },
    prevMentors: {
      type: [String],
      default: []
    },
    createdAt: {
      type: Date,
      default: Date.now(),
      required: true
    },
    createdBy: {
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
  },
  { versionKey: false, collection: "batch" }
);

const studentSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  mobile: {
    type: Number,
    required: true,
  },
  password: {
    type: String
  },
  token: {
    type: String
  },
  resetlink: {
    type: String
  },
  resetExpiresAt: {
    type: Date
  },
  role: {
    type: String,
    default: "Student",
  },
  batch: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now(),
    required: true,
  },
  createdBy: {
    type: String,
    required: true
  },
}, { versionKey: false, collection: "student" });

const BatchModel = mongoose.model('batch', batchSchema);
const StudentModel = mongoose.model('student', studentSchema);
module.exports = { BatchModel, StudentModel };
