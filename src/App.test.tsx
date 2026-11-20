import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import App from './App';
import { APP_NAME } from './appName';

describe('App frame', () => {
  it('has exactly one banner landmark, holding the app name', () => {
    render(<App />);
    const banners = screen.getAllByRole('banner');
    expect(banners).toHaveLength(1);
    expect(within(banners[0]).getByText(APP_NAME)).toBeInTheDocument();
  });

  it('has exactly one main landmark, empty for the task screen', () => {
    render(<App />);
    const mains = screen.getAllByRole('main');
    expect(mains).toHaveLength(1);
    expect(mains[0]).toHaveTextContent('');
  });
});
