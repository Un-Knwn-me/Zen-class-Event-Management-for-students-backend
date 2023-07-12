const mongoose = require('mongoose')
const validator = require('validator')
require('dotenv').config();

const userSchema = new mongoose.Schema({
    firstName:{
        type: String,
        required: true
    },
    lastName:{
        type: String,
        required: true
    },
    email:{
        type: String,
        lowercase: true,
        required: true,
        validate:(value)=>validator.isEmail(value)
    },
    password:{
        type: String,
        required: true
    },
    resetlink:{
        type: String,
        default: ''
    },
    resetExpiresAt:{
        type: Date,
        default:''
    },
    token:{
        type: String,
        default: ''
    },
    role:{
        type: String,
        default: "Mentor"
    },
    status:{
        type: String,
        default: "Available"
    },
    createdAt:{
        type: Date,
        default: Date.now()
    }
}, {versionKey: false, collection:"user"})

const UserModel = mongoose.model('user', userSchema)
module.exports = {UserModel};