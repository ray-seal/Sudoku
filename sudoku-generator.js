// Sudoku Generator with difficulty levels
class SudokuGenerator {
    constructor() {
        this.board = Array(9).fill(null).map(() => Array(9).fill(0));
        this.solution = null;
    }

    // Generate a complete valid Sudoku board
    generateComplete() {
        this.board = Array(9).fill(null).map(() => Array(9).fill(0));
        this.fillBoard();
        this.solution = this.board.map(row => [...row]);
        return this.solution;
    }

    // Fill the board with valid numbers
    fillBoard() {
        const numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9];
        
        for (let row = 0; row < 9; row++) {
            for (let col = 0; col < 9; col++) {
                if (this.board[row][col] === 0) {
                    // Shuffle numbers for randomness
                    this.shuffleArray(numbers);
                    
                    for (let num of numbers) {
                        if (this.isValid(row, col, num)) {
                            this.board[row][col] = num;
                            
                            if (this.fillBoard()) {
                                return true;
                            }
                            
                            this.board[row][col] = 0;
                        }
                    }
                    return false;
                }
            }
        }
        return true;
    }

    // Check if placing a number is valid
    isValid(row, col, num) {
        // Check row
        for (let x = 0; x < 9; x++) {
            if (this.board[row][x] === num) return false;
        }

        // Check column
        for (let x = 0; x < 9; x++) {
            if (this.board[x][col] === num) return false;
        }

        // Check 3x3 box
        const boxRow = Math.floor(row / 3) * 3;
        const boxCol = Math.floor(col / 3) * 3;
        for (let i = 0; i < 3; i++) {
            for (let j = 0; j < 3; j++) {
                if (this.board[boxRow + i][boxCol + j] === num) return false;
            }
        }

        return true;
    }

    // Create a puzzle by removing numbers based on difficulty
    createPuzzle(difficulty) {
        this.generateComplete();
        const puzzle = this.solution.map(row => [...row]);
        
        // Define how many cells to remove based on difficulty
        const cellsToRemove = {
            easy: 35,      // ~38% removed
            medium: 45,    // ~49% removed
            hard: 52,      // ~58% removed
            expert: 58     // ~64% removed
        };

        const toRemove = cellsToRemove[difficulty] || 35;
        let removed = 0;
        const attempts = 0;
        const maxAttempts = 1000;

        while (removed < toRemove && attempts < maxAttempts) {
            const row = Math.floor(Math.random() * 9);
            const col = Math.floor(Math.random() * 9);

            if (puzzle[row][col] !== 0) {
                puzzle[row][col] = 0;
                removed++;
            }
        }

        return {
            puzzle: puzzle,
            solution: this.solution
        };
    }

    // Shuffle array helper
    shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }

    // Verify if a board is valid
    static isValidBoard(board) {
        for (let i = 0; i < 9; i++) {
            for (let j = 0; j < 9; j++) {
                if (board[i][j] !== 0) {
                    const num = board[i][j];
                    board[i][j] = 0;
                    
                    if (!this.canPlace(board, i, j, num)) {
                        board[i][j] = num;
                        return false;
                    }
                    
                    board[i][j] = num;
                }
            }
        }
        return true;
    }

    // Check if number can be placed at position
    static canPlace(board, row, col, num) {
        // Check row
        for (let x = 0; x < 9; x++) {
            if (board[row][x] === num) return false;
        }

        // Check column
        for (let x = 0; x < 9; x++) {
            if (board[x][col] === num) return false;
        }

        // Check 3x3 box
        const boxRow = Math.floor(row / 3) * 3;
        const boxCol = Math.floor(col / 3) * 3;
        for (let i = 0; i < 3; i++) {
            for (let j = 0; j < 3; j++) {
                if (board[boxRow + i][boxCol + j] === num) return false;
            }
        }

        return true;
    }
}
