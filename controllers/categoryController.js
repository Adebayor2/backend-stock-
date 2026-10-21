const Category = require('../models/category.js');
const Product = require('../models/product');

// Add a new category
const addCategory = async (req, res) => {
    try {
        const { name, description } = req.body || {};
        if (typeof name !== 'string' || !name.trim()) {
            return res.status(400).json({ message: "Category name is required" });
        }
        if (description !== undefined && typeof description !== 'string') {
            return res.status(400).json({ message: "Category description must be text" });
        }

        const normalizedName = name.trim();
        const categoryExists = await Category.findOne({ name: normalizedName });
        if (categoryExists) {
            return res.status(400).json({ message: "Category already exists" });
        }

        const category = await Category.create({
            name: normalizedName,
            description,
            createdBy: req.user.id
        });

        res.status(201).json(category);
    } catch (error) {
        console.error("Error adding category:", error);
        if (error.code === 11000) {
            return res.status(409).json({ message: "Category already exists" });
        }
        res.status(500).json({ message: "Internal server error" });
    }
};

// Get all categories
const getCategories = async (req, res) => {
    try {
        const categories = await Category.find().populate('createdBy', 'firstName lastName');
        res.status(200).json(categories);
    } catch (error) {
        console.error("Error fetching categories:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

// Delete a category
const deleteCategory = async (req, res) => {
    try {
        const { id } = req.params;
        if (!/^[a-f\d]{24}$/i.test(id)) {
            return res.status(400).json({ message: "Invalid category ID" });
        }
        const category = await Category.findById(id);
        if (!category) {
            return res.status(404).json({ message: "Category not found" });
        }

        const categoryInUse = await Product.exists({ category: category.name });
        if (categoryInUse) {
            return res.status(409).json({ message: "Cannot delete a category used by products" });
        }

        await category.deleteOne();
        res.status(200).json({ message: "Category deleted successfully" });
    } catch (error) {
        console.error("Error deleting category:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

module.exports = { addCategory, getCategories, deleteCategory };
