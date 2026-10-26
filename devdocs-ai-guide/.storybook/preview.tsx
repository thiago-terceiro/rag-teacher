import type { Preview } from '@storybook/react';
import React from 'react';
import '@fontsource/inter/400.css';
import '@fontsource/inter/500.css';
import '@fontsource/inter/600.css';
import '@fontsource/inter/700.css';
import '@fontsource/inter/800.css';
import '../src/index.css';
import { I18nProvider } from '../src/hooks/useI18n';
import { ReadingSettingsProvider } from '../src/hooks/useReadingSettings';
import { StepsProvider } from '../src/hooks/useSteps';
import { SandboxProvider } from '../src/context/SandboxContext';

const preview: Preview = {
  parameters: {
    actions: { argTypesRegex: '^on[A-Z].*' },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    backgrounds: {
      default: 'dark',
      values: [
        { name: 'dark', value: '#090d16' },
        { name: 'oled', value: '#000000' },
        { name: 'light', value: '#ffffff' },
      ],
    },
  },
  decorators: [
    (Story) => (
      <I18nProvider>
        <ReadingSettingsProvider>
          <StepsProvider>
            <SandboxProvider>
              <div className="bg-background text-foreground min-h-screen p-6 font-sans antialiased">
                <Story />
              </div>
            </SandboxProvider>
          </StepsProvider>
        </ReadingSettingsProvider>
      </I18nProvider>
    ),
  ],
};

export default preview;
