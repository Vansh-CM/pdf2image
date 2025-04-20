const express = require("express");
const multer = require("multer");
const sharp = require("sharp");
const fs = require("fs/promises");
const path = require("path");

// Dynamically import pdf-to-img (since it's an ES module)
const loadPdfToImg = async () => {
  const { pdf } = await import("pdf-to-img");
  return pdf;
};

const app = express();
const port = process.env.PORT || 3000;

// Define temp directory inside the project
const tempDir = path.join(__dirname, "temp");

// Ensure temp directory exists
const ensureTempDir = async () => {
  try {
    await fs.mkdir(tempDir, { recursive: true });
  } catch (error) {
    console.error("Error creating temp directory:", error);
  }
};
AazonS3Bucket = {
  ACCESSKEYID: 'AKIA5NYKLMULVA3GIGHD',              
  SECRETACCESSKEY: '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',
}

// Multer setup for handling file uploads
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Function to resize images if necessary
const resizeImage = async (buffer) => {
  const image = sharp(buffer);
  const metadata = await image.metadata();
  // console.log(metadata.width)
  if (metadata.width > 1275) {
    return image.resize({ width: 1275 }).toBuffer();
  }
  return buffer;
};

// Route to handle PDF upload and conversion
app.post("/convert", upload.single("file"), async (req, res) => {
  let name = req.body.name;
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    await ensureTempDir(); // Ensure the temp directory exists

    const pdf = await loadPdfToImg(); // Dynamically import pdf-to-img
    const tempFilePath = path.join(tempDir, "uploaded.pdf");
    await fs.writeFile(tempFilePath, req.file.buffer); // Save the file in temp/

    const document = await pdf(tempFilePath, { scale: 5 });
    let counter = 1;
    let images = [];

    for await (const image of document) {
      const resizedImage = await resizeImage(image);
      const imageName = `${name}-${counter}.png`;
      const imagePath = path.join(tempDir, imageName);
      // await fs.writeFile(imagePath, resizedImage); // Save image in temp/

      images.push({
        name: imageName,
         image: resizedImage,
      });
      counter++;
    }

    res.json({ images });
  } catch (error) {
    console.error("Error processing PDF:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.get("/", (req, res) => {
  res.send("PDF to Image Converter API is running.");
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
