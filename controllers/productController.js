const Product = require('../models/product');
const Category = require('../models/category');

const isNumericInput = (value) =>
    (typeof value === 'number' || typeof value === 'string' && value.trim() !== '') &&
    Number.isFinite(Number(value));

// Add a new product
const addProduct = async (req, res) => {
    try {
        const { name, category, price, stock, tag } = req.body || {};
        if (
            typeof name !== 'string' || !name.trim() ||
            typeof category !== 'string' || !category.trim() ||
            !isNumericInput(price) || Number(price) <= 0 ||
            !isNumericInput(stock) || !Number.isInteger(Number(stock)) || Number(stock) < 0 ||
            (tag !== undefined && typeof tag !== 'string')
        ) {
            return res.status(400).json({ message: "All required fields must be filled" });
        }

        const categoryExists = await Category.exists({ name: category.trim() });
        if (!categoryExists) {
            return res.status(400).json({ message: "Selected category does not exist" });
        }

        const product = await Product.create({
            name: name.trim(),
            category: category.trim(),
            price: Number(price),
            stock: Number(stock),
            tag: typeof tag === 'string' ? tag.trim() : '',
            createdBy: req.user.id
        });

        res.status(201).json(product);
    } catch (error) {
        console.error("Error adding product:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

// Get all products
const getProducts = async (req, res) => {
    try {
        const products = await Product.find().populate('createdBy', 'firstName lastName');
        res.status(200).json(products);
    } catch (error) {
        console.error("Error fetching products:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

// Update a product
const updateProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const allowedFields = ['name', 'category', 'price', 'stock', 'tag'];
        const updates = Object.fromEntries(
            Object.entries(req.body || {}).filter(([field]) => allowedFields.includes(field))
        );

        if (!/^[a-f\d]{24}$/i.test(id)) {
            return res.status(400).json({ message: "Invalid product ID" });
        }

        if (Object.keys(updates).length === 0) {
            return res.status(400).json({ message: "At least one valid product field is required" });
        }
        if (
            ('name' in updates && (typeof updates.name !== 'string' || !updates.name.trim())) ||
            ('category' in updates && (typeof updates.category !== 'string' || !updates.category.trim())) ||
            ('price' in updates && (!isNumericInput(updates.price) || Number(updates.price) <= 0)) ||
            ('stock' in updates && (!isNumericInput(updates.stock) || !Number.isInteger(Number(updates.stock)) || Number(updates.stock) < 0)) ||
            ('tag' in updates && typeof updates.tag !== 'string')
        ) {
            return res.status(400).json({ message: "Invalid product field value" });
        }

        if (typeof updates.name === 'string') updates.name = updates.name.trim();
        if (typeof updates.category === 'string') updates.category = updates.category.trim();
        if ('price' in updates) updates.price = Number(updates.price);
        if ('stock' in updates) updates.stock = Number(updates.stock);
        if (typeof updates.tag === 'string') updates.tag = updates.tag.trim();

        if ('category' in updates && !(await Category.exists({ name: updates.category }))) {
            return res.status(400).json({ message: "Selected category does not exist" });
        }

        const product = await Product.findById(id);

        if (!product) {
            return res.status(404).json({ message: "Product not found" });
        }

        const updatedProduct = await Product.findByIdAndUpdate(
            id,
            updates,
            { new: true, runValidators: true }
        );

        res.status(200).json(updatedProduct);
    } catch (error) {
        console.error("Error updating product:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

// Delete a product
const deleteProduct = async (req, res) => {
    try {
        const { id } = req.params;
        if (!/^[a-f\d]{24}$/i.test(id)) {
            return res.status(400).json({ message: "Invalid product ID" });
        }
        const product = await Product.findById(id);

        if (!product) {
            return res.status(404).json({ message: "Product not found" });
        }

        await product.deleteOne();
        res.status(200).json({ message: "Product deleted successfully" });
    } catch (error) {
        console.error("Error deleting product:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

module.exports = { addProduct, getProducts, updateProduct, deleteProduct };
