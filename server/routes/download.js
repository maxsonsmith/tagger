const express = require('express');
const path = require('path');
const fs = require('fs-extra');
const archiver = require('archiver');
const router = express.Router();

/**
 * @route   GET /api/download/caption/:sessionId/:filename
 * @desc    Download a single caption file
 * @access  Public
 */
router.get('/caption/:sessionId/:filename', (req, res) => {
  try {
    const { sessionId, filename } = req.params;
    const filePath = path.join(__dirname, '../results', sessionId, filename);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: 'Caption file not found' });
    }
    
    res.download(filePath);
  } catch (err) {
    console.error('Error downloading caption file:', err);
    res.status(500).json({
      message: 'Error downloading caption file',
      error: err.message
    });
  }
});

/**
 * @route   GET /api/download/image/:sessionId/:filename
 * @desc    Download a single image file
 * @access  Public
 */
router.get('/image/:sessionId/:filename', (req, res) => {
  try {
    const { sessionId, filename } = req.params;
    const filePath = path.join(__dirname, '../uploads', sessionId, filename);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: 'Image file not found' });
    }
    
    res.download(filePath);
  } catch (err) {
    console.error('Error downloading image file:', err);
    res.status(500).json({
      message: 'Error downloading image file',
      error: err.message
    });
  }
});

/**
 * @route   GET /api/download/all-captions/:sessionId
 * @desc    Download all caption files for a session as a zip archive
 * @access  Public
 */
router.get('/all-captions/:sessionId', (req, res) => {
  try {
    const { sessionId } = req.params;
    const resultsDir = path.join(__dirname, '../results', sessionId);
    
    if (!fs.existsSync(resultsDir)) {
      return res.status(404).json({ message: 'No results found for this session' });
    }
    
    const files = fs.readdirSync(resultsDir)
      .filter(file => path.extname(file).toLowerCase() === '.txt');
    
    if (files.length === 0) {
      return res.status(404).json({ message: 'No caption files found for this session' });
    }
    
    // Set up response headers for zip download
    res.attachment(`captions-${sessionId}.zip`);
    
    // Create a zip archive
    const archive = archiver('zip', {
      zlib: { level: 9 } // Maximum compression
    });
    
    // Pipe archive data to the response
    archive.pipe(res);
    
    // Add each caption file to the archive
    files.forEach(file => {
      const filePath = path.join(resultsDir, file);
      archive.file(filePath, { name: file });
    });
    
    // Finalize the archive
    archive.finalize();
    
  } catch (err) {
    console.error('Error downloading all caption files:', err);
    res.status(500).json({
      message: 'Error downloading all caption files',
      error: err.message
    });
  }
});

/**
 * @route   GET /api/download/all/:sessionId
 * @desc    Download all images and their caption files as a zip archive
 * @access  Public
 */
router.get('/all/:sessionId', (req, res) => {
  try {
    const { sessionId } = req.params;
    const { format = 'separate' } = req.query; // Options: 'separate', 'paired', 'flat'
    
    const uploadsDir = path.join(__dirname, '../uploads', sessionId);
    const resultsDir = path.join(__dirname, '../results', sessionId);
    
    if (!fs.existsSync(uploadsDir)) {
      return res.status(404).json({ message: 'Upload session not found' });
    }
    
    // Set up response headers for zip download
    res.attachment(`lora-training-${sessionId}.zip`);
    
    // Create a zip archive
    const archive = archiver('zip', {
      zlib: { level: 6 } // Balanced compression
    });
    
    // Pipe archive data to the response
    archive.pipe(res);
    
    // Get all image files
    const imageFiles = fs.readdirSync(uploadsDir)
      .filter(file => {
        const ext = path.extname(file).toLowerCase();
        return ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp'].includes(ext);
      });
    
    // Get all caption files
    const captionFiles = fs.existsSync(resultsDir) ? 
      fs.readdirSync(resultsDir).filter(file => path.extname(file).toLowerCase() === '.txt') : [];
    
    // Create a mapping of base filenames to their caption files
    const captionMap = {};
    captionFiles.forEach(file => {
      captionMap[path.parse(file).name] = file;
    });
    
    // Add files to the archive based on the selected format
    if (format === 'separate') {
      // Add images to an 'images' directory
      imageFiles.forEach(file => {
        const filePath = path.join(uploadsDir, file);
        archive.file(filePath, { name: `images/${file}` });
      });
      
      // Add captions to a 'captions' directory
      captionFiles.forEach(file => {
        const filePath = path.join(resultsDir, file);
        archive.file(filePath, { name: `captions/${file}` });
      });
    } 
    else if (format === 'paired') {
      // Create a directory for each image/caption pair
      imageFiles.forEach(file => {
        const baseName = path.parse(file).name;
        const imagePath = path.join(uploadsDir, file);
        
        // Add the image to its own directory
        archive.file(imagePath, { name: `${baseName}/${file}` });
        
        // Add the corresponding caption file if it exists
        if (captionMap[baseName]) {
          const captionPath = path.join(resultsDir, captionMap[baseName]);
          archive.file(captionPath, { name: `${baseName}/${captionMap[baseName]}` });
        }
      });
    }
    else if (format === 'flat') {
      // Add all files to the root of the archive
      imageFiles.forEach(file => {
        const filePath = path.join(uploadsDir, file);
        archive.file(filePath, { name: file });
      });
      
      captionFiles.forEach(file => {
        const filePath = path.join(resultsDir, file);
        archive.file(filePath, { name: file });
      });
    }
    
    // Finalize the archive
    archive.finalize();
    
  } catch (err) {
    console.error('Error downloading all files:', err);
    res.status(500).json({
      message: 'Error downloading all files',
      error: err.message
    });
  }
});

/**
 * @route   GET /api/download/status/:sessionId
 * @desc    Get the download status and available files for a session
 * @access  Public
 */
router.get('/status/:sessionId', (req, res) => {
  try {
    const { sessionId } = req.params;
    
    const uploadsDir = path.join(__dirname, '../uploads', sessionId);
    const resultsDir = path.join(__dirname, '../results', sessionId);
    
    if (!fs.existsSync(uploadsDir)) {
      return res.status(404).json({ message: 'Upload session not found' });
    }
    
    // Get counts of image files and caption files
    const imageFiles = fs.readdirSync(uploadsDir)
      .filter(file => {
        const ext = path.extname(file).toLowerCase();
        return ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp'].includes(ext);
      })
      .map(file => ({
        name: file,
        path: `/api/download/image/${sessionId}/${file}`,
        size: fs.statSync(path.join(uploadsDir, file)).size
      }));
    
    const captionFiles = fs.existsSync(resultsDir) ? 
      fs.readdirSync(resultsDir)
        .filter(file => path.extname(file).toLowerCase() === '.txt')
        .map(file => ({
          name: file,
          path: `/api/download/caption/${sessionId}/${file}`,
          size: fs.statSync(path.join(resultsDir, file)).size,
          imageFile: imageFiles.find(img => path.parse(img.name).name === path.parse(file).name)?.name
        })) : [];
    
    // Check if all images have captions
    const allCaptioned = imageFiles.length > 0 && 
      imageFiles.every(img => 
        captionFiles.some(cap => path.parse(cap.name).name === path.parse(img.name).name)
      );
    
    res.status(200).json({
      sessionId,
      imageCount: imageFiles.length,
      captionCount: captionFiles.length,
      allCaptioned,
      downloadLinks: {
        allCaptions: `/api/download/all-captions/${sessionId}`,
        allFilesSeparate: `/api/download/all/${sessionId}?format=separate`,
        allFilesPaired: `/api/download/all/${sessionId}?format=paired`,
        allFilesFlat: `/api/download/all/${sessionId}?format=flat`
      },
      imageFiles,
      captionFiles
    });
    
  } catch (err) {
    console.error('Error getting download status:', err);
    res.status(500).json({
      message: 'Error getting download status',
      error: err.message
    });
  }
});

/**
 * @route   POST /api/download/custom
 * @desc    Create a custom download package with selected files
 * @access  Public
 */
router.post('/custom', (req, res) => {
  try {
    const { sessionId, imageFiles = [], captionFiles = [] } = req.body;
    
    if (!sessionId) {
      return res.status(400).json({ message: 'Session ID is required' });
    }
    
    if (imageFiles.length === 0 && captionFiles.length === 0) {
      return res.status(400).json({ message: 'No files selected for download' });
    }
    
    const uploadsDir = path.join(__dirname, '../uploads', sessionId);
    const resultsDir = path.join(__dirname, '../results', sessionId);
    
    if (!fs.existsSync(uploadsDir)) {
      return res.status(404).json({ message: 'Upload session not found' });
    }
    
    // Set up response headers for zip download
    res.attachment(`custom-lora-${sessionId}.zip`);
    
    // Create a zip archive
    const archive = archiver('zip', {
      zlib: { level: 6 } // Balanced compression
    });
    
    // Pipe archive data to the response
    archive.pipe(res);
    
    // Add selected image files to the archive
    imageFiles.forEach(file => {
      const filePath = path.join(uploadsDir, file);
      if (fs.existsSync(filePath)) {
        archive.file(filePath, { name: `images/${file}` });
      }
    });
    
    // Add selected caption files to the archive
    captionFiles.forEach(file => {
      const filePath = path.join(resultsDir, file);
      if (fs.existsSync(filePath)) {
        archive.file(filePath, { name: `captions/${file}` });
      }
    });
    
    // Finalize the archive
    archive.finalize();
    
  } catch (err) {
    console.error('Error creating custom download:', err);
    res.status(500).json({
      message: 'Error creating custom download',
      error: err.message
    });
  }
});

module.exports = router;
