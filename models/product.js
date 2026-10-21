const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, "Please add a product name"],
        trim: true
    },
    category: {
        type: String,
        required: [true, "Please add a category"],
        trim: true
    },
    price: {
        type: Number,
        required: [true, "Please add a price"],
        min: [0.01, "Price must be greater than zero"]
    },
    stock: {
        type: Number,
        required: [true, "Please add stock quantity"],
        min: [0, "Stock cannot be negative"],
        validate: {
            validator: Number.isInteger,
            message: "Stock must be a whole number"
        }
    },
    tag: {
        type: String,
        trim: true
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'mainUser',
        required: true
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Product', productSchema);
