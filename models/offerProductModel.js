const mongoose =require('mongoose');
const offerproductSchema =new mongoose.Schema({
    name:{
        type:String,
        required:[true,"Please enter product name"],
        trim:true,
        maxLength:[100,"Product name cannot exceed 100 characters"]
    },
    price:{
        type:Number,
        required:true, 
        default:0.0
    },
    offerprice:{
        type:Number,
        required:true, 
        default:0.0
    },
    description:{ 
        type:String,
        required:[true,"Please enter product description"]
    },
    ratings:{ 
        type:String,
        default:0
    },
    images:[
        {
            image:{
                type:String,
                required:true
            }
        }
    ],
    category: {
        type:String,
        required:[true,"PLEASE ENTER product category"],
        enum:{
            values:[
                'SNACKS',
                'GROCERIES',
                'HERBAL',
                'CANDIES',
                'SWEETS',
                'RICE',
                'OIL',
                'HOMEAPPLIANCES', 
                'POOJAITEMS',
            ],
            message:"Please select correct category"
        }
    },
    Brand:{
        type:String,
        required:[true,"Please enter product brand"]
    },
    stock:{
        type:Number,
        required:[true,"Please enter product stock"],
        maxLength:[20,'Product stock cannot exceed 20']
    },
    numofReviews:{
        type:Number,
        default:0
    },
    reviews:[
        {
            user:{
                type:mongoose.Schema.Types.ObjectId,
                ref: 'User'
            },
            rating:{
                type:String,
                required:true
            },
            comment:{
                type:String,
                required:true
            }

           
        }

    ],
    user:{
        type:mongoose.Schema.Types.ObjectId
    },
    createdAt:{
        type:Date,
        default:Date.now()
    }
})
let schema= mongoose.model('offerProduct',offerproductSchema)
module.exports=schema