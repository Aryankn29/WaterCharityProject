// Game State
let gameState = {
    score: 0,
    timeLeft: 30,
    lives: 3,
    goalPoints: 100,
    isRunning: false,
    isPaused: false,
    spawnIntervalId: null,
    timerIntervalId: null,
    animationFrameId: null,
    items: [],
    lastSpawnTime: 0,
    itemIdCounter: 0
};

// DOM Elements
const startScreen = document.getElementById('startScreen');
const gameScreen = document.getElementById('gameScreen');
const gameOverModal = document.getElementById('gameOverModal');
const startBtn = document.getElementById('startBtn');
const howToBtn = document.getElementById('howToBtn');
const pauseBtn = document.getElementById('pauseBtn');
const restartBtn = document.getElementById('restartBtn');
const playAgainBtn = document.getElementById('playAgainBtn');
const exitBtn = document.getElementById('exitBtn');
const gameArea = document.getElementById('gameArea');
const scoreValue = document.getElementById('scoreValue');
const timeValue = document.getElementById('timeValue');
const progressFill = document.getElementById('progressFill');
const finalScore = document.getElementById('finalScore');
const impactMessage = document.getElementById('impactMessage');
const modalTitle = document.getElementById('modalTitle');
const modalIcon = document.getElementById('modalIcon');
const scoreMessage = document.getElementById('scoreMessage');
const hearts = document.querySelectorAll('.heart');

// Initialize
function init() {
    startBtn.addEventListener('click', startGame);
    if (howToBtn) {
        howToBtn.addEventListener('click', () => {
            alert('How to Play:\n\n• Tap blue water drops to collect them (+10 points)\n• Tap yellow jerry cans for bonus points (+25 points)\n• Avoid polluted drops (☠️) or you\'ll lose points and lives\n• Reach 100 points in 30 seconds to win!\n• You have 3 lives - miss clean drops or hit polluted ones to lose them');
        });
    }
    pauseBtn.addEventListener('click', togglePause);
    restartBtn.addEventListener('click', restartGame);
    playAgainBtn.addEventListener('click', playAgain);
    exitBtn.addEventListener('click', exitToMenu);
}

// Start Game
function startGame() {
    // Hide start screen, show game screen
    startScreen.classList.add('hidden');
    gameScreen.classList.remove('hidden');
    gameOverModal.classList.add('hidden');

    // Reset state
    resetGameState();

    // Start game loop
    gameState.isRunning = true;
    gameState.isPaused = false;

    // Start timer
    startTimer();

    // Start spawner (slower spawn rate)
    startSpawner();

    // Start animation loop
    startAnimationLoop();

    // Update UI
    updateHUD();
    updateLives();
}

// Reset Game State
function resetGameState() {
    gameState.score = 0;
    gameState.timeLeft = 30;
    gameState.lives = 3;
    gameState.isRunning = true;
    gameState.isPaused = false;
    gameState.items = [];
    gameState.itemIdCounter = 0;
    gameState.lastSpawnTime = 0;

    // Clear all items from game area
    const existingItems = gameArea.querySelectorAll('.item');
    existingItems.forEach(item => item.remove());
}

// Start Timer
function startTimer() {
    if (gameState.timerIntervalId) {
        clearInterval(gameState.timerIntervalId);
    }

    gameState.timerIntervalId = setInterval(() => {
        if (!gameState.isPaused && gameState.isRunning) {
            gameState.timeLeft--;
            updateHUD();

            if (gameState.timeLeft <= 0) {
                endGame();
            }
        }
    }, 1000);
}

// Start Spawner
function startSpawner() {
    if (gameState.spawnIntervalId) {
        clearInterval(gameState.spawnIntervalId);
    }

    gameState.spawnIntervalId = setInterval(() => {
        if (!gameState.isPaused && gameState.isRunning) {
            spawnItem();
        }
    }, 1000 + Math.random() * 500); // 1000-1500ms (slower spawn)
}

// Spawn Item
function spawnItem() {
    const random = Math.random();
    let type;

    if (random < 0.05) {
        type = 'bonus'; // 5% bonus
    } else if (random < 0.30) {
        type = 'polluted'; // 25% polluted
    } else {
        type = 'clean'; // 70% clean
    }

    const item = {
        id: gameState.itemIdCounter++,
        type: type,
        x: Math.random() * 85, // 0-85% to keep within bounds
        y: -5,
        speed: 0.3 + Math.random() * 0.3, // Random speed between 0.3-0.6 (much slower)
        element: null
    };

    // Create DOM element
    const itemElement = document.createElement('div');
    itemElement.className = `item ${type}`;
    itemElement.style.left = `${item.x}%`;
    itemElement.style.top = `${item.y}%`;
    itemElement.style.transform = 'translate(-50%, -50%)';
    itemElement.style.pointerEvents = 'auto';
    itemElement.setAttribute('data-type', type);
    itemElement.setAttribute('data-id', item.id);

    // Add visual content based on type
    if (type === 'clean') {
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('viewBox', '0 0 24 24');
        svg.setAttribute('fill', 'none');
        svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('d', 'M12 2.69l5.66 5.66a8 8 0 1 1-11.32 0L12 2.69z');
        path.setAttribute('fill', 'white');
        svg.appendChild(path);
        itemElement.appendChild(svg);
    } else if (type === 'polluted') {
        itemElement.textContent = '☠️';
    } else if (type === 'bonus') {
        itemElement.textContent = '🚰';
    }

    // Add click and touch handlers
    const handleInteraction = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!item.element.classList.contains('splash')) {
            handleItemClick(item);
        }
    };
    
    itemElement.addEventListener('click', handleInteraction);
    itemElement.addEventListener('touchend', handleInteraction);

    // Add to game area
    gameArea.appendChild(itemElement);
    item.element = itemElement;

    // Add to items array
    gameState.items.push(item);
}

// Handle Item Click
function handleItemClick(item) {
    if (!gameState.isRunning || gameState.isPaused) return;
    if (!item.element || item.element.classList.contains('splash')) return;

    // Prevent double-clicks
    item.element.style.pointerEvents = 'none';

    // Add splash animation
    item.element.classList.add('splash');

    // Handle scoring based on type
    if (item.type === 'clean') {
        gameState.score += 10;
    } else if (item.type === 'bonus') {
        gameState.score += 25;
    } else if (item.type === 'polluted') {
        gameState.score = Math.max(0, gameState.score - 15);
        gameState.lives = Math.max(0, gameState.lives - 1);
        updateLives();

        if (gameState.lives === 0) {
            endGame();
            return;
        }
    }

    // Remove item after animation
    setTimeout(() => {
        removeItem(item.id);
    }, 300);

    // Update HUD
    updateHUD();
}

// Remove Item
function removeItem(itemId) {
    const index = gameState.items.findIndex(item => item.id === itemId);
    if (index !== -1) {
        const item = gameState.items[index];
        if (item.element && item.element.parentNode) {
            item.element.remove();
        }
        gameState.items.splice(index, 1);
    }
}

// Start Animation Loop
function startAnimationLoop() {
    function animate() {
        if (!gameState.isPaused && gameState.isRunning) {
            const now = Date.now();

            // Update all items
            gameState.items.forEach(item => {
                if (item.element) {
                    item.y += item.speed;
                    item.element.style.top = `${item.y}%`;
                    item.element.style.transform = 'translate(-50%, -50%)';

                    // Check if item reached bottom
                    if (item.y > 110) {
                        // Handle missed items
                        if (item.type === 'clean' || item.type === 'bonus') {
                            // Optional: lose a life for missing clean drops
                            gameState.lives = Math.max(0, gameState.lives - 1);
                            updateLives();

                            if (gameState.lives === 0) {
                                endGame();
                                return;
                            }
                        }
                        removeItem(item.id);
                    }
                }
            });
        }

        if (gameState.isRunning) {
            gameState.animationFrameId = requestAnimationFrame(animate);
        }
    }

    gameState.animationFrameId = requestAnimationFrame(animate);
}

// Update HUD
function updateHUD() {
    scoreValue.textContent = gameState.score;
    timeValue.textContent = gameState.timeLeft;

    // Update progress bar
    const progress = Math.min(100, (gameState.score / gameState.goalPoints) * 100);
    progressFill.style.width = `${progress}%`;
}

// Update Lives
function updateLives() {
    hearts.forEach((heart, index) => {
        if (index < gameState.lives) {
            heart.classList.remove('lost');
        } else {
            heart.classList.add('lost');
        }
    });
}

// Toggle Pause
function togglePause() {
    if (!gameState.isRunning) return;

    gameState.isPaused = !gameState.isPaused;
    pauseBtn.textContent = gameState.isPaused ? 'Resume' : 'Pause';
}

// Restart Game
function restartGame() {
    // Stop all intervals
    stopGame();

    // Reset and start again
    startGame();
}

// Stop Game
function stopGame() {
    gameState.isRunning = false;
    gameState.isPaused = false;

    if (gameState.spawnIntervalId) {
        clearInterval(gameState.spawnIntervalId);
        gameState.spawnIntervalId = null;
    }

    if (gameState.timerIntervalId) {
        clearInterval(gameState.timerIntervalId);
        gameState.timerIntervalId = null;
    }

    if (gameState.animationFrameId) {
        cancelAnimationFrame(gameState.animationFrameId);
        gameState.animationFrameId = null;
    }

    // Clear all items
    gameState.items.forEach(item => {
        if (item.element && item.element.parentNode) {
            item.element.remove();
        }
    });
    gameState.items = [];
}

// End Game
function endGame() {
    stopGame();

    // Show game over modal
    gameOverModal.classList.remove('hidden');

    // Update modal content
    const didWin = gameState.score >= gameState.goalPoints;
    finalScore.textContent = gameState.score;

    if (didWin) {
        modalTitle.textContent = "Well Funded!";
        modalIcon.classList.add('win');
        modalIcon.querySelector('.icon-emoji').textContent = '🎉';
        impactMessage.innerHTML = '<strong>Amazing!</strong> In real life, clean water changes everything.';
        scoreMessage.textContent = 'You helped fund clean water awareness! 💧';
    } else {
        modalTitle.textContent = "Time's Up!";
        modalIcon.classList.remove('win');
        modalIcon.querySelector('.icon-emoji').textContent = '⏰';
        impactMessage.innerHTML = '<strong>Great effort!</strong> Every drop counts toward clean water access.';
        const dropsCollected = Math.floor(gameState.score / 10);
        scoreMessage.textContent = `You collected ${dropsCollected} clean drops!`;
    }
}

// Play Again
function playAgain() {
    gameOverModal.classList.add('hidden');
    startGame();
}

// Exit to Menu
function exitToMenu() {
    stopGame();
    gameOverModal.classList.add('hidden');
    gameScreen.classList.add('hidden');
    startScreen.classList.remove('hidden');
    pauseBtn.textContent = 'Pause';
}

// Initialize on load
document.addEventListener('DOMContentLoaded', init);
