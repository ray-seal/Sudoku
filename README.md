# Sudoku Game

A modern, Progressive Web App (PWA) implementation of the classic Sudoku puzzle game with multiple difficulty levels.

## Features

- 🎮 **Four Difficulty Levels**: Easy, Medium, Hard, and Expert
- 🎲 **Random Board Generation**: Each game is unique with randomly generated puzzles
- ⏱️ **Built-in Timer**: Track how long it takes to solve each puzzle
- 🏆 **Leaderboard**: Top 10 fastest completion times stored in local storage
- 📱 **Responsive Design**: Works seamlessly on desktop, tablet, and mobile devices
- 💾 **Progressive Web App**: Install and play offline
- ✨ **Modern UI**: Clean, intuitive interface with smooth animations

## How to Play

1. Select a difficulty level from the start screen
2. Tap or click on any empty cell to select it
3. Use keyboard numbers (1-9) or tap to input a number
4. Press Backspace or 0 to clear a cell
5. Complete the puzzle by filling all cells correctly
6. Your time will be recorded in the leaderboard upon completion

## Difficulty Levels

- **Easy**: 35 cells removed (~38% of the board)
- **Medium**: 45 cells removed (~49% of the board)
- **Hard**: 52 cells removed (~58% of the board)
- **Expert**: 58 cells removed (~64% of the board)

## Development

This is a pure vanilla JavaScript application with no build dependencies. Simply open `index.html` in a web browser to run locally.

### Files

- `index.html` - Main HTML structure
- `styles.css` - Styling and responsive design
- `app.js` - Game logic and UI interactions
- `sudoku-generator.js` - Sudoku puzzle generation algorithm
- `manifest.json` - PWA manifest configuration
- `service-worker.js` - Service worker for offline functionality
- `icon.svg` - Application icon

## Deployment

### Vercel

This project is configured for easy deployment on Vercel:

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

Or use the Vercel GitHub integration for automatic deployments.

### Other Platforms

Since this is a static site, it can be deployed on any static hosting service:
- GitHub Pages
- Netlify
- Firebase Hosting
- AWS S3 + CloudFront

## Browser Support

Works on all modern browsers supporting:
- ES6+ JavaScript
- CSS Grid
- Local Storage
- Service Workers (for PWA features)

## License

MIT License - Feel free to use and modify as needed.