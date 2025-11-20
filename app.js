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
        
        // Setup start screen with event delegation
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
            document.querySelectorAll('.difficulty-btn').forEach(btn => {
                btn.type = 'button';
                btn.addEventListener('click', () => {
                    const difficulty = btn.dataset.difficulty;
                    console.log('[SudokuGame] difficulty clicked (direct):', difficulty);
                    this.startGame(difficulty);
                });
            });
        }

        // Setup back button with guard
        const backBtn = document.getElementById('back-btn');
        if (backBtn) {
            backBtn.addEventListener('click', () => {
                this.stopTimer();
                this.showScreen('start-screen');
            });
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

        // Load and display leaderboard
        this.displayLeaderboard();
    }

    startGame(difficulty) {
        console.log('[SudokuGame] startGame called with difficulty:', difficulty);
        this.currentDifficulty = difficulty;
        
        // Generate puzzle
        const { puzzle, solution } = this.generator.createPuzzle(difficulty);
        this.currentPuzzle = puzzle;
        this.currentSolution = solution;
        this.userBoard = puzzle.map(row => [...row]);
        
        // Setup UI
        this.showScreen('game-screen');
        document.getElementById('difficulty-display').textContent = difficulty.charAt(0).toUpperCase() + difficulty.slice(1);
        this.renderBoard();
        this.startTimer();
        
        // Clear message
        const messageEl = document.getElementById('game-message');
        messageEl.textContent = '';
        messageEl.className = 'message';
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
        cellEl.classList.add('selected');
    }

    handleNumberInput(num) {
        if (!this.selectedCell) return;

        const { row, col } = this.selectedCell;
        
        // Update user board
        this.userBoard[row][col] = num;

        // Update cell display
        const cellEl = document.querySelector(`.cell[data-row="${row}"][data-col="${col}"]`);
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

    saveScore() {
        const scores = this.getScores();
        scores.push({
            difficulty: this.currentDifficulty,
            time: this.elapsedTime,
            date: new Date().toISOString()
        });

        // Sort by time (ascending) and keep top 10
        scores.sort((a, b) => a.time - b.time);
        const topScores = scores.slice(0, 10);

        localStorage.setItem('sudoku-scores', JSON.stringify(topScores));
        this.displayLeaderboard();
    }

    getScores() {
        const stored = localStorage.getItem('sudoku-scores');
        return stored ? JSON.parse(stored) : [];
    }

    displayLeaderboard() {
        const scores = this.getScores();
        const display = document.getElementById('leaderboard-display');

        if (scores.length === 0) {
            display.innerHTML = '<div class="leaderboard-empty">No scores yet. Play a game to set a record!</div>';
            return;
        }

        display.innerHTML = scores.map((score, index) => `
            <div class="leaderboard-item">
                <span>${index + 1}. <span class="difficulty">${score.difficulty}</span></span>
                <span class="time">${this.formatTime(score.time)}</span>
            </div>
        `).join('');
    }

    showScreen(screenId) {
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });
        document.getElementById(screenId).classList.add('active');
    }
}

// Initialize the game when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new SudokuGame();
});
