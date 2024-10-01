const mongoose = require('mongoose')

const UserSchema = new mongoose.Schema ({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    savedItems: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'product' // Reference the Product model
        }
    ],
    cartItems: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'product' // Reference the Product model
        }
    ]

})

const userModel = mongoose.model("users", UserSchema)
module.exports = userModel;