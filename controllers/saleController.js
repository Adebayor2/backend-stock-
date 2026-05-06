const Sale = require('../models/sale');
const Product = require('../models/product');

const createSale = async (req, res) => {
    try {
        const { productId } = req.body;
        console.log("Sale attempt for product:", productId);
        console.log("User from token:", req.user);

        const product = await Product.findById(productId);

        if (!product) {
            console.log("Product not found:", productId);
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
            user: req.user.id || req.user._id,
            date: new Date()
        });

        await sale.save();

        // Decrement product stock
        product.stock -= 1;
        await product.save();

        console.log("Sale recorded successfully for:", product.name);
        res.status(201).json({ message: 'Sale recorded successfully', sale, product });
    } catch (error) {
        console.error('Error creating sale:', error);
        res.status(500).json({ message: 'Internal server error', error: error.message });
    }
};

const getSales = async (req, res) => {
    try {
        const userId = req.user.id || req.user._id;
        const sales = await Sale.find({ user: userId }).sort({ date: -1 });
        res.status(200).json(sales);
    } catch (error) {
        console.error('Error fetching sales:', error);
        res.status(500).json({ message: 'Internal server error', error: error.message });
    }
};

const getRevenueStats = async (req, res) => {
    try {
        const userId = req.user.id || req.user._id;
        const sales = await Sale.find({ user: userId });
        
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();

        const monthlyRevenue = sales.reduce((total, sale) => {
            const saleDate = new Date(sale.date);
            if (saleDate.getMonth() === currentMonth && saleDate.getFullYear() === currentYear) {
                return total + (sale.price || 0);
            }
            return total;
        }, 0);

        const totalSales = sales.length;
        const totalRevenue = sales.reduce((total, sale) => total + (sale.price || 0), 0);
        const averageOrderValue = totalSales > 0 ? Math.round(totalRevenue / totalSales) : 0;

        res.status(200).json({
            monthlyRevenue,
            totalSales,
            averageOrderValue,
            recentSales: sales.slice(-10).reverse()
        });
    } catch (error) {
        console.error('Error fetching revenue stats:', error);
        res.status(500).json({ message: 'Internal server error', error: error.message });
    }
};

const adminGetRevenueStats = async (req, res) => {
    try {
        // Find all sales across all users
        const sales = await Sale.find().populate('user', 'firstName lastName email');
        
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();

        const monthlyRevenue = sales.reduce((total, sale) => {
            const saleDate = new Date(sale.date);
            if (saleDate.getMonth() === currentMonth && saleDate.getFullYear() === currentYear) {
                return total + (sale.price || 0);
            }
            return total;
        }, 0);

        const totalSales = sales.length;
        const totalRevenue = sales.reduce((total, sale) => total + (sale.price || 0), 0);
        
        // Calculate revenue per user
        const revenuePerUser = {};
        sales.forEach(sale => {
            const userId = sale.user?._id?.toString() || 'Unknown';
            const userName = sale.user ? `${sale.user.firstName} ${sale.user.lastName}` : 'Unknown User';
            
            if (!revenuePerUser[userId]) {
                revenuePerUser[userId] = {
                    name: userName,
                    revenue: 0,
                    salesCount: 0
                };
            }
            revenuePerUser[userId].revenue += (sale.price || 0);
            revenuePerUser[userId].salesCount += 1;
        });

        res.status(200).json({
            monthlyRevenue,
            totalSales,
            totalRevenue,
            revenuePerUser: Object.values(revenuePerUser),
            recentSales: sales.slice(-20).reverse()
        });
    } catch (error) {
        console.error('Error fetching admin revenue stats:', error);
        res.status(500).json({ message: 'Internal server error', error: error.message });
    }
};

module.exports = { createSale, getSales, getRevenueStats, adminGetRevenueStats };
