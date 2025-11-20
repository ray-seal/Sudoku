// Main App Logic
class SudokuGame {
    constructor() {
        this.generator = new SudokuGenerator();
        this.currentPuzzle = null;
        this.currentSolution = null;
        this.currentDifficulty = null;
        this.userBoard = null;
        this.selectedCell = null;
        this.timerInterval = null;
        this.startTime = null;
        this.elapsedTime = 0;
        
        this.initializeApp();
    }

    initializeApp() {
        console.log('[SudokuGame] initializing');

        // Use event delegation on the container so clicks are reliably handled
        const container = document.querySelector('.difficulty-buttons');
        if (container) {
            container.addEventListener('click', (e) => {
                const btn = e.target.closest('.difficulty-btn');
                if (!btn) return;
                const difficulty = btn.dataset.difficulty;
                console.log('[SudokuGame] difficulty clicked (delegation):', difficulty);
                this.startGame(difficulty);
            });
        } else {
            // Fallback: direct binding to individual buttons (if container not present)
            document.querySelectorAll('.difficulty-btn').forEach(btn => {
                try { btn.type = 'button'; } catch (err) {}
                btn.addEventListener('click', (e) => {
                    const difficulty = btn.dataset.difficulty || e.currentTarget.dataset.difficulty;
                    console.log('[SudokuGame] difficulty clicked (direct):', difficulty);
                    this.startGame(difficulty);
                });
            });
        }

        // Setup back button
        const backBtn = document.getElementById('back-btn');
        if (backBtn) {
            backBtn.addEventListener('click', () => {
                this.stopTimer();
                this.showScreen('start-screen');
            });
        } else {
            console.warn('[SudokuGame] back button not found');
        }

        // Setup keyboard input
        document.addEventListener('keydown', (e) => {
            if (this.selectedCell) {
                if (e.key >= '1' && e.key <= '9') {
                    this.handleNumberInput(parseInt(e.key));
                } else if (e.key === 'Backspace' || e.key === 'Delete' || e.key === '0') {
                    this.handleNumberInput(0);
                }
            }
        });

        // Number pad for touch input (delegated)
        const numberPad = document.getElementById('number-pad');
        if (numberPad) {
            numberPad.addEventListener('click', (e) => {
                const btn = e.target.closest('.num-btn');
                if (!btn) return;
                const num = parseInt(btn.dataset.number, 10);
                if (isNaN(num)) return;
                if (!this.selectedCell) {
                    this._flashSelectCellMessage();
                    return;
                }
                // delegate to existing handler
                this.handleNumberInput(num);
            });
        }

        // Setup debug banner dismiss button
        const debugDismiss = document.getElementById('debug-dismiss');
        if (debugDismiss) {
            debugDismiss.addEventListener('click', () => {
                const dbg = document.getElementById('debug-banner');
                if (dbg) dbg.style.display = 'none';
            });
        }

        // Load and display leaderboard
        this.displayLeaderboard();
    }

    // Flash a small message instructing the user to select a cell
    _flashSelectCellMessage() {
        const msg = document.getElementById('game-message');
        if (!msg) return;
        const previous = msg.textContent;
        msg.textContent = 'Select a cell first';
        msg.className = 'message warning';
        // small animation (optional)
        msg.style.transition = 'opacity 0.25s';
        msg.style.opacity = '1';
        setTimeout(() => {
            msg.textContent = previous || '';
            msg.className = 'message';
            msg.style.opacity = '';
            msg.style.transition = '';
        }, 1200);
    }

    // helper to show debug messages in UI
    _showDebugMessage(msg, autoHideMs = 6000) {
        try {
            const dbg = document.getElementById('debug-banner');
            const m = document.getElementById('debug-message');
            if (dbg && m) {
                m.textContent = msg;
                dbg.style.display = 'flex';
                if (autoHideMs > 0) setTimeout(() => { dbg.style.display = 'none'; }, autoHideMs);
            }
        } catch (e) { console.warn('Failed to show debug banner', e); }
    }

    startGame(difficulty) {
        console.log('[SudokuGame] startGame called with difficulty:', difficulty);

        // Guard: ensure generator is available
        if (!this.generator || typeof this.generator.createPuzzle !== 'function') {
            console.error('[SudokuGame] generator missing or invalid', this.generator);
            const messageEl = document.getElementById('game-message');
            if (messageEl) {
                messageEl.textContent = 'Error: game engine unavailable. Please reload the page.';
                messageEl.className = 'message warning';
            }
            this._showDebugMessage('Error: game engine unavailable. Please reload the page.', 0);
            return;
        }

        this.currentDifficulty = difficulty;

        try {
            // Generate puzzle
            const result = this.generator.createPuzzle(difficulty);
            // Defensive: verify result shape
            if (!result || !Array.isArray(result.puzzle) || !Array.isArray(result.solution)) {
                throw new Error('Invalid puzzle/solution returned from generator');
            }
            const { puzzle, solution } = result;

            this.currentPuzzle = puzzle;
            this.currentSolution = solution;
            this.userBoard = puzzle.map(row => [...row]);

            // Setup UI
            this.showScreen('game-screen');
            const diffEl = document.getElementById('difficulty-display');
            if (diffEl) diffEl.textContent = difficulty.charAt(0).toUpperCase() + difficulty.slice(1);
            this.renderBoard();
            this.startTimer();

            // Clear message
            const messageEl = document.getElementById('game-message');
            if (messageEl) {
                messageEl.textContent = '';
                messageEl.className = 'message';
            }
        } catch (err) {
            console.error('[SudokuGame] startGame failed:', err);
            const messageEl = document.getElementById('game-message');
            if (messageEl) {
                messageEl.textContent = 'An error occurred while starting the game. See debug banner.';
                messageEl.className = 'message warning';
            }
            this._showDebugMessage('Start failed: ' + (err && err.message ? err.message : String(err)), 0);
        }
    }

    renderBoard() {
        const grid = document.getElementById('sudoku-grid');
        grid.innerHTML = '';

        for (let row = 0; row < 9; row++) {
            for (let col = 0; col < 9; col++) {
                const cell = document.createElement('div');
                cell.className = 'cell';
                cell.dataset.row = row;
                cell.dataset.col = col;

                const value = this.userBoard[row][col];
                if (value !== 0) {
                    cell.textContent = value;
                    if (this.currentPuzzle[row][col] !== 0) {
                        cell.classList.add('given');
                    } else {
                        cell.classList.add('user-input');
                    }
                }

                // Add click handler
                cell.addEventListener('click', () => this.selectCell(row, col));

                grid.appendChild(cell);
            }
        }
    }

    selectCell(row, col) {
        // Don't allow selecting given cells
        if (this.currentPuzzle[row][col] !== 0) {
            return;
        }

        // Remove previous selection
        document.querySelectorAll('.cell').forEach(cell => {
            cell.classList.remove('selected');
        });

        // Select new cell
        this.selectedCell = { row, col };
        const cellEl = document.querySelector(`.cell[data-row="${row}"][data-col="${col}"]`);
        if (cellEl) cellEl.classList.add('selected');
    }

    handleNumberInput(num) {
        if (!this.selectedCell) return;

        const { row, col } = this.selectedCell;
        
        // Update user board
        this.userBoard[row][col] = num;

        // Update cell display
        const cellEl = document.querySelector(`.cell[data-row="${row}"][data-col="${col}"]`);
        if (!cellEl) return;
        cellEl.textContent = num === 0 ? '' : num;
        
        if (num === 0) {
            cellEl.classList.remove('user-input', 'incorrect');
        } else {
            cellEl.classList.add('user-input');
            
            // Check if the number is correct
            if (num !== this.currentSolution[row][col]) {
                cellEl.classList.add('incorrect');
            } else {
                cellEl.classList.remove('incorrect');
            }
        }

        // Check if puzzle is complete
        this.checkCompletion();
    }

    checkCompletion() {
        // Check if all cells are filled
        for (let row = 0; row < 9; row++) {
            for (let col = 0; col < 9; col++) {
                if (this.userBoard[row][col] === 0) {
                    return;
                }
                if (this.userBoard[row][col] !== this.currentSolution[row][col]) {
                    return;
                }
            }
        }

        // Puzzle completed!
        this.stopTimer();
        this.showCompletionMessage();
        this.saveScore();
    }

    showCompletionMessage() {
        const messageEl = document.getElementById('game-message');
        const timeStr = this.formatTime(this.elapsedTime);
        messageEl.textContent = `🎉 Congratulations! You completed the puzzle in ${timeStr}!`;
        messageEl.className = 'message success';
    }

    startTimer() {
        this.startTime = Date.now();
        this.elapsedTime = 0;
        this.updateTimerDisplay();
        
        this.timerInterval = setInterval(() => {
            this.elapsedTime = Math.floor((Date.now() - this.startTime) / 1000);
            this.updateTimerDisplay();
        }, 1000);
    }

    stopTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
    }

    updateTimerDisplay() {
        const display = document.getElementById('timer-display');
        display.textContent = this.formatTime(this.elapsedTime);
    }

    formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }

    // Save score into per-difficulty top lists (top 5 fastest per difficulty)
    saveScore() {
        const allScores = this._getAllScoresObject();

        const difficulty = this.currentDifficulty || 'easy';
        if (!allScores[difficulty]) allScores[difficulty] = [];

        allScores[difficulty].push({
            difficulty: difficulty,
            time: this.elapsedTime,
            date: new Date().toISOString()
        });

        // Sort ascending by time and keep top 5 for this difficulty
        allScores[difficulty].sort((a, b) => a.time - b.time);
        allScores[difficulty] = allScores[difficulty].slice(0, 5);

        // Persist
        try {
            localStorage.setItem('sudoku-scores', JSON.stringify(allScores));
        } catch (err) {
            console.warn('Failed to save scores', err);
        }
        this.displayLeaderboard();
    }

    // Helper: return the stored scores as an object keyed by difficulty.
    // Also migrates old-format array to new object format if necessary.
    _getAllScoresObject() {
        const stored = localStorage.getItem('sudoku-scores');
        if (!stored) return {};
        try {
            const parsed = JSON.parse(stored);
            // If it's already the new object form (keys per difficulty), just return it.
            if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
                // Ensure each difficulty array exists (for display consistency)
                const difficulties = ['easy','medium','hard','expert'];
                difficulties.forEach(d => {
                    if (!Array.isArray(parsed[d])) parsed[d] = [];
                });
                return parsed;
            }
            // If it's an array (old format), migrate it into the new structure
            if (Array.isArray(parsed)) {
                const migrated = { easy: [], medium: [], hard: [], expert: [] };
                parsed.forEach(item => {
                    const diff = item && item.difficulty ? item.difficulty : 'easy';
                    if (!migrated[diff]) migrated[diff] = [];
                    migrated[diff].push(item);
                });
                // For safety, ensure top 5 per difficulty
                Object.keys(migrated).forEach(diff => {
                    migrated[diff].sort((a, b) => a.time - b.time);
                    migrated[diff] = migrated[diff].slice(0, 5);
                });
                // Persist migrated structure
                try {
                    localStorage.setItem('sudoku-scores', JSON.stringify(migrated));
                } catch (err) {
                    console.warn('Failed to persist migrated scores', err);
                }
                return migrated;
            }
            // otherwise return an empty object
            return {};
        } catch (err) {
            console.warn('Failed to parse stored scores', err);
            return {};
        }
    }

    // Return array of scores for a difficulty (sorted ascending)
    getScoresForDifficulty(difficulty) {
        const all = this._getAllScoresObject();
        return (all[difficulty] && Array.isArray(all[difficulty])) ? all[difficulty] : [];
    }

    // Display leaderboard as sections per difficulty (top 5 each)
    displayLeaderboard() {
        const difficulties = ['easy', 'medium', 'hard', 'expert'];
        const display = document.getElementById('leaderboard-display');
        if (!display) return;

        // Build HTML with sections per difficulty
        const sections = difficulties.map(diff => {
            const scores = this.getScoresForDifficulty(diff);
            const title = diff.charAt(0).toUpperCase() + diff.slice(1);
            if (scores.length === 0) {
                return `
                    <div class="leaderboard-difficulty">
                      <h3>${title}</h3>
                      <div class="leaderboard-empty">No scores yet for ${title}. Play a ${title} game to set a record!</div>
                    </div>
                `;
            }
            const items = scores.map((score, index) => `
                <div class="leaderboard-item">
                  <span>${index + 1}. <span class="difficulty">${score.difficulty}</span></span>
                  <span class="time">${this.formatTime(score.time)}</span>
                </div>
            `).join('');
            return `
                <div class="leaderboard-difficulty">
                  <h3>${title}</h3>
                  ${items}
                </div>
            `;
        }).join('');

        display.innerHTML = sections;
    }

    saveScoreLegacy(scoreObj) {
        // kept for backwards compatibility if some other code calls it.
        // This will add into the per-difficulty store.
        if (!scoreObj || !scoreObj.difficulty) return;
        const prevDiff = this.currentDifficulty;
        this.currentDifficulty = scoreObj.difficulty;
        this.elapsedTime = scoreObj.time;
        this.saveScore();
        this.currentDifficulty = prevDiff;
    }

    showCompletionMessage() {
        const messageEl = document.getElementById('game-message');
        const timeStr = this.formatTime(this.elapsedTime);
        messageEl.textContent = `🎉 Congratulations! You completed the puzzle in ${timeStr}!`;
        messageEl.className = 'message success';
    }

    showScreen(screenId) {
        // Hide all screens
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });
        
        // Show the requested screen
        const targetScreen = document.getElementById(screenId);
        if (targetScreen) {
            targetScreen.classList.add('active');
        } else {
            console.warn('[SudokuGame] screen not found:', screenId);
        }
    }

    /* rest of existing methods (startTimer, stopTimer, updateTimerDisplay, formatTime,
       getScores, displayLeaderboard etc.) have been preserved or replaced by the above.
       If you need the full file restitched differently, let me know. */
}

// Initialize the game when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const sudokuInstance = new SudokuGame();
    // Expose instance and a safe global start function as a fallback
    window.__sudoku = sudokuInstance;
    window.startGame = (difficulty) => {
        if (window.__sudoku && typeof window.__sudoku.startGame === 'function') {
            window.__sudoku.startGame(difficulty);
        } else {
            console.warn('Sudoku instance not ready — try again shortly.');
        }
    };
});
