const express = require('express');
const path = require('path');
const { checkDbConnection } = require('./db');
const { migrate } = require('./migrate');
const { seed } = require('./seed');
const apiRoutes = require('./routes/api');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(express.json());

// Serve static files from the React app
app.use(express.static(path.join(__dirname, '../dist')));

// API routes
app.use('/api', apiRoutes);

// The "catchall" handler: for any request that doesn't
// match one above, send back React's index.html file.
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../dist/index.html'));
});


const startServer = async () => {
  const { connected, error } = await checkDbConnection();

  if (!connected) {
    console.warn("Database connection skipped or unavailable. Running in local-first standalone mode.");
  } else {
    try {
      await migrate();
      await seed();
      console.log("Database connected, migrated and seeded successfully.");
    } catch (err) {
      console.error("Error during startup migration or seeding:", err);
    }
  }

  app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT} (http://localhost:${PORT})`);
  });
};

startServer();
