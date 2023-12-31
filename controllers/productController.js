const express=require("express")
const productController=express()
const multer=require('multer')
const path=require("path")
const Products=require("../models/productModel")
const User= require("../models/userModel")
const Categories = require("../models/categoryModel")
const sharp=require("sharp")
const upload = multer({ dest: '/public/uploads/' });
const fs=require("fs")
const Category = require("../models/categoryModel")



const insertProduct = async (req, res) => {
    try {
        // Extract the uploaded images
        const images = req.files.map(file => file.filename);

        const { name, description, price, offerprice, category, status, quentity, date } = req.body;

        const newProduct = new Products({
            name,
            description,
            price,
            offerprice,
            category,
            status,
            quentity,
            date,
            image: images,
        });

       
        await newProduct.save();

        const promises = images.map(async (image) => {
            const originalImagePath = path.join(__dirname, '../public/uploads', image);
            const resizedPath = path.join(__dirname, '../public/uploads', 'resized_' + image);

            // await sharp(originalImagePath)
            //     .resize(800, 1200, { fit: 'fill' })
            //     .toFile(resizedPath);
        });

        await Promise.all(promises);

        res.status(200).send("Product added successfully");
    } catch (error) {
        console.error(error);
        res.status(500).send("Internal Server Error");
    }
};


const loadAllproduct=async(req,res)=>{
    try {
        const productData=await Products.find()
        res.render('allproduct',{productData})
    } catch (error) {
        console.log(error.message);
    }
}


//load addproduct
const loadAddproducts=async(req,res)=>{
    try {
        res.render("addproduct")
    } catch (error) {
        console.log(error.message);
    }
}

//Adding dropdownbutton in a add product category
const addproductCategory=async(req,res)=>{
    try {
        const categories=await Category.find()
        res.render("addproduct",{categories})
    } catch (error) {
        console.log(error.message);
    }
}


//listing and unlisting Product
const listunlistProduct = async (req, res) => {
    try {
        const id = req.query.id;
        const product = await Products.findOne({ _id: id });
        if (product) {
            const newStatus = product.is_listed === "Listed" ? "Unlisted" : "Listed";
            const updatedProduct = await Products.findByIdAndUpdate(id, { $set: { is_listed: newStatus } }, { new: true });
            const allProducts = await Products.find();
            res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
            res.setHeader('Pragma', 'no-cache');
            res.setHeader('Expires', '0');

            res.redirect("/admin/allproduct")
        } else {
            res.send("Unlisting failed");
        }
    } catch (err) {
        console.log(err.message);
        res.status(500).send("Internal Server Error");
    }
};


//Load edit product
const loadEditProduct = async (req, res) => {
    try {
        const productId = req.query.id; 
        const product = await Products.findById(productId);  
        const categories = await Categories.find(); 
        res.render("editproduct", { product, categories });
    } catch (error) {
        console.log(error.message);
    }
}

//edit product 

const handleEditProduct = async (req, res) => {
    try {
        const productId = req.params.id;
        const { name, description, price, offerprice, category, quentity } = req.body;
        const images = req.files ? req.files.map(file => file.filename) : [];

        const existingProduct = await Products.findById(productId);

        if (!existingProduct) {
            return res.status(404).send('Product not found');
        }

     
        if (images.length > 0) {
           
            const remainingSlots = 5 - existingProduct.image.length;
            const imagesToPush = images.slice(0, remainingSlots);
            for (let i = 0; i < imagesToPush.length; i++) {
                const originalImagePath = path.join(__dirname, '../public/uploads', imagesToPush[i]);
                const resizedPath = path.join(__dirname, '../public/uploads', `resized_${imagesToPush[i]}`);
                // Resize image using sharp
                await sharp(originalImagePath)
                    .resize(800, 1200, { fit: 'fill' })
                    .toFile(resizedPath);


                // Push the resized filename to the array
                existingProduct.image.push(`resized_${imagesToPush[i]}`);
            }
        }
        // Update other product details
        existingProduct.name = name;
        existingProduct.description = description;
        existingProduct.price = price;
        existingProduct.offerprice = offerprice;
        existingProduct.category = category;
        existingProduct.quentity = quentity;
        // Save the updated product
        await existingProduct.save();
        res.redirect("/admin/allproduct");
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Internal Server Error');
    }
};


//delete image

const deleteimage = async (req, res) => {
    try {
        const index = req.query.index;

        // Assuming you have a product object with an 'image' property
        const product = await Products.findOne({ _id: req.query.id });

        // Check if the product is found
        if (!product) {
            return res.status(404).send('Product not found');
        }

        // Check if the index is valid
        if (index >= 0 && index < product.image.length) {
            // Get the filename of the image at the specified index
            const filenameToDelete = product.image[index];

            // Construct the file path
            const filePath = path.join(__dirname, '../public/uploads', filenameToDelete);

            // Delete the file
            fs.unlinkSync(filePath);
             // fs.promises.unlink(filePath)

            // Update the database to remove the image reference
            await Products.findByIdAndUpdate(product._id, { $pull: { image: filenameToDelete } });

            // Send a success response
            res.redirect(`/admin/editproduct?id=${req.query.id}`);
        } else {
            res.status(400).send('Invalid index');
        }
    } catch (error) {
        console.log(error.message);
        res.status(500)
    }
};

//single product

const singleProduct = async (req, res) => {
    try {
        const queryProduct = req.query.id;
        const viewProduct = await Products.findById(queryProduct).populate('category').exec(); 
        console.log(viewProduct);

        const relatedProduct = await Products.find({
            category: viewProduct.category,
            _id: {
                $ne: viewProduct._id
            }
        }).limit(4);

        res.render("eachproduct", {
            products: viewProduct, 
            viewProduct,
            relatedProduct: relatedProduct 
        });
    } catch (err) {
        console.log(err);
        res.status(500).send('Internal Server Error');
    }
};

const productDelete = async (req, res) => {
    try {
        const productId = req.query.id;
        const deleteProduct = await Products.findByIdAndDelete(productId);
        res.redirect("/admin/allproduct");
    } catch (error) {
        console.log(error.message);
        res.status(500).send('Internal Server Error');
    }
};





module.exports={insertProduct,
    loadAllproduct,
    loadAddproducts,
    addproductCategory,
    listunlistProduct,
    loadEditProduct,
    handleEditProduct,
    singleProduct,
    deleteimage,
    productDelete}