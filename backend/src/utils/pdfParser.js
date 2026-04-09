import fs from "fs";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const pdfParse = require("pdf-parse"); 

const extractTextFromPDF = async (filePath) => {
    try {
        const dataBuffer = fs.readFileSync(filePath);

        const data = await pdfParse(dataBuffer);

        return data.text;
    } catch (error) {
        console.error("PDF PARSE ERROR:", error);
        throw new Error("Failed to extract PDF text");
    }
};

export default extractTextFromPDF;