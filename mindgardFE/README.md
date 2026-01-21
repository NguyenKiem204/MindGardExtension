# Focus Dashboard Chrome Extension

A Chrome extension that transforms your new tab into a deep work dashboard with Pomodoro timer, weather ambiance, music player, to-do list, AI content blocking, and productivity statistics.

## Features

- **Pomodoro Timer**: Customizable work/break sessions with keyboard shortcuts
- **Weather Ambiance**: Rain, snow, and sunny video backgrounds
- **Music Player**: Built-in focus music with volume control
- **To-Do List**: Persistent task management with chrome.storage
- **AI Content Blocking**: Smart content classification using Gemini API
- **Statistics**: Weekly productivity charts and streak tracking
- **Notifications**: Session completion alerts

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Add Your Assets

- Place weather videos in `public/weather/`:
  - `rain.mp4`
  - `snow.mp4`
  - `sunny.mp4`
- Add background images to `public/backgrounds/` (optional)

### 3. Get Gemini API Key

1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create a new API key
3. Copy the key for the options page

### 4. Build Extension

```bash
npm run build
```

### 5. Load in Chrome

1. Open Chrome Extensions (`chrome://extensions/`)
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select the `dist` folder

## Usage

1. **Configure Settings**: Click "Settings" on the dashboard or go to `chrome://extensions/` → Options
2. **Set API Key**: Paste your Gemini API key in the options page
3. **Start Focus Session**: Use the Pomodoro timer or press Space to start
4. **Keyboard Shortcuts**:
   - Space: Start/Pause timer
   - R: Reset timer

## Development

```bash
# Development server
npm run dev

# Build for production
npm run build

# Lint code
npm run lint
```

## File Structure

```
src/
├── components/          # React components
│   ├── Dashboard.jsx    # Main dashboard layout
│   ├── PomodoroTimer.jsx # Timer with controls
│   ├── WeatherLayer.jsx  # Video background layer
│   ├── MusicPlayer.jsx   # Audio player
│   ├── TodoList.jsx      # Task management
│   └── Statistics.jsx    # Charts and stats
├── options/             # Options page
├── utils/               # Helper functions
└── main.jsx            # Entry point

public/
├── extension/           # Extension scripts
│   ├── background.js   # Service worker
│   └── content.js      # Content script
├── manifest.json       # Extension manifest
├── weather/            # Video files
└── backgrounds/        # Background images
```

## API Integration

The extension uses Google's Gemini API for content classification. Content is classified as either "work_or_study" or "entertainment" based on page title and description.

## Privacy

- All data is stored locally using Chrome's storage APIs
- API keys are stored in chrome.storage.local
- No data is sent to external servers except for content classification
- Weather videos and music URLs are embedded (no tracking)

## Troubleshooting

- **Videos not playing**: Ensure video files are in `public/weather/` and named correctly
- **API errors**: Check your Gemini API key in the options page
- **Notifications not working**: Grant notification permission in Chrome settings
- **Build issues**: Run `npm run copy-extension` manually if needed

## License

MIT License - feel free to modify and distribute.
