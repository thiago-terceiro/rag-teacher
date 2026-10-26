import type { Meta, StoryObj } from '@storybook/react';
import RRFSimulator from '../components/RRFSimulator';

const meta: Meta<typeof RRFSimulator> = {
  title: 'Calculators/RRFSimulator',
  component: RRFSimulator,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof RRFSimulator>;

export const Default: Story = {};
