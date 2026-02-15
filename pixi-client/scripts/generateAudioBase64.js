import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const audioDir = path.resolve(__dirname, "../audio");
const outputFile = path.resolve(__dirname, "../src/js/audioData.ts");

function getMimeType(ext) {
    switch (ext) {
        case "mp3": return "audio/mpeg";
        case "wav": return "audio/wav";
        case "ogg": return "audio/ogg";
        default: return "audio/mpeg";
    }
}

const files = fs.readdirSync(audioDir);

let output = `export const AUDIO_DATA: Record<string, string> = {\n`;

files.forEach(file => {
    const fullPath = path.join(audioDir, file);
    const ext = path.extname(file).replace(".", "");
    const name = path.basename(file, "." + ext);

    const safeKey = name
        .replace(/\s+/g, "_")
        .replace(/[^a-zA-Z0-9_]/g, "")
        .toLowerCase();

    const data = fs.readFileSync(fullPath);
    const base64 = data.toString("base64");
    const mime = getMimeType(ext);

    output += `  ${safeKey}: "data:${mime};base64,${base64}",\n`;
});

output += `};\n`;

fs.writeFileSync(outputFile, output);

console.log("✅ audioData.ts regenerated successfully");
