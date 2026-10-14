const express = require('express');
const { query } = require('../db');
const { guideContent } = require('../content');

const router = express.Router();

// Health check
router.get('/health', async (req, res) => {
  try {
    await query('SELECT NOW()');
    res.status(200).json({ status: 'ok' });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Database connection failed' });
  }
});

// Get all phases with nested steps and progress
router.get('/phases', async (req, res) => {
  try {
    const phasesResult = await query('SELECT * FROM phases ORDER BY sort_order');
    const stepsResult = await query(`
      SELECT s.*, p.status, p.notes, p.updated_at
      FROM steps s
      LEFT JOIN progress p ON s.id = p.step_id
      ORDER BY s.sort_order
    `);

    const phases = phasesResult.rows;
    const steps = stepsResult.rows;

    phases.forEach(phase => {
      phase.steps = steps.filter(step => step.phase_id === phase.id);
    });

    res.json(phases);
  } catch (error) {
    console.warn('Database query failed in /phases, falling back to static guideContent:', error.message);
    const fallbackPhases = Object.values(guideContent).map((phase, idx) => ({
      id: idx + 1,
      ...phase,
      steps: phase.steps.map((step, sIdx) => ({
        id: sIdx + 1,
        ...step,
        status: 'not_started',
        notes: '',
      }))
    }));
    res.json(fallbackPhases);
  }
});

// Get single step detail
router.get('/steps/:stepKey', (req, res) => {
    const { stepKey } = req.params;
    for (const phase of Object.values(guideContent)) {
        const step = phase.steps.find(s => s.step_key === stepKey);
        if (step) {
            return res.json(step);
        }
    }
    res.status(404).json({ message: 'Step not found' });
});


// Update step progress
router.patch('/steps/:stepKey/progress', async (req, res) => {
  const { stepKey } = req.params;
  const { status, notes } = req.body;

  try {
    const stepResult = await query('SELECT id FROM steps WHERE step_key = $1', [stepKey]);
    if (stepResult.rows.length === 0) {
      return res.status(404).json({ message: 'Step not found' });
    }
    const stepId = stepResult.rows[0].id;

    const updateData = {};
    if (status) updateData.status = status;
    if (notes !== undefined) updateData.notes = notes;
    if (status === 'in_progress' && !('started_at' in req.body)) {
        updateData.started_at = new Date();
    }
    if (status === 'completed') {
        updateData.completed_at = new Date();
    }


    const upsertQuery = `
      INSERT INTO progress (step_id, status, notes, started_at, completed_at)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (step_id) DO UPDATE
      SET status = COALESCE($2, progress.status),
          notes = COALESCE($3, progress.notes),
          started_at = COALESCE(progress.started_at, $4),
          completed_at = COALESCE($5, progress.completed_at)
      RETURNING *;
    `;

    const result = await query(upsertQuery, [stepId, status, notes, updateData.started_at, updateData.completed_at]);

    res.json(result.rows[0]);
  } catch (error) {
    console.warn('Database query failed in /steps/:stepKey/progress, returning optimistic status:', error.message);
    res.json({ step_key: stepKey, status: status || 'not_started', notes: notes || '', fallback: true });
  }
});

// Get stats
router.get('/stats', async (req, res) => {
    try {
        const totalStepsRes = await query('SELECT COUNT(*) FROM steps');
        const completedStepsRes = await query('SELECT COUNT(*) FROM progress WHERE status = $1', ['completed']);
        
        const totalSteps = parseInt(totalStepsRes.rows[0].count, 10);
        const completedSteps = parseInt(completedStepsRes.rows[0].count, 10);

        const completionPercentage = totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 0;

        res.json({
            totalSteps,
            completedSteps,
            completionPercentage: Math.round(completionPercentage),
        });

    } catch (error) {
        console.warn('Database query failed in /stats, returning static stats:', error.message);
        let total = 0;
        Object.values(guideContent).forEach(p => { total += p.steps.length; });
        res.json({
            totalSteps: total || 28,
            completedSteps: 0,
            completionPercentage: 0,
        });
    }
});


module.exports = router;
