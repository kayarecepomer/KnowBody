<img width="341" height="98" alt="Screenshot 2026-01-25 at 9 24 33 AM" src="https://github.com/user-attachments/assets/8385d7c0-651f-4880-b41a-c3b43bc95fa3" />

**Built in 24 hours for ConUHacks X**

A research-based health tracking application developed by a University of Toronto Computer Science student and a Med School student. We invested 12 hours searching and finding the correct researches, then hand-picked 18 different studies through hours of hard work. We do not use LLMs or other AI tools to suggest anything to users—we believe they are more valuable than that. Our algorithms are built only and only from those 18 hand-picked researches.

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

Based on our 18 hand-picked medical researches:

- **Water**: 8 glasses per day
- **Alcohol**: ≤2 drinks/day for men, ≤1 for women
- **Smoking**: 0 cigarettes (no safe level)
- **Steps**: 10,000 steps per day

## Available Scripts

- `npm start` - Run the app in development mode
- `npm test` - Launch the test runner in interactive watch mode
- `npm run build` - Build the app for production to the `build` folder

## Technical Details

### Grading Algorithm

The weekly health scoring system evaluates four key metrics, each worth 25 points:

1. **Hydration Score**: Based on average daily water intake compared to 8 glasses/day target
2. **Alcohol Moderation Score**: Inverse scoring - fewer drinks result in higher scores
3. **Smoking Score**: Zero-tolerance scoring aligned with CDC guidelines
4. **Activity Score**: Based on daily step count compared to 10,000 steps/day target

The total score (0-100) is converted to letter grades: A+ (97-100), A (93-96), A- (90-92), B+ (87-89), B (83-86), B- (80-82), C+ (77-79), C (73-76), C- (70-72), D+ (67-69), D (63-66), D- (60-62), F (<60).

### Alert System

The alert system analyzes your health data against research-backed thresholds:

- **High Severity Alerts**: Triggered when metrics indicate immediate health risks (e.g., excessive smoking, dangerous alcohol levels)
- **Medium Severity Alerts**: Triggered when metrics show concerning trends that need attention
- **Low Severity Alerts**: Positive reinforcement for healthy behaviors

All alert thresholds are derived from the 18 peer-reviewed medical researches in our database.

### Data Management

- **Local Storage**: All health data is stored in browser `localStorage` with a structured JSON format
- **Data Persistence**: Data persists across sessions but remains entirely on your device
- **Privacy**: No data is transmitted to external servers; all processing happens client-side

## Research Foundation

All health recommendations are based on 18 peer-reviewed medical researches hand-picked by our med student team member. No AI or LLM tools are used for suggestions. See `src/data/research-citations.json` for complete citations.

### Key Research Sources

- National Academies of Sciences (Hydration)
- USDA Dietary Guidelines (Alcohol)
- CDC/Surgeon General (Smoking)
- WHO Physical Activity Guidelines (Exercise)
- American Heart Association (Heart Health)
- Journal of Medical Internet Research (Health Tracking)

## Development

### Adding New Components

1. Create a new file in `src/components/`
2. Follow the existing component structure with JSDoc comments
3. Export the component and import in `App.js`
4. Add corresponding test file using React Testing Library

### Adding New Research

1. Add citation to `src/data/research-citations.json` with proper structure:
   ```json
   {
     "title": "Research Title",
     "source": "Institution/Journal",
     "year": 2024,
     "citation": "Full citation",
     "keyFindings": ["Finding 1", "Finding 2"]
   }
   ```
2. Update relevant service files (`grading.js` or `research.js`)
3. Update component logic to display new recommendations

### Testing

Follow existing test patterns in `src/App.test.js`. Use React Testing Library for component tests.

```bash
npm test              # Run tests in watch mode
npm test -- --coverage # Run tests with coverage report
```

## Data Storage

Health data is stored locally in your browser using `localStorage`. Your data remains private on your device.

## License

See LICENSE file for details

---

**Built with ❤️ in 24 hours for ConUHacks X**

**Stay healthy! 🏃‍♂️💪🥤**

