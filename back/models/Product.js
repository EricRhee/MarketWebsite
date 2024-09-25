const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    price: {
        type: Number,
        required: true
    },
    imageUrl: {
        type: String,
        required: true
    },
    trending: {
        type: Boolean,
        required: true
    },
    discounted: {
        type: Boolean,
        required: true
    },
    seasonal: {
        type: Boolean,
        required: true
    },
    general: {
        type: Boolean,
        required: true
    },
    discount: {
        type: Number,
        required: false
    }
});

const ProductModel = mongoose.model('product', ProductSchema);
module.exports = ProductModel;
