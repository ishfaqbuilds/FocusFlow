# FocusFlow - Study Habit Tracker

FocusFlow → Aesthetic Offline First Habit And Study Tracker. Pomodoro, Calendar, Streaks And Goals. Dark Navy And Grass Green. 100% Client Side.

A modern, browser-based study habit tracker built with React, TypeScript, and Tailwind CSS.

## Features

- 📚 **Session Logging**: Track study sessions with subjects, time, topics, and remarks
- 🎯 **Goals Management**: Set and track weekly study goals
- 📅 **Calendar View**: Visual calendar showing study sessions
- 🎲 **Habit Grid**: Streak-based habit tracking with gamification
- ⏱️ **Pomodoro Timer**: Built-in Pomodoro timer for focused study sessions
- ✅ **Task Management**: Track tasks with deadlines and status
- 🔖 **Bookmarks**: Save and organize study resources
- 🔍 **Search**: Search through sessions and data
- 📊 **Statistics**: Visual insights into study patterns
- 🎨 **Customization**: Custom subjects, tags, and themes
- 💾 **Local Storage**: All data stored locally in browser
- 📤 **Import/Export**: Backup and restore data

## Tech Stack

- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **UI Components**: Radix UI
- **Icons**: Lucide React
- **Animations**: Framer Motion
- **Date Handling**: date-fns, react-day-picker
- **Charts**: Recharts

## Deployment

### Netlify Deployment

1. Push this code to a Git repository (GitHub, GitLab, or Bitbucket)
2. Connect your repository to Netlify
3. Netlify will automatically detect the `netlify.toml` configuration
4. The build command is: `pnpm run build`
5. The publish directory is: `dist`

### Manual Deployment

1. Install dependencies:
   ```bash
   pnpm install
   ```

2. Build the project:
   ```bash
   pnpm run build
   ```

3. The optimized production files will be in the `dist` directory
4. Upload the contents of `dist` to any static hosting service

## Development

1. Install dependencies:
   ```bash
   pnpm install
   ```

2. Start development server:
   ```bash
   pnpm run dev
   ```

3. The app will be available at `http://localhost:5173`

## Scripts

- `pnpm run dev` - Start development server
- `pnpm run build` - Build for production
- `pnpm run preview` - Preview production build
- `pnpm run typecheck` - Run TypeScript type checking

## Data Storage

All data is stored in the browser's localStorage, including:
- Study sessions
- Goals and targets
- Tasks and deadlines
- Bookmarks
- Settings and preferences
- Attachments (PDFs and links)

⚠️ **Important**: Clearing browser data will delete all saved data. Use the Import/Export feature to backup your data regularly.

## License

This project is private and intended for personal use.