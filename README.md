# LifeInOrderMobile

A React Native habit tracking app with a visual grid interface for tracking daily habits and their states.

## Features

- **Visual Grid View** - Calendar-style grid with habits as columns and days as rows
- **Custom Habits** - Create, edit, reorder, and delete habits with configurable weights
- **Color-Coded Values** - Each habit supports multiple values/states with customizable colors and labels
- **Pinch-to-Zoom** - Scale the grid view with gesture controls
- **Day Detail View** - View and edit all habit values for a specific day
- **Infinite Scroll** - Lazy loading of historical data

## Tech Stack

| Category | Technology |
|----------|------------|
| Framework | React Native 0.81 |
| Platform | Expo SDK 54 |
| Language | TypeScript |
| Navigation | Expo Router |
| State | React Context API |
| HTTP | Axios |
| Animations | React Native Reanimated |

## Getting Started

### Prerequisites

- Node.js
- npm or yarn
- Expo CLI
- iOS Simulator / Android Emulator / Physical device with Expo Go

### Installation

```bash
# Install dependencies
npm install

# Start the development server
npm start
```

### Running the App

```bash
npm run android    # Run on Android
npm run ios        # Run on iOS
npm run web        # Run on web
```

## Project Structure

```
app/
├── api/           # API client
├── components/    # Reusable UI components
├── constants/     # Theme and zoom configurations
├── context/       # Global state (AppContext)
├── day/           # Day-related routes
├── screens/       # Main screen components
├── state/         # Reducers and selectors
└── types/         # TypeScript definitions
```

## Backend

The app requires a REST API server. Configure the server URL in `app/api/client.ts`.

### API Endpoints

- `GET /users/:id/config` - User habits configuration
- `GET /users/:id/list` - Habit data for date range
- `POST /day_values` - Set habit value for a date
- CRUD endpoints for habits and values

## License

MIT
