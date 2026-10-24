import { pool } from './db';
import { guideContent } from './content';
import type { PoolClient, QueryResult } from 'pg';

export const seed = async (): Promise<void> => {
  const client: PoolClient = await pool.connect();
  try {
    await client.query('BEGIN');
    console.log('Seeding phases and steps...');

    for (const phase of Object.values(guideContent)) {
      const phaseRes: QueryResult<{ id: number }> = await client.query(
        `INSERT INTO phases (phase_key, title, description, sort_order)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (phase_key) DO UPDATE SET title = EXCLUDED.title, description = EXCLUDED.description, sort_order = EXCLUDED.sort_order
         RETURNING id`,
        [phase.phase_key, phase.title, phase.description, phase.sort_order]
      );
      const phaseId = phaseRes.rows[0].id;

      for (const step of phase.steps) {
        await client.query(
          `INSERT INTO steps (phase_id, step_key, title, sort_order)
           VALUES ($1, $2, $3, $4)
           ON CONFLICT (step_key) DO UPDATE SET title = EXCLUDED.title, sort_order = EXCLUDED.sort_order`,
          [phaseId, step.step_key, step.title, step.sort_order]
        );
      }
    }

    await client.query('COMMIT');
    console.log('Database seeding completed successfully.');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error during seeding:', error);
    throw error;
  } finally {
    client.release();
  }
};
