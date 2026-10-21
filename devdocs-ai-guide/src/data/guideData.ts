import type { Phase, Step } from '../types';
import { phase1Steps } from './phase1Content';
import { phase2Steps } from './phase2Content';
import { phase3Steps } from './phase3Content';
import { phase4Steps } from './phase4Content';

export const initialPhases: Phase[] = [
  {
    id: 1,
    phase_key: "foundation",
    title: "Phase 1: Foundation & Data Pipeline",
    description: "Build the core of your RAG system. Scrape documentation, compare chunking strategies, generate dense embeddings, and provision Qdrant vector store.",
    sort_order: 1,
    steps: phase1Steps
  },
  {
    id: 2,
    phase_key: "retrieval-quality",
    title: "Phase 2: Retrieval Quality & Evaluation",
    description: "Master two-stage Cross-Encoder re-ranking, configure PostgreSQL telemetry logging, build golden evaluation sets, and benchmark with Ragas & IR metrics.",
    sort_order: 2,
    steps: phase2Steps
  },
  {
    id: 3,
    phase_key: "agent-optimization",
    title: "Phase 3: Agent & Prompt Optimization",
    description: "Transform your RAG pipeline into an autonomous agent using LangGraph cyclical workflows, multi-query search, Text-to-SQL, and DSPy prompt compilation.",
    sort_order: 3,
    steps: phase3Steps
  },
  {
    id: 4,
    phase_key: "dashboard-polish",
    title: "Phase 4: Dashboard, Frontend & Polish",
    description: "Build a responsive React 19 streaming chat interface, interactive evaluation and observability dashboard, conduct user studies, and document the architecture.",
    sort_order: 4,
    steps: phase4Steps
  }
];

export const allSteps: Step[] = [
  ...phase1Steps,
  ...phase2Steps,
  ...phase3Steps,
  ...phase4Steps
];

export const stepMap: Map<string, Step> = new Map(allSteps.map(step => [step.step_key, step]));

export const getStepByKey = (key: string): Step => {
  return stepMap.get(key) || allSteps[0];
};

export const getNextStep = (currentKey: string): Step | null => {
  const index = allSteps.findIndex(s => s.step_key === currentKey);
  if (index >= 0 && index < allSteps.length - 1) {
    return allSteps[index + 1];
  }
  return null;
};

export const getPrevStep = (currentKey: string): Step | null => {
  const index = allSteps.findIndex(s => s.step_key === currentKey);
  if (index > 0) {
    return allSteps[index - 1];
  }
  return null;
};
