const express = require('express');
const { db, Track } = require('./database/setup');
const { body, validationResult } = require('express-validator');

const app = express();
const PORT = process.env.PORT || 3003;

// Middleware to parse JSON
app.use(express.json());

// Data validation middleware
const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
  
    if (!errors.isEmpty()) {
        const errorMessages =
    errors.array().map(error => error.msg);
    
        return res.status(400).json({
            error: 'Validation failed',
            messages: errorMessages
        });
    }
  
    // Set default value for completed if not provided
    if (req.body.completed === undefined) {
        req.body.completed = false;
    }
  
    next();
};

// Validation rules
const trackValidation = [
  body()
  .custom((body) => {
    if (Object.keys(body).length > 6) { // Combined with the other validators, this only allows the 5 valid fields as input
      throw new Error();
    }
    return true;
  })
    .withMessage('Request must only contain the following fields: songTitle, artistName, albumName, genre, duration, and releaseYear'),
  body('songTitle')
    .isLength({ min: 1 })
    .withMessage('Song title cannot be null'),
  
  body('artistName')
    .isLength({ min: 1 })
    .withMessage('Artist name cannot be null'),
  
  body('albumName')
    .isLength({ min: 1 })
    .withMessage('Album name cannot be null'),

  body('genre')
    .isLength({ min: 1 })
    .withMessage('Genre name cannot be null'),
  
  body('duration')
    .isFloat({ min: 0 })
    .withMessage('Duration must be a number (in seconds)'),

  body('releaseYear')
    .matches(/^\d{4}$/)
    .withMessage('Release year must be a year, e.g. 1999, 2026, etc.'),
];

// ID validation middleware to prevent injection
const idValidation = (field) => (req, res, next) => {
    if (!/^\d+$/.test(req.params[field])) {
        return res.status(400).json({ error: `${field} must contain digits only` });
    }
    next();
};

// Error handle invaid json body
app.use((err, req, res, next) => {
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'Invalid JSON in request body' });
  }
  next(err);
});



// Test database connection
async function testConnection() {
    try {
        await db.authenticate();
        console.log('Connection to database established successfully.');
    } catch (error) {
        console.error('Unable to connect to the database:', error);
    }
}

testConnection();

// GET /api/tracks - Get all tracks
app.get('/api/tracks', async (req, res) => {
    try {
        const tracks = await Track.findAll();
        res.json(tracks);
    } catch (error) {
        console.error('Error fetching tracks:', error);
        res.status(500).json({ error: 'Failed to fetch tracks' });
    }
});

// GET /api/tracks/:id - Get track by ID
app.get('/api/tracks/:id', idValidation('id'), async (req, res) => {
    try {
        const track = await
    Track.findByPk(req.params.id);
    
        if (!track) {
            return res.status(404).json({ error: 
        'Track not found' });
        }
    
        res.json(track);
    } catch (error) {
        console.error('Error fetching track:', error);
        res.status(500).json({ error: 'Failed to fetch track' });
    }
});

// POST /api/tracks - Create new track
app.post('/api/tracks', trackValidation, handleValidationErrors, async (req, res) => {
    try {
        const {
            songTitle,
            artistName,
            albumName,
            genre,
            duration,
            releaseYear } = req.body;
    
        const newTrack = await Track.create({
            songTitle,
            artistName,
            albumName,
            genre,
            duration,
            releaseYear
        });
    
        res.status(201).json(newTrack);
    } catch (error) {
        console.error('Error creating track:', error);
        res.status(500).json({ error: 'Failed to create track' });
    }
});

// PUT /api/tracks/:id - Update existing track
app.put('/api/tracks/:id', trackValidation, handleValidationErrors, idValidation('id'), async (req, res) => {
    try {
        const {
            songTitle,
            artistName,
            albumName,
            genre,
            duration,
            releaseYear } = req.body;
    
        const [updatedRowsCount] = await Track.update(
            {
            songTitle,
            artistName,
            albumName,
            genre,
            duration,
            releaseYear },
            { where: { trackId: req.params.id } }
        );
    
        if (updatedRowsCount === 0) {
            return res.status(404).json({ error: 
        'Track not found' });
        }
    
        const updatedTrack = await
    Track.findByPk(req.params.id);
        res.json(updatedTrack);
    } catch (error) {
        console.error('Error updating track:', error);
        res.status(500).json({ error: 'Failed to update track' });
    }
});

// DELETE /api/tracks/:id - Delete track
app.delete('/api/tracks/:id', idValidation('id'), async (req, res) => {
    try {
        const deletedRowsCount = await
    Track.destroy({
            where: { trackId: req.params.id }
        });
    
        if (deletedRowsCount === 0) {
            return res.status(404).json({ error: 
        'Track not found' });
        }
    
        res.json({ message: 'Track deleted successfully' });
    } catch (error) {
        console.error('Error deleting track:', error);
        res.status(500).json({ error: 'Failed to delete track' });
  }
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running on port http://localhost:${PORT}`);
});