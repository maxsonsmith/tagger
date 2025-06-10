const express = require('express');
const path = require('path');
const fs = require('fs-extra');
const { v4: uuidv4 } = require('uuid');
const router = express.Router();

/**
 * @route   POST /api/upload/single
 * @desc    Upload a single image file
 * @access  Public
 */
router.post('/single', (req, res, next) => {
  const upload = req.app.locals.upload;
  
  // Generate session ID if not provided
  if (!req.headers['x-session-id']) {
    req.headers['x-session-id'] = uuidv4();
  }
  
  const sessionId = req.headers['x-session-id'];
  
  upload.single('image')(req, res, (err) => {
    if (err) {
      return next(err);
    }
    
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }
    
    res.status(200).json({
      message: 'File uploaded successfully',
      file: {
        filename: req.file.filename,
        originalname: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
        path: req.file.path,
        sessionId
      },
      sessionId
    });
  });
});

/**
 * @route   POST /api/upload/multiple
 * @desc    Upload multiple image files
 * @access  Public
 */
router.post('/multiple', (req, res, next) => {
  const upload = req.app.locals.upload;
  
  // Generate session ID if not provided
  if (!req.headers['x-session-id']) {
    req.headers['x-session-id'] = uuidv4();
  }
  
  const sessionId = req.headers['x-session-id'];
  
  upload.array('images', 100)(req, res, (err) => {
    if (err) {
      return next(err);
    }
    
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'No files uploaded' });
    }
    
    const files = req.files.map(file => ({
      filename: file.filename,
      originalname: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
      path: file.path
    }));
    
    res.status(200).json({
      message: `${req.files.length} files uploaded successfully`,
      files,
      sessionId
    });
  });
});

/**
 * @route   POST /api/upload/folder
 * @desc    Upload a folder of image files (processed as multiple files)
 * @access  Public
 */
router.post('/folder', (req, res, next) => {
  const upload = req.app.locals.upload;
  
  // Generate session ID if not provided
  if (!req.headers['x-session-id']) {
    req.headers['x-session-id'] = uuidv4();
  }
  
  const sessionId = req.headers['x-session-id'];
  
  upload.array('images', 500)(req, res, (err) => {
    if (err) {
      return next(err);
    }
    
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'No files uploaded' });
    }
    
    // Group files by their directory structure
    const filesByDirectory = {};
    req.files.forEach(file => {
      const dirPath = path.dirname(file.originalname);
      if (!filesByDirectory[dirPath]) {
        filesByDirectory[dirPath] = [];
      }
      filesByDirectory[dirPath].push({
        filename: file.filename,
        originalname: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
        path: file.path
      });
    });
    
    res.status(200).json({
      message: `${req.files.length} files uploaded successfully`,
      files: req.files.map(file => ({
        filename: file.filename,
        originalname: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
        path: file.path
      })),
      filesByDirectory,
      sessionId
    });
  });
});

/**
 * @route   GET /api/upload/sessions
 * @desc    Get list of all upload sessions
 * @access  Public
 */
router.get('/sessions', (req, res) => {
  const uploadsDir = path.join(__dirname, '../uploads');
  
  try {
    const sessions = fs.readdirSync(uploadsDir)
      .filter(item => fs.statSync(path.join(uploadsDir, item)).isDirectory())
      .map(sessionId => {
        const sessionDir = path.join(uploadsDir, sessionId);
        const files = fs.readdirSync(sessionDir)
          .filter(file => {
            const filePath = path.join(sessionDir, file);
            return fs.statSync(filePath).isFile();
          });
        
        return {
          sessionId,
          fileCount: files.length,
          createdAt: fs.statSync(sessionDir).birthtime
        };
      })
      .sort((a, b) => b.createdAt - a.createdAt);
    
    res.status(200).json({ sessions });
  } catch (err) {
    res.status(500).json({ message: 'Error retrieving sessions', error: err.message });
  }
});

/**
 * @route   GET /api/upload/sessions/:sessionId
 * @desc    Get details of a specific upload session
 * @access  Public
 */
router.get('/sessions/:sessionId', (req, res) => {
  const { sessionId } = req.params;
  const sessionDir = path.join(__dirname, '../uploads', sessionId);
  
  try {
    if (!fs.existsSync(sessionDir)) {
      return res.status(404).json({ message: 'Session not found' });
    }
    
    const files = fs.readdirSync(sessionDir)
      .filter(file => {
        const filePath = path.join(sessionDir, file);
        return fs.statSync(filePath).isFile();
      })
      .map(file => {
        const filePath = path.join(sessionDir, file);
        const stats = fs.statSync(filePath);
        
        return {
          filename: file,
          path: filePath,
          size: stats.size,
          createdAt: stats.birthtime
        };
      });
    
    res.status(200).json({
      sessionId,
      fileCount: files.length,
      files
    });
  } catch (err) {
    res.status(500).json({ message: 'Error retrieving session details', error: err.message });
  }
});

/**
 * @route   DELETE /api/upload/sessions/:sessionId
 * @desc    Delete a specific upload session
 * @access  Public
 */
router.delete('/sessions/:sessionId', (req, res) => {
  const { sessionId } = req.params;
  const sessionDir = path.join(__dirname, '../uploads', sessionId);
  
  try {
    if (!fs.existsSync(sessionDir)) {
      return res.status(404).json({ message: 'Session not found' });
    }
    
    fs.removeSync(sessionDir);
    
    res.status(200).json({
      message: 'Session deleted successfully',
      sessionId
    });
  } catch (err) {
    res.status(500).json({ message: 'Error deleting session', error: err.message });
  }
});

module.exports = router;
