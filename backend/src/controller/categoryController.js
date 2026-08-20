import Category from "../models/category.model.js";
export const getCategories = async (req, res)=>{
  try {
    const categories = await Category.find({ user: req.user._id }).sort({ name: 1 });
    res.status(200).json({ categories });
  } catch (error) {
    console.error("Get categories error:", error);
    res.status(500).json({
      message: "Failed to get categories",
      error: error.message,
    });
  }
};
export const createCategory = async (req,res)=>{
  try {
    const { name } = req.body;
    if (!name||!name.trim()){
      return res.status(400).json({
        message: "Category name is required",
      });
    }
    const trimmedName=name.trim();
    const existing = await Category.findOne({
      user: req.user._id,
      name: { $regex: new RegExp(`^${trimmedName}$`,"i") },
    });
    if (existing) {
      return res.status(200).json({
        message: "Category already exists",
        category: existing,
      });
    }
    const category = await Category.create({
      user: req.user._id,
      name: trimmedName,
    });
    res.status(201).json({
      message: "Category created successfully",
      category,
    });
  } catch (error) {
    console.error("Create category error:",error);
    res.status(500).json({
      message: "Failed to create category",
      error: error.message,
    });
  }
};
export const deleteCategory=async (req,res)=>{
  try {
    const category = await Category.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id,
    });
    if (!category) {
      return res.status(404).json({
        message: "Category not found",
      });
    }
    res.status(200).json({
      message: "Category deleted successfully",
    });
  } catch (error){
    console.error("Delete category error:",error);
    res.status(500).json({
      message: "Failed to delete category",
      error: error.message,
    });
  }
};