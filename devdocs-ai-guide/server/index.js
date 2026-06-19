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
    console.error("FATAL: Could not connect to the database. The application cannot start.");
    
    // Fallback error page if DB is down
    app.get('*', (req, res) => {
        const setupInstructions = fs.readFileSync(path.join(__dirname, '../POSTGRESQL_SETUP.md'), 'utf8');
        res.status(503).send(`
            <body style="font-family: sans-serif; background-color: #111; color: #eee; padding: 2rem;">
                <h1>Database Connection Error</h1>
                <p>The application could not connect to the PostgreSQL database. Please ensure it is installed, running, and configured correctly.</p>
                <pre style="background-color: #222; padding: 1rem; border-radius: 8px; white-space: pre-wrap; word-wrap: break-word;">${error.stack}</pre>
                <hr>
                <h2>Setup Instructions:</h2>
                <div style="background-color: #222; padding: 1rem; border-radius: 8px;">
                    <pre>${setupInstructions.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</pre>
                </div>
            </body>
        `);
    });

    app.listen(PORT, () => {
        console.log(`Server is running in a degraded state on port ${PORT}. DB connection failed.`);
    });

    return;
  }

  try {
    await migrate();
    await seed();
  } catch (err) {
    console.error("Error during startup migration or seeding:", err);
    // Decide if you want to exit or run in a degraded state
  }

  app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
  });
};

startServer();
