import type { Meta, StoryObj } from '@storybook/react';
import ProgressRing from '../components/ProgressRing';

const meta: Meta<typeof ProgressRing> = {
  title: 'Curriculum/ProgressRing',
  component: ProgressRing,
  tags: ['autodocs'],
  argTypes: {
    value: { control: { type: 'range', min: 0, max: 100, step: 1 } },
  },
};

export default meta;
type Story = StoryObj<typeof ProgressRing>;

export const ZeroPercent: Story = {
  args: {
    value: 0,
  },
};

export const FiftyPercent: Story = {
  args: {
    value: 50,
  },
};

export const Completed: Story = {
  args: {
    value: 100,
  },
};
