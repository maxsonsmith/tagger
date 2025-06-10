const express = require('express');
const path = require('path');
const fs = require('fs-extra');
const { OpenAI } = require('openai');
const sharp = require('sharp');
const router = express.Router();

/**
 * @route   POST /api/caption/generate
 * @desc    Generate captions for uploaded images using GPT-4 Turbo
 * @access  Public
 */
router.post('/generate', async (req, res) => {
  try {
    const { sessionId, apiKey, globalTags = '', maxTokens = 300 } = req.body;
    
    if (!sessionId) {
      return res.status(400).json({ message: 'Session ID is required' });
    }
    
    if (!apiKey) {
      return res.status(400).json({ message: 'OpenAI API key is required' });
    }
    
    // Initialize OpenAI client with user-provided API key
    const openai = new OpenAI({ apiKey });
    
    // Define paths
    const sessionDir = path.join(__dirname, '../uploads', sessionId);
    const resultsDir = path.join(__dirname, '../results', sessionId);
    
    // Check if session directory exists
    if (!fs.existsSync(sessionDir)) {
      return res.status(404).json({ message: 'Session not found' });
    }
    
    // Create results directory if it doesn't exist
    fs.ensureDirSync(resultsDir);
    
    // Get all image files in the session directory
    const files = fs.readdirSync(sessionDir)
      .filter(file => {
        const ext = path.extname(file).toLowerCase();
        return ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp'].includes(ext);
      });
    
    if (files.length === 0) {
      return res.status(400).json({ message: 'No image files found in session' });
    }
    
    // Process each image file
    const results = [];
    const errors = [];
    
    // Process files in batches to avoid overwhelming the API
    const batchSize = 5;
    const batches = [];
    
    for (let i = 0; i < files.length; i += batchSize) {
      batches.push(files.slice(i, i + batchSize));
    }
    
    // Process each batch sequentially
    for (const batch of batches) {
      const batchPromises = batch.map(async (file) => {
        try {
          const imagePath = path.join(sessionDir, file);
          const outputPath = path.join(resultsDir, `${path.parse(file).name}.txt`);
          
          // Get image metadata
          const metadata = await sharp(imagePath).metadata();
          
          // Create a prompt for GPT-4 based on the LoRA tagging primer
          const prompt = `
I need you to create a detailed caption for an image that will be used for training a LoRA (Low-Rank Adaptation) model. 
The caption should follow these guidelines:

1. Describe ONLY what is actually visible in the image
2. Be accurate and consistent in terminology
3. Balance detail with generalization
4. Follow this structure:
   - Overall image type/style
   - Number and type of subjects
   - Major characteristics (appearance, clothing)
   - Actions or poses
   - Setting/environment
   - Supporting details
   - Style/mood descriptors

5. Include 20-30 tags for standard complexity images
6. Separate tags with commas
7. Avoid redundancy, over-interpretation, or subjective descriptions

Image details:
- Resolution: ${metadata.width}x${metadata.height}
- Format: ${metadata.format}

Please provide ONLY the comma-separated tags, with no additional text or explanation.
`;
          
          // Call OpenAI API
          const response = await openai.chat.completions.create({
            model: "gpt-4-turbo",
            messages: [
              {
                role: "system",
                content: "You are an expert image captioner for LoRA training. Your task is to create detailed, accurate captions that describe only what is visible in the image. Follow the tagging guidelines precisely."
              },
              {
                role: "user",
                content: prompt
              }
            ],
            max_tokens: maxTokens,
            temperature: 0.7
          });
          
          // Extract the caption from the response
          let caption = response.choices[0].message.content.trim();
          
          // Add global tags if provided
          if (globalTags && globalTags.trim() !== '') {
            caption = `${caption}, ${globalTags.trim()}`;
          }
          
          // Write the caption to a file
          fs.writeFileSync(outputPath, caption);
          
          results.push({
            file,
            outputPath,
            caption
          });
          
        } catch (err) {
          console.error(`Error processing file ${file}:`, err);
          errors.push({
            file,
            error: err.message || 'Unknown error'
          });
        }
      });
      
      // Wait for all files in the batch to be processed
      await Promise.all(batchPromises);
    }
    
    res.status(200).json({
      message: `Caption generation completed for ${results.length} files. ${errors.length} errors.`,
      results,
      errors,
      sessionId
    });
    
  } catch (err) {
    console.error('Error in caption generation:', err);
    res.status(500).json({
      message: 'Error generating captions',
      error: err.message
    });
  }
});

/**
 * @route   POST /api/caption/add-global-tags
 * @desc    Add global tags to existing caption files
 * @access  Public
 */
router.post('/add-global-tags', async (req, res) => {
  try {
    const { sessionId, globalTags } = req.body;
    
    if (!sessionId) {
      return res.status(400).json({ message: 'Session ID is required' });
    }
    
    if (!globalTags || globalTags.trim() === '') {
      return res.status(400).json({ message: 'Global tags are required' });
    }
    
    const resultsDir = path.join(__dirname, '../results', sessionId);
    
    // Check if results directory exists
    if (!fs.existsSync(resultsDir)) {
      return res.status(404).json({ message: 'Results not found for this session' });
    }
    
    // Get all text files in the results directory
    const files = fs.readdirSync(resultsDir)
      .filter(file => path.extname(file).toLowerCase() === '.txt');
    
    if (files.length === 0) {
      return res.status(400).json({ message: 'No caption files found for this session' });
    }
    
    // Add global tags to each caption file
    const results = [];
    const errors = [];
    
    files.forEach(file => {
      try {
        const filePath = path.join(resultsDir, file);
        let caption = fs.readFileSync(filePath, 'utf8').trim();
        
        // Add global tags if they're not already in the caption
        const tagsToAdd = globalTags.trim().split(',')
          .map(tag => tag.trim())
          .filter(tag => tag !== '');
        
        tagsToAdd.forEach(tag => {
          if (!caption.includes(tag)) {
            caption = `${caption}, ${tag}`;
          }
        });
        
        // Write the updated caption back to the file
        fs.writeFileSync(filePath, caption);
        
        results.push({
          file,
          updatedCaption: caption
        });
        
      } catch (err) {
        console.error(`Error updating file ${file}:`, err);
        errors.push({
          file,
          error: err.message || 'Unknown error'
        });
      }
    });
    
    res.status(200).json({
      message: `Global tags added to ${results.length} files. ${errors.length} errors.`,
      results,
      errors,
      sessionId
    });
    
  } catch (err) {
    console.error('Error adding global tags:', err);
    res.status(500).json({
      message: 'Error adding global tags',
      error: err.message
    });
  }
});

/**
 * @route   GET /api/caption/status/:sessionId
 * @desc    Check the status of caption generation for a session
 * @access  Public
 */
router.get('/status/:sessionId', (req, res) => {
  try {
    const { sessionId } = req.params;
    
    const uploadsDir = path.join(__dirname, '../uploads', sessionId);
    const resultsDir = path.join(__dirname, '../results', sessionId);
    
    // Check if directories exist
    if (!fs.existsSync(uploadsDir)) {
      return res.status(404).json({ message: 'Upload session not found' });
    }
    
    // Get counts of image files and caption files
    const imageFiles = fs.existsSync(uploadsDir) ? 
      fs.readdirSync(uploadsDir).filter(file => {
        const ext = path.extname(file).toLowerCase();
        return ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp'].includes(ext);
      }) : [];
    
    const captionFiles = fs.existsSync(resultsDir) ? 
      fs.readdirSync(resultsDir).filter(file => path.extname(file).toLowerCase() === '.txt') : [];
    
    // Calculate progress
    const totalImages = imageFiles.length;
    const processedImages = captionFiles.length;
    const progress = totalImages > 0 ? Math.floor((processedImages / totalImages) * 100) : 0;
    
    res.status(200).json({
      sessionId,
      totalImages,
      processedImages,
      progress,
      isComplete: processedImages >= totalImages && totalImages > 0,
      status: processedImages >= totalImages && totalImages > 0 ? 'complete' : 'in-progress'
    });
    
  } catch (err) {
    console.error('Error checking caption status:', err);
    res.status(500).json({
      message: 'Error checking caption status',
      error: err.message
    });
  }
});

/**
 * @route   POST /api/caption/batch
 * @desc    Process a batch of images for caption generation
 * @access  Public
 */
router.post('/batch', async (req, res) => {
  try {
    const { sessionId, apiKey, globalTags = '', fileIndices, maxTokens = 300 } = req.body;
    
    if (!sessionId) {
      return res.status(400).json({ message: 'Session ID is required' });
    }
    
    if (!apiKey) {
      return res.status(400).json({ message: 'OpenAI API key is required' });
    }
    
    // Initialize OpenAI client with user-provided API key
    const openai = new OpenAI({ apiKey });
    
    // Define paths
    const sessionDir = path.join(__dirname, '../uploads', sessionId);
    const resultsDir = path.join(__dirname, '../results', sessionId);
    
    // Check if session directory exists
    if (!fs.existsSync(sessionDir)) {
      return res.status(404).json({ message: 'Session not found' });
    }
    
    // Create results directory if it doesn't exist
    fs.ensureDirSync(resultsDir);
    
    // Get all image files in the session directory
    let files = fs.readdirSync(sessionDir)
      .filter(file => {
        const ext = path.extname(file).toLowerCase();
        return ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp'].includes(ext);
      });
    
    // If specific file indices are provided, only process those files
    if (fileIndices && Array.isArray(fileIndices) && fileIndices.length > 0) {
      files = fileIndices.map(index => files[index]).filter(Boolean);
    }
    
    if (files.length === 0) {
      return res.status(400).json({ message: 'No image files found to process' });
    }
    
    // Process each image file
    const results = [];
    const errors = [];
    
    // Process files in parallel, but with a concurrency limit
    const concurrencyLimit = 3;
    const chunks = [];
    
    for (let i = 0; i < files.length; i += concurrencyLimit) {
      chunks.push(files.slice(i, i + concurrencyLimit));
    }
    
    for (const chunk of chunks) {
      const chunkPromises = chunk.map(async (file) => {
        try {
          const imagePath = path.join(sessionDir, file);
          const outputPath = path.join(resultsDir, `${path.parse(file).name}.txt`);
          
          // Get image metadata
          const metadata = await sharp(imagePath).metadata();
          
          // Create a prompt for GPT-4 based on the LoRA tagging primer
          const prompt = `
I need you to create a detailed caption for an image that will be used for training a LoRA (Low-Rank Adaptation) model. 
The caption should follow these guidelines:

1. Describe ONLY what is actually visible in the image
2. Be accurate and consistent in terminology
3. Balance detail with generalization
4. Follow this structure:
   - Overall image type/style
   - Number and type of subjects
   - Major characteristics (appearance, clothing)
   - Actions or poses
   - Setting/environment
   - Supporting details
   - Style/mood descriptors

5. Include 20-30 tags for standard complexity images
6. Separate tags with commas
7. Avoid redundancy, over-interpretation, or subjective descriptions

Image details:
- Resolution: ${metadata.width}x${metadata.height}
- Format: ${metadata.format}

Please provide ONLY the comma-separated tags, with no additional text or explanation.
`;
          
          // Call OpenAI API
          const response = await openai.chat.completions.create({
            model: "gpt-4-turbo",
            messages: [
              {
                role: "system",
                content: "You are an expert image captioner for LoRA training. Your task is to create detailed, accurate captions that describe only what is visible in the image. Follow the tagging guidelines precisely."
              },
              {
                role: "user",
                content: prompt
              }
            ],
            max_tokens: maxTokens,
            temperature: 0.7
          });
          
          // Extract the caption from the response
          let caption = response.choices[0].message.content.trim();
          
          // Add global tags if provided
          if (globalTags && globalTags.trim() !== '') {
            caption = `${caption}, ${globalTags.trim()}`;
          }
          
          // Write the caption to a file
          fs.writeFileSync(outputPath, caption);
          
          results.push({
            file,
            outputPath,
            caption
          });
          
        } catch (err) {
          console.error(`Error processing file ${file}:`, err);
          errors.push({
            file,
            error: err.message || 'Unknown error'
          });
        }
      });
      
      // Wait for all files in the chunk to be processed before moving to the next chunk
      await Promise.all(chunkPromises);
    }
    
    res.status(200).json({
      message: `Caption generation completed for ${results.length} files. ${errors.length} errors.`,
      results,
      errors,
      sessionId
    });
    
  } catch (err) {
    console.error('Error in batch caption generation:', err);
    res.status(500).json({
      message: 'Error generating captions',
      error: err.message
    });
  }
});

module.exports = router;
