import Product from "../models/product.model.js";
import cloudinary from "../lib/cloudinary.js";
import { redis } from "../lib/redis.js";
export const getAllProducts = async (req, res) => {
  try {
    const products = await Product.find({}); //findallProducts
    res.json({ products });
  } catch (error) {
    console.log("Error in getAllProducts controller: ", error.message);
    res.status(500).json({ message: "Server Error: ", error: error.message });
  }
};

export const getFeaturedProducts = async (req, res) => {
  try {
    // .lean is going to return JavaScript object rather than mongoDB object which is good
    // for performance.
    let featuredProducts = await redis.get("featured_products").lean();
    if (featuredProducts) {
      return res.json(JSON.parse(featuredProducts));
    }

    featuredProducts = await Product.find({ isFeatured: true });
    if (!featuredProducts) {
      return res.status(404).json({ message: "No feature Products found" });
    }

    await redis.set("featured_products: ", JSON.stringify(featuredProducts));
  } catch (error) {
    console.log("Error in getFeaturedProducts controller: ", error.message);
    res.status(500).json({ message: "Server Error: ", error: error.message });
  }
};

export const createProduct = async (req, res) => {
  try {
    const { name, description, price, image, category } = req.body;

    let cloudinaryResponse = null;

    if (image) {
      cloudinaryResponse = await cloudinary.uploader.upload(image, {
        folder: "products",
      });
    }

    const product = await Product.create({
      name,
      description,
      price,
      image: cloudinaryResponse.secure_url
        ? cloudinaryResponse?.secure_url
        : "",
      category,
    });

    res.status(201).json(product);
  } catch (error) {
    console.log("Error in createProduct controller: ", error.message);
    res.status(500).json({ message: "Server Error: ", error: error.message });
  }
};

export const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      res.status(404).json({ message: "Product not found" });
    }
    if (product.image) {
      const publicId = product.image.split("/").pop().split(".")[0];
      try {
        await cloudinary.uploader.destroy(`products/${publicId}`);
        console.log("Deleted Image from cloudinary");
      } catch (error) {
        console.log("error deleting in deleteing the image", error);
      }
    }

    await Product.findByIdAndDelete(req.params.id);
    res.json({ message: "Product deleted successfully" });
  } catch (error) {
    console.log("Error in deleteProduct controller: ", error.message);
    res.status(500).json({ message: "Server Error: ", error: error.message });
  }
};

export const getRecommendedProducts = async (req, res) => {
  try {
    const products = await Product.aggregate([
      {
        $sample: { size: 3 },
      },
      {
        $project: {
          id: 1,
          name: 1,
          description: 1,
          image: 1,
          price: 1,
        },
      },
    ]);

    res.json(products);
  } catch (error) {
    console.log("Error in getRecommendation controller: ", error.message);
    res.status(500).json({ message: "Server Error: ", error: error.message });
  }
};

export const getProductsByCategory = async (req, res) => {
  const { category } = req.params;
  try {
    const products = await Product.find({ category });
    res.json(products);
  } catch (error) {
    console.log("Error in getProductsByCategory controller: ", error.message);
    res.status(500).json({ message: "Server Error: ", error: error.message });
  }
};

export const toggleFeaturedProducts = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (product) {
      product.isFeatured = !product.isFeatured;
      const updatedProduct = await product.save();
      //update cache
      await updateFeaturedProductsCache();
      res.json(updatedProduct);
    }
  } catch (error) {
    console.log("Error in toggleFeaturedProducts controller: ", error.message);
    res.status(500).json({ message: "Server Error: ", error: error.message });
  }
};

async function updateFeaturedProductsCache() {
  try {
    //lean is used to return JS objects rather than full mongoDB documents
    const featuredProducts = await Product.find({ isFeatured: true }).lean();
    await redis.set("featured_products", JSON.stringify(featuredProducts));
  } catch (error) {
    console.error("Error updating Redis cache:", error);
  }
}
