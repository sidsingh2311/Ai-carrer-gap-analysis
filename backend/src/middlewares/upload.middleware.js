import multer from "multer";
import path from "path";
import fs from "fs";

// absolute uploads path
const uploadPath = path.join(process.cwd(), "uploads");

// ensure folder exists
if (!fs.existsSync(uploadPath)) {
    fs.mkdirSync(uploadPath);
}

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadPath);
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + "-" + file.originalname);
    }
});

const upload = multer({ storage });

export default upload;