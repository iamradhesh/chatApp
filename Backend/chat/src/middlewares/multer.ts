import multer from "multer";
import {CloudinaryStorage} from 'multer-storage-cloudinary'
import cloudinary from "../config/cloudinary.js";

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "chatApp-Images",
    allowedFormats: ["jpg", "png", "jpeg", "gif", "webp"],
    transformation:[{
        width:800,
        height:600,
        crop:"limit",
    },{quality: "auto"}]
  } as any,
});

export const upload = multer({ storage , limits: { fileSize: 5 * 1024 * 1024 },fileFilter:(req, file, cb) => {
    const allowedFormats = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    if (allowedFormats.includes(file.mimetype)) {
        return cb(null, true);
    }
    cb(new Error('Only image files are allowed!'));
}}); // 5MB limit