import { render, screen } from '@testing-library/react';
import App from './App';

test('renders Health Tracker title', () => {
  render(<App />);
  const titleElement = screen.getByText(/Health Tracker/i);
  expect(titleElement).toBeInTheDocument();
});

test('renders Daily Health Metrics section', () => {
  render(<App />);
  const metricsTitle = screen.getByText(/Daily Health Metrics/i);
  expect(metricsTitle).toBeInTheDocument();
});

test('renders Weekly Grade section', () => {
  render(<App />);
  const gradeTitle = screen.getByText(/Your Weekly Health Grade/i);
  expect(gradeTitle).toBeInTheDocument();
});

test('renders Health Alerts section', () => {
  render(<App />);
  const alertsTitle = screen.getByText(/Health Alerts/i);
  expect(alertsTitle).toBeInTheDocument();
});

