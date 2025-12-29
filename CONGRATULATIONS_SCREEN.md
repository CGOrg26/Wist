# Congratulations Screen

A beautiful celebration page with confetti and fireworks that appears when players complete a chapter.

## Features

- **Animated confetti** - 80 colorful particles falling from the top
- **Firework bursts** - 5 firework animations with sparks
- **Trophy animation** - Bouncing trophy emoji with glow effect
- **Dynamic title** - "Congratulations!" with alternating purple/orange glow
- **Chapter display** - Shows which chapter was completed with gradient text
- **Stats display** - Three animated stat cards showing completion achievements
- **Continue button** - Pulsing orange button to return to the lobby

## How It Works

The congratulations screen is automatically triggered when a player reaches the end of a chapter (completes all levels in that chapter).

### Automatic Trigger

The screen is triggered automatically in [PlayerCheckpoints.js](client/src/components/player/PlayerCheckpoints.js):

- When the player crosses `CHAPTER_COMPLETE_Z = -200` (end of level 3)
- The function `window.showChapterComplete(chapterNumber)` is called
- This displays the congratulations screen with confetti

### Manual Trigger

You can also manually trigger the congratulations screen from anywhere in your code:

```javascript
// Show congratulations for completing chapter 1
if (typeof window.showChapterComplete === 'function') {
  window.showChapterComplete(1);
}

// Show congratulations for completing chapter 2
if (typeof window.showChapterComplete === 'function') {
  window.showChapterComplete(2);
}
```

### Example: Trigger on Level Completion

If you want to trigger it when a specific puzzle or objective is completed:

```javascript
// In your level or puzzle code
function onPuzzleComplete() {
  const currentChapter = 1; // or however you track the chapter

  // Show congratulations
  if (typeof window.showChapterComplete === 'function') {
    window.showChapterComplete(currentChapter);
  }
}
```

## Customization

### Adjust the Completion Threshold

To change when the congratulations screen appears, modify the `CHAPTER_COMPLETE_Z` constant in `PlayerCheckpoints.js`:

```javascript
const CHAPTER_COMPLETE_Z = -200; // Change this value
```

- More negative values = player needs to go further to complete
- Less negative values = player completes earlier

### Styling

All styles are in [CongratulationsPage.css](client/src/components/CongratulationsPage.css).

Key customizable elements:
- `.confetti-piece` - Confetti colors and animation speed
- `.firework-spark` - Firework colors and burst pattern
- `.congrats-title` - Title size and glow effect
- `.congrats-continue-btn` - Button colors and animations

### Colors

The confetti uses these colors (you can modify in the component):
- Purple: `#8a77ff`, `#a68fff`, `#c8b8ff`
- Orange: `#ff6b35`, `#ff8c42`, `#ffb347`

## File Structure

```
client/src/components/
├── CongratulationsPage.jsx    # Main component
├── CongratulationsPage.css    # All styles and animations
└── player/
    ├── PlayerCheckpoints.js   # Auto-trigger logic
    └── Player.js              # Player state initialization

client/src/
└── App.jsx                    # Screen rendering and state management
```

## Testing

To test the congratulations screen without playing through the entire chapter:

1. **Quick test**: Add this to the console in your browser:
   ```javascript
   window.showChapterComplete(1)
   ```

2. **Temporary trigger**: In your game code, add:
   ```javascript
   // Press 'C' key to show congratulations (dev only)
   window.addEventListener('keydown', (e) => {
     if (e.key === 'c' && window.showChapterComplete) {
       window.showChapterComplete(1);
     }
   });
   ```

## Accessibility

The congratulations screen includes:
- Reduced motion support - animations are disabled when `prefers-reduced-motion` is set
- Proper semantic HTML structure
- ARIA labels for decorative elements
- Keyboard accessible continue button

## Notes

- The screen automatically returns to the lobby when the continue button is clicked
- The confetti and fireworks are purely decorative and don't affect gameplay
- The screen appears on top of everything with `z-index: 10000`
