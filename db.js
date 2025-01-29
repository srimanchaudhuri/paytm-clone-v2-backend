const mongoose = require("mongoose")

mongoose.connect(
    "mongodb+srv://srimanchaudhuri:simonsurfer123@cluster0.7gr0ss0.mongodb.net/"
  )
  .then(() => {
    console.log("Connection with db established");
  })
  .catch(() => {
    console.error("Problem connecting to db check connection string")
  })

  const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true,
        minLength: 3,
        maxLength: 30
    },
    password: {
        type: String,
        required: true,
        minLength: 6
    },
    firstName: {
        type: String,
        required: true,
        trim: true,
        maxLength: 50
    },
    lastName: {
        type: String,
        required: true,
        trim: true,
        maxLength: 50
    }
});

const accountSchema = new mongoose.Schema({
    balance: {
        type: Number,
        required: true,
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    }
});

  const User = mongoose.model("User", userSchema)
  const Account = mongoose.model("Account", accountSchema)


  module.exports = {User, Account}
  
