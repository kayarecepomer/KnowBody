import { render, screen } from '@testing-library/react';
import App from './App';

test('renders Health Tracker title', () => {
  render(<App />);
  const titleElement = screen.getByText(/Health Tracker/i);
  expect(titleElement).toBeInTheDocument();
});

test('renders navigation', () => {
  render(<App />);
  const dailyNav = screen.getByText(/Daily/i);
  const statsNav = screen.getByText(/Stats/i);
  expect(dailyNav).toBeInTheDocument();
  expect(statsNav).toBeInTheDocument();
});

test('renders Daily page by default', () => {
  render(<App />);
  const dailyTitle = screen.getByText(/Daily Health Tracking/i);
  expect(dailyTitle).toBeInTheDocument();
});

