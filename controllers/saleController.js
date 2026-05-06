const Sale = require('../models/sale');
const Product = require('../models/product');

const createSale = async (req, res) => {
    try {
        const { productId } = req.body;
        const product = await Product.findById(productId);

        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        if (product.stock <= 0) {
            return res.status(400).json({ message: 'Product out of stock' });
        }

        // Create the sale record
        const sale = new Sale({
            product: product._id,
            productName: product.name,
            price: product.price,
            user: req.user.id,
            date: new Date()
        });

        await sale.save();

        // Decrement product stock
        product.stock -= 1;
        await product.save();

        res.status(201).json({ message: 'Sale recorded successfully', sale, product });
    } catch (error) {
        console.error('Error creating sale:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

const getSales = async (req, res) => {
    try {
        const sales = await Sale.find({ user: req.user.id }).sort({ date: -1 });
        res.status(200).json(sales);
    } catch (error) {
        console.error('Error fetching sales:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

const getRevenueStats = async (req, res) => {
    try {
        const sales = await Sale.find({ user: req.user.id });
        
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();

        const monthlyRevenue = sales.reduce((total, sale) => {
            const saleDate = new Date(sale.date);
            if (saleDate.getMonth() === currentMonth && saleDate.getFullYear() === currentYear) {
                return total + sale.price;
            }
            return total;
        }, 0);

        const totalSales = sales.length;
        const totalRevenue = sales.reduce((total, sale) => total + sale.price, 0);
        const averageOrderValue = totalSales > 0 ? Math.round(totalRevenue / totalSales) : 0;

        res.status(200).json({
            monthlyRevenue,
            totalSales,
            averageOrderValue,
            recentSales: sales.slice(-10).reverse()
        });
    } catch (error) {
        console.error('Error fetching revenue stats:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

module.exports = { createSale, getSales, getRevenueStats };
