import type { Meta, StoryObj } from '@storybook/react';
import ChunkingCalculator from '../components/ChunkingCalculator';

const meta: Meta<typeof ChunkingCalculator> = {
  title: 'Calculators/ChunkingCalculator',
  component: ChunkingCalculator,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof ChunkingCalculator>;

export const Default: Story = {};
