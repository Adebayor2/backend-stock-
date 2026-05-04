const Category = require('../models/category.js');

// Add a new category
const addCategory = async (req, res) => {
    try {
        const { name, description } = req.body;
        if (!name) {
            return res.status(400).json({ message: "Category name is required" });
        }

        const categoryExists = await Category.findOne({ name: name.trim() });
        if (categoryExists) {
            return res.status(400).json({ message: "Category already exists" });
        }

        const category = await Category.create({
            name: name.trim(),
            description,
            createdBy: req.user.id
        });

        res.status(201).json(category);
    } catch (error) {
        console.error("Error adding category:", error);
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
        const category = await Category.findById(id);
        if (!category) {
            return res.status(404).json({ message: "Category not found" });
        }

        await category.deleteOne();
        res.status(200).json({ message: "Category deleted successfully" });
    } catch (error) {
        console.error("Error deleting category:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

module.exports = { addCategory, getCategories, deleteCategory };
