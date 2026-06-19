const { pool } = require('./db');

const migrate = async () => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    console.log('Creating phases table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS phases (
        id          SERIAL PRIMARY KEY,
        phase_key   VARCHAR(50) UNIQUE NOT NULL,
        title       VARCHAR(200) NOT NULL,
        description TEXT,
        sort_order  INTEGER NOT NULL
      );
    `);

    console.log('Creating steps table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS steps (
        id          SERIAL PRIMARY KEY,
        phase_id    INTEGER REFERENCES phases(id),
        step_key    VARCHAR(100) UNIQUE NOT NULL,
        title       VARCHAR(300) NOT NULL,
        sort_order  INTEGER NOT NULL
      );
    `);

    console.log('Creating progress table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS progress (
        id           SERIAL PRIMARY KEY,
        step_id      INTEGER REFERENCES steps(id) UNIQUE,
        status       VARCHAR(20) DEFAULT 'not_started',
        notes        TEXT DEFAULT '',
        started_at   TIMESTAMPTZ,
        completed_at TIMESTAMPTZ,
        updated_at   TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // Function to update `updated_at` timestamp
    await client.query(`
      CREATE OR REPLACE FUNCTION trigger_set_timestamp()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);

    // Trigger for the progress table
    const res = await client.query(`
        SELECT 1 FROM pg_trigger WHERE tgname = 'set_timestamp';
    `);

    if (res.rowCount === 0) {
        await client.query(`
            CREATE TRIGGER set_timestamp
            BEFORE UPDATE ON progress
            FOR EACH ROW
            EXECUTE PROCEDURE trigger_set_timestamp();
        `);
    }
    
    await client.query('COMMIT');
    console.log('Database migration completed successfully.');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error during migration:', error);
    throw error;
  } finally {
    client.release();
  }
};

module.exports = { migrate };
