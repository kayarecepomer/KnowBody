# No-Name-Yet

Research-based health tracking application for ConUHacksX

## Overview

A comprehensive health tracking application that helps users monitor daily health metrics and provides weekly insights, comparisons, and recommendations based on curated medical research.

### Key Features

- **Daily Health Tracking**: Track cigarettes, alcohol, water intake, steps, and heart rate
- **Weekly Grading System**: Get a letter grade (A+ to F) based on your health metrics
- **Smart Alerts**: Receive notifications about health anomalies and risks
- **Visual Trends**: See your health metrics over time with interactive charts
- **Research-Based**: All recommendations backed by medical research

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn

### installation

1. Clone the repository:
```bash
git clone https://github.com/kayarecepomer/No-Name-Yet.git
cd No-Name-Yet
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

## Project Structure

```
src/
├── components/
│   ├── DataInput.jsx           # User input forms for daily metrics
│   ├── WeeklyGrade.jsx          # Weekly health grade display
│   ├── AlertsPanel.jsx          # Health anomaly alerts
│   └── Charts/
│       └── WeeklyTrendsChart.jsx # Visual trends chart
├── services/
│   ├── appleHealth.js           # Apple Health integration (simulated)
│   ├── grading.js               # Weekly health scoring logic
│   └── research.js              # Research-based recommendations
├── utils/
│   └── storage.js               # Local storage utilities
└── data/
    └── research-citations.json  # Medical research references
```

## Usage

### Tracking Daily Metrics

1. Navigate to the Data Input section
2. Enter your daily health metrics:
   - Date (defaults to today)
   - Number of cigarettes
   - Alcohol consumption (drinks)
   - Water intake (glasses)
3. Click "Save Data" to store your metrics

### Viewing Your Weekly Grade

Your weekly health grade is automatically calculated based on:
- **Hydration** (25 points): Based on daily water intake
- **Alcohol Moderation** (25 points): Based on alcohol consumption
- **Smoking** (25 points): Based on cigarette usage
- **Activity** (25 points): Based on steps (when available)

Grades range from A+ (97-100) to F (below 60).

### Understanding Alerts

The Alerts Panel displays:
- **High Severity** (Red): Immediate health concerns requiring attention
- **Medium Severity** (Orange): Areas that need improvement
- **Low Severity** (Blue): Positive reinforcement and encouragement

### Viewing Trends

The Weekly Trends Chart shows your metrics over time:
- Water intake (blue line)
- Alcohol consumption (orange line)
- Cigarettes (red line)

## Health Metrics Guidelines

Based on medical research, the application uses these benchmarks:

- **Water**: 8 glasses per day (National Academies of Sciences)
- **Alcohol**: ≤2 drinks per day for men, ≤1 for women (USDA Dietary Guidelines)
- **Smoking**: 0 cigarettes (no safe level - CDC)
- **Steps**: 10,000 steps per day (WHO Physical Activity Guidelines)

## Apple Health Integration

Currently, Apple Health integration is simulated. Future versions will include:
- Real-time step tracking from HealthKit
- Heart rate monitoring
- Sleep tracking integration
- Workout data synchronization

## Available Scripts

### `npm start`

Runs the app in development mode at [http://localhost:3000](http://localhost:3000)

### `npm test`

Launches the test runner in interactive watch mode

### `npm run build`

Builds the app for production to the `build` folder

## Development

### Adding New Components

1. Create a new file in `src/components/`
2. Follow the existing component structure
3. Add JSDoc comments for documentation
4. Export the component
5. Import and use in `App.js`

### Adding New Research

1. Add citation to `src/data/research-citations.json`
2. Update relevant service files (`grading.js` or `research.js`)
3. Update component logic to display new recommendations

### Testing

Follow existing test patterns in `src/App.test.js`. Use React Testing Library for component tests.

## Data Storage

Health data is stored locally in the browser using `localStorage`. Data persists across sessions but remains on your device.

### Exporting Data

Use the storage utility functions to export your data:
```javascript
import { exportHealthData } from './utils/storage';
const jsonData = exportHealthData();
```

## Research References

All health recommendations are based on peer-reviewed medical research. See `src/data/research-citations.json` for complete citations including:

- National Academies of Sciences (Hydration)
- USDA Dietary Guidelines (Alcohol)
- CDC/Surgeon General (Smoking)
- WHO Physical Activity Guidelines (Exercise)
- American Heart Association (Heart Health)

## Contributing

This project was created for ConUHacksX. Contributions are welcome!

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## License

See LICENSE file for details

## Acknowledgments

- Built for ConUHacksX hackathon
- Medical research curated by medical students
- Icons provided by Lucide React
- Charts powered by Recharts

## Future Enhancements

- [ ] Real Apple Health integration
- [ ] User authentication and cloud sync
- [ ] Social features and community challenges
- [ ] Advanced analytics and ML predictions
- [ ] Mobile app (iOS/Android)
- [ ] Integration with other health platforms

## Support

For issues or questions, please open an issue on GitHub.

---

**Stay healthy! 🏃‍♂️💪🥤**

