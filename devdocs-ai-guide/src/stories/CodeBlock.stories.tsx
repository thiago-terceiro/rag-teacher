import type { Meta, StoryObj } from '@storybook/react';
import CodeBlock from '../components/CodeBlock';

const meta: Meta<typeof CodeBlock> = {
  title: 'Display/CodeBlock',
  component: CodeBlock,
  tags: ['autodocs'],
  argTypes: {
    language: { control: 'text' },
    value: { control: 'text' },
  },
};

export default meta;
type Story = StoryObj<typeof CodeBlock>;

export const PythonRAGExample: Story = {
  args: {
    language: 'python',
    value: `import numpy as np

def cosine_similarity(v1: np.ndarray, v2: np.ndarray) -> float:
    dot_product = np.dot(v1, v2)
    norm_v1 = np.linalg.norm(v1)
    norm_v2 = np.linalg.norm(v2)
    return dot_product / (norm_v1 * norm_v2)

# Compute similarity between two 1536-dim embeddings
q = np.random.randn(1536)
d = np.random.randn(1536)
print(f"Similarity: {cosine_similarity(q, d):.4f}")`,
  },
};

export const TypeScriptConfig: Story = {
  args: {
    language: 'typescript',
    value: `interface VectorPoint {
  id: string;
  vector: number[];
  payload: Record<string, unknown>;
}

export async function upsertPoints(points: VectorPoint[]): Promise<void> {
  // Qdrant batch upsert logic
}`,
  },
};
