# Copilot Instructions for No-Name-Yet

This project is a research-based health tracking application for ConUHacksX, focused on actionable health insights using curated medical research. Use these guidelines to be immediately productive:

## Project Overview
**Purpose:** Track daily health metrics (steps, water, alcohol, cigarettes, heart rate, etc.) and provide weekly insights, comparisons, and recommendations based on hand-picked medical research.

**Data Sources:**
- User input: daily cigarettes, alcohol, water intake
- Apple Health: steps, heart rate, and other metrics

**Highlights:**
- Weekly tracking history and visual highlights
- Comparison system: current week vs. previous weeks, with recommendations
- Alert system: notifies user of health anomalies
- Points system: weekly health grading (A-, B+, etc.)

**Research:** All recommendations are based on med student-curated research.

## Key Files & Directories

### Source Structure
```
src/
├── components/
│   ├── DataInput.jsx           # User input forms for daily metrics
│   ├── WeeklyGrade.jsx          # Weekly health grade display
│   ├── AlertsPanel.jsx          # Health anomaly alerts
│   └── Charts/                  # Visualization components
├── services/
│   ├── appleHealth.js           # Apple Health integration
│   ├── grading.js               # Weekly health scoring logic
│   └── research.js              # Research-based recommendations
├── utils/
│   └── storage.js               # Local storage utilities
└── data/
    └── research-citations.json  # Med student-curated research
```

### Configuration
- `README.md`: Project description and setup instructions
- `.github/copilot-instructions.md`: This file. Keep updated as the project grows.
- `package.json`: Dependencies and scripts

## Development Patterns

### File Organization
- **Components**: Modular React components in `src/components/`
- **Services**: Business logic and external integrations in `src/services/`
- **Utils**: Helper functions and utilities in `src/utils/`
- **Data**: Static data and research citations in `src/data/`

### Documentation
- Add clear JSDoc comments for functions and components
- Include prop types or TypeScript interfaces
- Document any non-obvious logic or algorithms

### Naming Conventions
- Use PascalCase for React components (e.g., `DataInput.jsx`)
- Use camelCase for JavaScript files and functions (e.g., `appleHealth.js`)
- Use descriptive, health/research-related names

## Feature Modules

### Data Collection (`src/components/DataInput.jsx`)
- User input forms for daily metrics
- Form validation and error handling
- Integration with storage utilities

### Analysis (`src/services/grading.js`)
- Weekly tracking and aggregation
- Comparison logic (current vs. previous weeks)
- Points system implementation

### Alerts (`src/components/AlertsPanel.jsx`)
- Health anomaly detection
- Alert prioritization and display
- User notification logic

### Research (`src/services/research.js`)
- Med student-curated research integration
- Recommendation engine
- Citation management

## Workflows

### Development
```bash
npm start       # Start development server
npm test        # Run tests
npm run build   # Build for production
```

### Testing
- Use React Testing Library for component tests
- Follow existing test patterns in `src/App.test.js`
- Test user interactions and edge cases

### Data Flow
1. Collect daily metrics from user and Apple Health
2. Store and aggregate weekly data
3. Analyze trends, compare with previous weeks
4. Generate recommendations and alerts
5. Assign weekly health grade (points system)

## Integration & Dependencies

### Current Dependencies
- React 19.2.3: UI framework
- Recharts 3.7.0: Data visualization
- Lucide React: Icons
- React Testing Library: Testing

### Apple Health Integration
- Uses simulated data for now (actual integration requires native iOS app)
- Document API usage when implementing real integration
- Note platform-specific requirements

### Research Integration
- Research data stored in `src/data/research-citations.json`
- Update logic as new research is added
- Maintain citation integrity

## AI Agent Guidance

### When Creating New Features
1. Prefer modular, well-documented code
2. Follow existing patterns in the codebase
3. Update this file and README with new conventions
4. Add appropriate tests

### When Refactoring
1. Maintain backward compatibility when possible
2. Update related documentation
3. Run full test suite before committing

### If Patterns Are Unclear
- Ask for clarification
- Propose updates to these instructions
- Document new patterns as they emerge

## Example: Adding a New Component

1. Create file in appropriate directory (e.g., `src/components/NewComponent.jsx`)
2. Add JSDoc comments and prop types
3. Export component
4. Create corresponding test file (`NewComponent.test.js`)
5. Update this file if introducing new patterns

```javascript
/**
 * NewComponent - Brief description
 * @param {Object} props - Component props
 * @param {string} props.data - Data to display
 */
function NewComponent({ data }) {
  return <div>{data}</div>;
}

export default NewComponent;
```

---

**Iterate on these instructions as the project evolves. Ask for feedback if any section is unclear or incomplete.**
