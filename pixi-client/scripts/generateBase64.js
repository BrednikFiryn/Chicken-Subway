import fs from "fs";
import path from "path";

const inputDir = "public/assets";
const outputFile = "src/js/imageData.js";

const exts = [".png", ".jpg", ".jpeg", ".gif", ".webp"];

function encodeImage(filePath) {
    const ext = path.extname(filePath).toLowerCase().replace(".", "");
    const mime = ext === "jpg" ? "jpeg" : ext;
    const base64 = fs.readFileSync(filePath, "base64");
    return `data:image/${mime};base64,${base64}`;
}

const result = {};
fs.readdirSync(inputDir).forEach(file => {
    const ext = path.extname(file).toLowerCase();
    if (exts.includes(ext)) {
        const name = path.basename(file, ext);
        result[name] = encodeImage(path.join(inputDir, file));
    }
});

const output = `export const IMAGE_DATA = ${JSON.stringify(result, null, 2)};`;
fs.writeFileSync(outputFile, output);
console.log(` Base64 image data generated in ${outputFile}`);
