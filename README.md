# KnowBody

**Built in 24 hours for ConUHacks X**

A research-based health tracking application developed by 1 University of Toronto Computer Science student and 1 Med School student. We invested 12 hours searching and finding the correct researches, then hand-picked 18 different studies through hours of hard work. We do not use LLMs or other AI tools to suggest anything to users—we believe they are more valuable than that. Our algorithms are built only and only from those 18 hand-picked researches.

## Overview

KnowBody is a comprehensive health tracking application that helps you monitor daily health metrics and provides weekly insights, comparisons, and recommendations based on curated medical research.

### Key Features

- **Daily Health Tracking**: Track cigarettes, alcohol, water intake, steps, and heart rate
- **Weekly Grading System**: Get a letter grade (A+ to F) based on your health metrics
- **Smart Alerts**: Receive notifications about health anomalies and risks
- **Visual Trends**: See your health metrics over time with interactive charts
- **Research-Based**: All recommendations backed by 18 hand-picked medical studies

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/kayarecepomer/KnowBody.git
cd KnowBody
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm start
```

The application will open at [http://localhost:3000](http://localhost:3000)

## Usage

### Tracking Daily Metrics

1. Enter your daily health metrics (date, cigarettes, alcohol, water)
2. Click "Save Data" to store your metrics
3. View your weekly grade and health alerts
4. Monitor trends in the visual charts

Your weekly health grade is calculated based on hydration (25 pts), alcohol moderation (25 pts), smoking (25 pts), and activity (25 pts).

## Health Metrics Guidelines

Based on our 18 hand-picked medical researches:

- **Water**: 8 glasses per day
- **Alcohol**: ≤2 drinks/day for men, ≤1 for women
- **Smoking**: 0 cigarettes (no safe level)
- **Steps**: 10,000 steps per day

## Available Scripts

- `npm start` - Run the app in development mode
- `npm test` - Launch the test runner
- `npm run build` - Build the app for production

## Research Foundation

All health recommendations are based on 18 peer-reviewed medical researches hand-picked by our med student team member. No AI or LLM tools are used for suggestions. See `src/data/research-citations.json` for complete citations.

## Data Storage

Health data is stored locally in your browser using `localStorage`. Your data remains private on your device.

## License

See LICENSE file for details

---

**Built with ❤️ in 24 hours for ConUHacks X**

**Stay healthy! 🏃‍♂️💪🥤**

