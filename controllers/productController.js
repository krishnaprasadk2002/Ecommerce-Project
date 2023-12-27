const express=require("express")
const productController=express()
const multer=require('multer')
const path=require("path")
const Products=require("../models/productModel")
const { deleteOne, findByIdAndDelete } = require("../models/userModel")



const insertProduct = async (req, res) => {
    try {
        
        const images = req.files.map(file => file.filename);

       
        const { name, description, price, offerprice, Category, status, quentity, date } = req.body;

        const newProduct = new Products({
            name,
            description,
            price,
            offerprice,
            Category,
            status,
            quentity,
            date,
            image: images,
        });

       
        await newProduct.save();

        res.status(200).send("Product added successfully");
    } catch (error) {
        console.error(error);
        res.status(500).send("Internal Server Error");
    }
};


const productActive = async (req, res) => {
    try {
        const productId = req.params.id; 
        const check = await Products.findByIdAndUpdate({ _id: productId }, { status: "Active" });
        const status = check.status;
        res.json({ status: status });
    } catch (error) {
        console.log(error.message);
        res.status(500).json({ error: error.message });
    }
};

const productBlock = async (req, res) => {
    try {
        const productId = req.params.id; 
        const check = await Products.findByIdAndUpdate(
            { _id: productId },
            { status: "Block" },
            { new: true }
        );
        const status = check.status;
        res.json({ status: status });
    } catch (error) {
        console.log(error.message);
        res.status(500).json({ error: error.message });
    }
};




module.exports={insertProduct,productActive,productBlock}