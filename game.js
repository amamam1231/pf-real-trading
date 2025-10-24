document.addEventListener('DOMContentLoaded', () => {
    const dino = document.getElementById('dino');
    const cactus = document.getElementById('cactus');
    const scoreElement = document.getElementById('score');
    const startButton = document.getElementById('start-button');
    const restartButton = document.getElementById('restart-button');
    
    let isJumping = false;
    let isDucking = false;
    let isGameOver = true;
    let pnl = 0; // Starting PnL at $0
    let gameSpeed = 3000; // Initial speed in ms for cactus animation
    let obstacleInterval; // Variable to store interval ID
    
    // Database of candles
    let candlesDB = [];
    let currentCandleIndex = 0;
    
    // Load candles database
    async function loadCandlesDB() {
        try {
            const response = await fetch('candles_db.json');
            const data = await response.json();
            candlesDB = data.candles;
            console.log('Candles database loaded:', candlesDB.length, 'candles');
        } catch (error) {
            console.error('Error loading candles database:', error);
            // Fallback to default candles if database fails
            candlesDB = [
                { id: 1, height: 80, wickHeight: 20, isFlying: false },
                { id: 2, height: 60, wickHeight: 15, isFlying: false },
                { id: 3, height: 40, wickHeight: 12, isFlying: false },
                { id: 4, height: 30, wickHeight: 10, isFlying: false },
                { id: 5, height: 25, wickHeight: 8, isFlying: true }
            ];
        }
    }
    
    // Initialize candle obstacle - create static candle from database
    function createCandle() {
        if (candlesDB.length === 0) {
            console.error('Candles database not loaded');
            return;
        }
        
        // Get the next candle from the database
        const candle = candlesDB[currentCandleIndex];
        currentCandleIndex = (currentCandleIndex + 1) % candlesDB.length; // Cycle through database
        
        console.log('Creating candle:', candle.id, '- Height:', candle.height, 'Flying:', candle.isFlying);
        
        // Set candle properties - keep it simple
        cactus.style.height = candle.height + 'px';
        cactus.style.width = '20px';
        
        if (candle.isFlying) {
            // Flying candle - positioned higher, wick pointing down
            cactus.style.bottom = '150px';
            cactus.style.backgroundImage = `url('data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 20 ${candle.height}\" fill=\"%23ff0000\"><rect x=\"5\" y=\"0\" width=\"10\" height=\"${candle.height}\"/><rect x=\"9\" y=\"${candle.height}\" width=\"2\" height=\"${candle.wickHeight}\"/></svg>')`;
        } else {
            // Ground candle - normal position
            cactus.style.bottom = '0px';
            cactus.style.backgroundImage = `url('data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 20 ${candle.height}\" fill=\"%23ff0000\"><rect x=\"5\" y=\"0\" width=\"10\" height=\"${candle.height}\"/><rect x=\"9\" y=\"-${candle.wickHeight}\" width=\"2\" height=\"${candle.wickHeight}\"/></svg>')`;
        }
        
        // Store candle data
        cactus.setAttribute('data-candle-id', candle.id);
        cactus.setAttribute('data-candle-height', candle.height);
        cactus.setAttribute('data-candle-flying', candle.isFlying);
    }
    
    // Load database and create initial candle
    loadCandlesDB().then(() => {
        createCandle();
    });

    function jump() {
        if (isJumping || isDucking || isGameOver) return;
        
        isJumping = true;
        let jumpCount = 0;
        const jumpHeight = 150;
        const jumpInterval = setInterval(() => {
            // Jump up phase
            if (jumpCount < 25) {
                const progress = jumpCount / 25;
                const currentHeight = jumpHeight * progress;
                dino.style.bottom = currentHeight + 'px';
                dino.style.transition = 'none'; // Disable CSS transitions during jump
            } 
            // Fall down phase
            else if (jumpCount < 50) {
                const fallProgress = (jumpCount - 25) / 25;
                const currentHeight = jumpHeight * (1 - fallProgress);
                dino.style.bottom = currentHeight + 'px';
            } 
            // End jump
            else {
                clearInterval(jumpInterval);
                isJumping = false;
                dino.style.bottom = '0px';
                dino.style.transition = 'filter 0.3s ease, transform 0.3s ease'; // Re-enable transitions
            }
            jumpCount++;
        }, 15);
    }

    function duck() {
        if (isJumping || isDucking || isGameOver) return;
        
        isDucking = true;
        dino.style.height = '25px'; // Make Solana smaller when ducking
        dino.style.backgroundImage = "url('solanalow1.png')";
        dino.style.backgroundSize = 'contain';
        dino.style.backgroundRepeat = 'no-repeat';
        dino.style.backgroundPosition = 'center';
    }

    function stopDuck() {
        if (!isDucking || isGameOver) return;
        
        isDucking = false;
        dino.style.height = '50px'; // Restore normal size
        dino.style.backgroundImage = "url('solana.png')";
        dino.style.backgroundSize = 'contain';
        dino.style.backgroundRepeat = 'no-repeat';
        dino.style.backgroundPosition = 'center';
    }

    function startCactusMovement() {
        // Use simple CSS animation - no JavaScript movement
        cactus.style.animation = `cactusMove ${gameSpeed/1000}s infinite linear`;
        
        // Create obstacles with random intervals
        function createNextObstacle() {
            if (!isGameOver) {
                // Create NEW candle from database for each obstacle
                createCandle();
                // Reset cactus position for next obstacle
                cactus.style.right = '-20px';
                cactus.passed = false;
                
                // Schedule next obstacle with random delay
                const randomDelay = Math.random() * 2000 + 1500; // Random delay between 1.5-3.5 seconds
                obstacleInterval = setTimeout(createNextObstacle, randomDelay);
            }
        }
        
        // Start the first obstacle
        createNextObstacle();
    }


    function checkCollision() {
        if (isGameOver) return;
        
        const dinoRect = dino.getBoundingClientRect();
        const cactusRect = cactus.getBoundingClientRect();
        
        // Check for collision
        if (
            dinoRect.bottom >= cactusRect.top &&
            dinoRect.top <= cactusRect.bottom &&
            dinoRect.right >= cactusRect.left &&
            dinoRect.left <= cactusRect.right
        ) {
            gameOver();
        } else {
            // If cactus has passed the dino, increase SOL price by $1
            if (cactusRect.right < dinoRect.left && !cactus.passed) {
                cactus.passed = true;
                pnl += 10; // +$10 for successful jump
                updatePnLDisplay();
                showFloatingNumber('+10', 'positive');
                
                // Increase game speed every 5 successful jumps
                if (pnl % 50 === 0 && gameSpeed > 1500) {
                    gameSpeed -= 200;
                    cactus.style.animation = '';
                    setTimeout(() => {
                        cactus.style.animation = `cactusMove ${gameSpeed/1000}s infinite linear`;
                    }, 10);
                }
            }
            
            // Reset passed flag when cactus goes off screen and create new obstacle
            if (cactusRect.right < 0) {
                cactus.passed = false;
                // Reset cactus position for next obstacle
                cactus.style.right = '-20px';
            }
        }
    }
    
    function gameOver() {
        isGameOver = true;
        cactus.style.animation = 'none';
        
        // Clear any pending obstacle creation
        if (obstacleInterval) {
            clearTimeout(obstacleInterval);
        }
        
        // Decrease PnL by $10 for collision
        pnl -= 10;
        updatePnLDisplay();
        showFloatingNumber('-10', 'negative');
        
        // Add red border effect instead of changing background
        dino.style.border = '3px solid red';
        setTimeout(() => {
            dino.style.border = 'none';
        }, 200);
        
        restartButton.style.display = 'block';
        startButton.style.display = 'none';
    }
    
    function startGame() {
        if (!isGameOver) return;
        
        // Clear any existing intervals
        if (obstacleInterval) {
            clearTimeout(obstacleInterval);
        }
        
        // Hide any existing fun message
        const existingMessage = document.querySelector('.fun-message');
        if (existingMessage) {
            existingMessage.remove();
        }
        
        isGameOver = false;
        pnl = 0; // Reset PnL to $0
        gameSpeed = 3000;
        scoreElement.textContent = pnl;
        scoreElement.className = ''; // Reset classes
        updateWithdrawButton(); // Update button state
        dino.style.bottom = '0px';
        
        // Reset candle index to start from beginning
        currentCandleIndex = 0;
        
        // Ensure Solana logo is properly displayed
        dino.style.backgroundImage = "url('solana.png')";
        dino.style.backgroundSize = 'contain';
        dino.style.backgroundRepeat = 'no-repeat';
        dino.style.backgroundPosition = 'center';
        dino.style.border = 'none';
        dino.style.height = '50px'; // Ensure normal size
        isDucking = false; // Reset ducking state
        
        // Create initial candle (only once per game)
        createCandle();
        cactus.style.right = '-20px';
        cactus.passed = false;
        
        startButton.style.display = 'none';
        restartButton.style.display = 'none';
        
        startCactusMovement();
    }
    
    // Event Listeners
    document.addEventListener('keydown', (event) => {
        if (event.code === 'Space' || event.code === 'ArrowUp') {
            event.preventDefault();
            if (isGameOver) {
                startGame();
            } else {
                jump();
            }
        } else if (event.code === 'ArrowDown') {
            event.preventDefault();
            if (!isGameOver) {
                duck();
            }
        }
    });

    document.addEventListener('keyup', (event) => {
        if (event.code === 'ArrowDown') {
            event.preventDefault();
            if (!isGameOver) {
                stopDuck();
            }
        }
    });
    
    // Mobile/touch support
    document.addEventListener('touchstart', () => {
        if (isGameOver) {
            startGame();
        } else {
            jump();
        }
    });
    
    startButton.addEventListener('click', startGame);
    restartButton.addEventListener('click', startGame);
    
    // Withdraw button handler
    const withdrawBtn = document.getElementById('withdraw-btn');
    withdrawBtn.addEventListener('click', (event) => {
        if (withdrawBtn.disabled) {
            event.preventDefault();
            return;
        }
        showFunMessage('nigga fr?');
    });
    
    // Function to update PnL display with casino effects
    function updatePnLDisplay() {
        scoreElement.textContent = pnl;
        
        // Add casino-style glow effect
        if (pnl > 0) {
            scoreElement.className = 'pnl-positive';
        } else if (pnl < 0) {
            scoreElement.className = 'pnl-negative';
        } else {
            scoreElement.className = '';
        }
        
        // Update withdraw button state
        updateWithdrawButton();
        
        // Remove class after animation
        setTimeout(() => {
            scoreElement.className = '';
        }, 500);
    }
    
    // Function to update withdraw button state
    function updateWithdrawButton() {
        const withdrawBtn = document.getElementById('withdraw-btn');
        if (pnl === 0) {
            // Disabled when PnL is 0
            withdrawBtn.disabled = true;
            withdrawBtn.style.opacity = '0.5';
            withdrawBtn.style.cursor = 'not-allowed';
            withdrawBtn.classList.add('withdraw-zero');
        } else {
            // Normal when PnL is not 0
            withdrawBtn.disabled = false;
            withdrawBtn.style.opacity = '1';
            withdrawBtn.style.cursor = 'pointer';
            withdrawBtn.classList.remove('withdraw-zero');
        }
    }
    
    // Function to show floating numbers like in casino
    function showFloatingNumber(text, type) {
        const scoreContainer = document.querySelector('.score-container');
        const floatingDiv = document.createElement('div');
        floatingDiv.className = `floating-number ${type}`;
        floatingDiv.textContent = text;
        
        // Position randomly around the score
        const randomX = Math.random() * 200 - 100; // -100 to 100px
        floatingDiv.style.left = `calc(50% + ${randomX}px)`;
        floatingDiv.style.top = '50%';
        
        scoreContainer.appendChild(floatingDiv);
        
        // Remove after animation
        setTimeout(() => {
            if (floatingDiv.parentNode) {
                floatingDiv.remove();
            }
        }, 1500);
    }
    
    // Function to show fun message on screen
    function showFunMessage(text) {
        // Remove existing message if any
        const existingMessage = document.querySelector('.fun-message');
        if (existingMessage) {
            existingMessage.remove();
        }
        
        // Create new message element
        const messageDiv = document.createElement('div');
        messageDiv.className = 'fun-message';
        
        // Add cat gif
        const catGif = document.createElement('img');
        catGif.src = 'cat-point.gif';
        catGif.className = 'cat-gif';
        catGif.alt = 'Cat pointing';
        
        // Add text
        const messageText = document.createElement('div');
        messageText.textContent = text;
        
        // Add elements to message
        messageDiv.appendChild(catGif);
        messageDiv.appendChild(messageText);
        
        // Add to page
        document.body.appendChild(messageDiv);
        
        // Auto remove after 6 seconds
        setTimeout(() => {
            if (messageDiv.parentNode) {
                messageDiv.style.animation = 'messageBounce 0.3s ease-in reverse';
                setTimeout(() => {
                    if (messageDiv.parentNode) {
                        messageDiv.remove();
                    }
                }, 300);
            }
        }, 6000);
    }
    
    // Initialize withdraw button state on load
    updateWithdrawButton();
    
    
    // Game loop
    setInterval(checkCollision, 10);
});


// Function to copy contract address
function copyContract() {
    const contractAddress = 'GGQqRJPUfzJY9TsSZVTjgdF8YLWXfpuoZ1fDeMWtpump';
    
    // Copy to clipboard
    navigator.clipboard.writeText(contractAddress).then(() => {
        // Show feedback
        const addressElement = document.getElementById('contract-address');
        const originalText = addressElement.textContent;
        addressElement.textContent = 'Copied!';
        addressElement.style.color = '#00ff00';
        addressElement.style.background = 'rgba(0, 255, 0, 0.2)';
        
        // Reset after 2 seconds
        setTimeout(() => {
            addressElement.textContent = originalText;
            addressElement.style.color = '#00ff00';
            addressElement.style.background = 'rgba(0, 0, 0, 0.8)';
        }, 2000);
    }).catch(err => {
        console.error('Failed to copy: ', err);
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = contractAddress;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
    });
}

// Add CSS animation for cactus
const style = document.createElement('style');
style.textContent = `
@keyframes cactusMove {
    from {
        right: -20px;
    }
    to {
        right: 100%;
    }
}`;
document.head.appendChild(style);
