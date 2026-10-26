import type { Meta, StoryObj } from '@storybook/react';
import { VectorVisualizer } from '../components/VectorVisualizer';

const meta: Meta<typeof VectorVisualizer> = {
  title: 'Calculators/VectorVisualizer',
  component: VectorVisualizer,
  tags: ['autodocs'],
  argTypes: {
    isOpen: { control: 'boolean' },
  },
};

export default meta;
type Story = StoryObj<typeof VectorVisualizer>;

export const OpenModal: Story = {
  args: {
    isOpen: true,
    setIsOpen: () => {},
  },
};
