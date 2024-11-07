const products=require('../data/offerProducts.json')
const Product=require('../models/offerProductModel')
const dotenv=require('dotenv')
const connectDatabase=require('../config/database')
dotenv.config({path:'config/config.env'});
connectDatabase();
const seedProducts1=async()=>{
    try {
        await Product.deleteMany();
    console.log(" Products deleted!");
    await Product.insertMany(products);
    console.log("All Products added");
        
    } 
    catch (error) {
        console.log(error.message);
    }
    process.exit();
}
seedProducts1()