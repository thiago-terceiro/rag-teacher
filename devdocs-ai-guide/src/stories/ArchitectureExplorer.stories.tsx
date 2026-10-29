import type { Meta, StoryObj } from '@storybook/react';
import ArchitectureExplorer from '../components/ArchitectureExplorer';
import { I18nProvider } from '../hooks/useI18n';

const meta: Meta<typeof ArchitectureExplorer> = {
  title: 'Architecture/ArchitectureExplorer',
  component: ArchitectureExplorer,
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <I18nProvider>
        <div className="p-4 bg-background min-h-screen text-foreground">
          <Story />
        </div>
      </I18nProvider>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof ArchitectureExplorer>;

export const Default: Story = {};
