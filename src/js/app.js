// Player data management
let players = [];
let currentId = 0;
let currentRound = 1;
const TOTAL_ROUNDS = 5;
const MIN_PLAYERS = 4;
const MAX_PLAYERS = 6;

// Winner celebration quotes
const celebrationQuotes = [
    "You're the master strategist!",
    "Luck is on your side!",
    "The cards have spoken - you're the champion!",
    "Victory belongs to the patient!",
    "Your card skills are unmatched!",
    "A well-deserved win for a tactical genius!",
    "The stars aligned for your victory!",
    "You've outplayed everyone at the table!",
    "A legendary performance!",
    "Your opponents never stood a chance!"
];

// DOM Elements - Pages
const introPage = document.getElementById('intro-page');
const addPlayersPage = document.getElementById('add-players-page');
const gamePage = document.getElementById('game-page');

// DOM Elements - Intro Page
const startGameBtn = document.getElementById('start-game-btn');

// DOM Elements - Add Players Page
const playersListEl = document.getElementById('players-list');
const playerNameInput = document.getElementById('player-name-input');
const addPlayerToListBtn = document.getElementById('add-player-to-list-btn');
const backToIntroBtn = document.getElementById('back-to-intro-btn');
const goToGameBtn = document.getElementById('go-to-game-btn');
const playerCountMessage = document.getElementById('player-count-message');

// DOM Elements - Game Page
const scoreboardEl = document.getElementById('scoreboard');
const playerSelectEl = document.getElementById('player-select');
const scoreInputEl = document.getElementById('score-input');
const addScoreBtn = document.getElementById('add-score-btn');
const backToPlayersBtn = document.getElementById('back-to-players-btn');
const resetBtn = document.getElementById('reset-btn');
const roundIndicator = document.getElementById('round-indicator');
const endRoundBtn = document.getElementById('end-round-btn');

// Page Navigation
const navigateToPage = (fromPage, toPage) => {
    // First, fade out the current page
    fromPage.classList.remove('active');
    
    // After a short delay, show the new page with a fade-in animation
    setTimeout(() => {
        toPage.classList.add('active');
        
        // Add fade-in animation to elements inside the page
        const elementsToAnimate = toPage.querySelectorAll('.title, .subtitle, .tagline, .neon-button, .input-group, .players-list, .scoreboard, .round-indicator');
        elementsToAnimate.forEach((el, index) => {
            el.classList.remove('fade-in');
            void el.offsetWidth; // Trigger reflow
            el.style.animationDelay = `${index * 0.1}s`;
            el.classList.add('fade-in');
        });
        
        // If navigating to game page, update the scoreboard and round indicator
        if (toPage === gamePage) {
            renderScoreboard();
            updatePlayerSelect();
            updateRoundIndicator();
        }
        
        // If navigating to add players page, render the players list
        if (toPage === addPlayersPage) {
            renderPlayersList();
        }
    }, 500);
};

// Initialize Three.js background
const initBackgroundEffects = () => {
    const canvas = document.getElementById('background-canvas');
    const renderer = new THREE.WebGLRenderer({
        canvas,
        antialias: true,
        alpha: true
    });
    
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    
    const scene = new THREE.Scene();
    
    // Camera setup
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 30;
    scene.add(camera);
    
    // Lighting
    const ambientLight = new THREE.AmbientLight(0x333333);
    scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0x00ffff, 0.5);
    directionalLight.position.set(0, 10, 10);
    scene.add(directionalLight);
    
    // Create particles
    const particlesGeometry = new THREE.BufferGeometry();
    const particlesCount = 1000;
    
    const posArray = new Float32Array(particlesCount * 3);
    const scaleArray = new Float32Array(particlesCount);
    
    for (let i = 0; i < particlesCount * 3; i += 3) {
        // Position
        posArray[i] = (Math.random() - 0.5) * 100;
        posArray[i + 1] = (Math.random() - 0.5) * 100;
        posArray[i + 2] = (Math.random() - 0.5) * 100;
        
        // Scale
        scaleArray[i / 3] = Math.random();
    }
    
    particlesGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
    particlesGeometry.setAttribute('scale', new THREE.BufferAttribute(scaleArray, 1));
    
    // Material
    const particlesMaterial = new THREE.PointsMaterial({
        size: 0.2,
        color: 0x00ffff,
        transparent: true,
        opacity: 0.8,
        blending: THREE.AdditiveBlending
    });
    
    // Mesh
    const particlesMesh = new THREE.Points(particlesGeometry, particlesMaterial);
    scene.add(particlesMesh);
    
    // Animation
    const clock = new THREE.Clock();
    
    const animate = () => {
        const elapsedTime = clock.getElapsedTime();
        
        // Rotate particles
        particlesMesh.rotation.x = elapsedTime * 0.05;
        particlesMesh.rotation.y = elapsedTime * 0.03;
        
        // Render
        renderer.render(scene, camera);
        
        // Call animate again on the next frame
        window.requestAnimationFrame(animate);
    };
    
    animate();
    
    // Handle window resize
    window.addEventListener('resize', () => {
        // Update camera
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        
        // Update renderer
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    });
};

// Player Management Functions
const addPlayerToList = (name) => {
    if (!name.trim()) return;
    
    // Check if we've reached the maximum number of players
    if (players.length >= MAX_PLAYERS) {
        showNotification(`Maximum ${MAX_PLAYERS} players allowed!`, 'error');
        return;
    }
    
    const newPlayer = {
        id: currentId++,
        name: name.trim(),
        scores: Array(TOTAL_ROUNDS).fill(null),
        roundScores: [],
        total: 0
    };
    
    players.push(newPlayer);
    renderPlayersList();
    
    // Clear input
    playerNameInput.value = '';
    
    // Add animation effect
    const playerItem = document.querySelector(`.player-item[data-id="${newPlayer.id}"]`);
    if (playerItem) {
        gsap.fromTo(playerItem, 
            { opacity: 0, x: -20 }, 
            { opacity: 1, x: 0, duration: 0.5, ease: "back.out(1.7)" }
        );
    }
};

const removePlayerFromList = (id) => {
    players = players.filter(player => player.id !== id);
    renderPlayersList();
};

const renderPlayersList = () => {
    playersListEl.innerHTML = '';
    
    if (players.length === 0) {
        playersListEl.innerHTML = `
            <div class="empty-state">
                <p>No players added yet. Add players to start the game.</p>
            </div>
        `;
    } else {
        players.forEach(player => {
            const playerItem = document.createElement('div');
            playerItem.className = 'player-item';
            playerItem.dataset.id = player.id;
            
            playerItem.innerHTML = `
                <span class="player-item-name">${player.name}</span>
                <button class="remove-player-btn" data-id="${player.id}">×</button>
            `;
            
            playersListEl.appendChild(playerItem);
            
            // Add remove event listener
            const removeBtn = playerItem.querySelector('.remove-player-btn');
            removeBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                removePlayerFromList(player.id);
            });
        });
    }
    
    // Update player count message
    updatePlayerCountMessage();
    
    // Enable/disable go to game button based on player count
    const hasEnoughPlayers = players.length >= MIN_PLAYERS && players.length <= MAX_PLAYERS;
    goToGameBtn.disabled = !hasEnoughPlayers;
    
    if (hasEnoughPlayers) {
        goToGameBtn.classList.remove('disabled');
    } else {
        goToGameBtn.classList.add('disabled');
    }
};

const updatePlayerCountMessage = () => {
    if (!playerCountMessage) return;
    
    const count = players.length;
    let message = '';
    let className = '';
    
    if (count < MIN_PLAYERS) {
        message = `Add ${MIN_PLAYERS - count} more player${MIN_PLAYERS - count !== 1 ? 's' : ''} to start the game.`;
        className = 'warning';
    } else if (count > MAX_PLAYERS) {
        message = `Maximum ${MAX_PLAYERS} players allowed. Please remove ${count - MAX_PLAYERS}.`;
        className = 'error';
    } else {
        message = `${count} players added. Ready to start!`;
        className = 'success';
    }
    
    playerCountMessage.textContent = message;
    playerCountMessage.className = `player-count-message ${className}`;
};

const addScore = (playerId, score) => {
    const scoreNum = parseInt(score);
    if (isNaN(scoreNum)) return;
    
    const playerIndex = players.findIndex(p => p.id === playerId);
    if (playerIndex === -1) return;
    
    // Add score for the current round
    players[playerIndex].scores[currentRound - 1] = scoreNum;
    players[playerIndex].roundScores.push(scoreNum);
    players[playerIndex].total += scoreNum;
    
    renderScoreboard();
    
    // Clear inputs
    scoreInputEl.value = '';
    playerSelectEl.value = '';
    
    // Update player select dropdown to remove the player who just scored
    updatePlayerSelect();
    
    // Add animation effect
    const playerCard = document.querySelector(`.player-card[data-id="${playerId}"]`);
    if (playerCard) {
        const scoreEl = playerCard.querySelector('.player-score');
        scoreEl.classList.add('score-update');
        
        gsap.fromTo(scoreEl, 
            { scale: 1.2, color: '#ffff00' }, 
            { scale: 1, color: '#ffffff', duration: 0.5, ease: "elastic.out(1, 0.3)" }
        );
        
        setTimeout(() => {
            scoreEl.classList.remove('score-update');
        }, 500);
    }
    
    // Check if all players have scores for the current round
    checkAllPlayersScored();
};

const checkAllPlayersScored = () => {
    const allScored = players.every(player => player.scores[currentRound - 1] !== null);
    
    if (endRoundBtn) {
        endRoundBtn.disabled = !allScored;
        if (allScored) {
            endRoundBtn.classList.remove('disabled');
            // Add a pulsing animation to draw attention
            gsap.to(endRoundBtn, {
                boxShadow: '0 0 20px var(--accent-glow)',
                repeat: 3,
                yoyo: true,
                duration: 0.5
            });
            
            // Show notification that all players have scored
            showNotification('All players have scored! You can now end the round.', 'success');
        } else {
            endRoundBtn.classList.add('disabled');
        }
    }
};

const endRound = () => {
    // Check if all players have scores for the current round
    const allScored = players.every(player => player.scores[currentRound - 1] !== null);
    
    if (!allScored) {
        showNotification('All players must have scores for this round!', 'error');
        return;
    }
    
    // Create and show round completion modal
    const roundModal = document.createElement('div');
    roundModal.className = 'winner-modal'; // Reusing winner-modal class for styling
    
    roundModal.innerHTML = `
        <div class="winner-modal-content">
            <h2 class="winner-title">Round ${currentRound} Complete!</h2>
            <div class="round-summary">
                ${players.map(player => `
                    <div class="round-player-score">
                        <span class="round-player-name">${player.name}</span>
                        <span class="round-player-points">${player.scores[currentRound - 1]} points</span>
                    </div>
                `).join('')}
            </div>
            <button id="continue-btn" class="neon-button accent">Continue to ${currentRound === TOTAL_ROUNDS ? 'Final Results' : `Round ${currentRound + 1}`}</button>
        </div>
    `;
    
    document.body.appendChild(roundModal);
    
    // Add animations
    gsap.fromTo(roundModal, 
        { opacity: 0 }, 
        { opacity: 1, duration: 0.5 }
    );
    
    gsap.fromTo(roundModal.querySelector('.winner-modal-content'), 
        { scale: 0.8, y: 50 }, 
        { scale: 1, y: 0, duration: 0.5, ease: "back.out(1.7)" }
    );
    
    // Add event listener for continue button
    roundModal.querySelector('#continue-btn').addEventListener('click', () => {
        gsap.to(roundModal, {
            opacity: 0,
            duration: 0.3,
            onComplete: () => {
                roundModal.remove();
                
                // If this was the final round, show the winner
                if (currentRound === TOTAL_ROUNDS) {
                    showWinner();
                } else {
                    // Increment round
                    currentRound++;
                    
                    // Update UI
                    updateRoundIndicator();
                    renderScoreboard();
                    updatePlayerSelect();
                    
                    // Show notification for new round
                    showNotification(`Round ${currentRound} started!`, 'success');
                    
                    // Disable end round button until all players have scores
                    if (endRoundBtn) {
                        endRoundBtn.disabled = true;
                        endRoundBtn.classList.add('disabled');
                    }
                }
            }
        });
    });
};

const updateRoundIndicator = () => {
    if (roundIndicator) {
        roundIndicator.textContent = `Round ${currentRound} of ${TOTAL_ROUNDS}`;
        
        // Add animation
        gsap.fromTo(roundIndicator, 
            { scale: 1.2, color: '#ffff00' }, 
            { scale: 1, color: '#ffffff', duration: 0.5 }
        );

        // Update end round button text for final round
        if (endRoundBtn) {
            endRoundBtn.textContent = currentRound === TOTAL_ROUNDS ? 'End Game' : 'End Round';
            if (currentRound === TOTAL_ROUNDS) {
                endRoundBtn.classList.add('final-round');
            } else {
                endRoundBtn.classList.remove('final-round');
            }
        }
    }
};

const showWinner = () => {
    // Find player with lowest score
    let lowestScore = Infinity;
    let winner = null;
    
    players.forEach(player => {
        if (player.total < lowestScore) {
            lowestScore = player.total;
            winner = player;
        }
    });
    
    if (!winner) return;
    
    // Get random celebration quote
    const quote = celebrationQuotes[Math.floor(Math.random() * celebrationQuotes.length)];
    
    // Create winner modal with enhanced design
    const modal = document.createElement('div');
    modal.className = 'winner-modal';
    
    modal.innerHTML = `
        <div class="winner-modal-content">
            <div class="winner-header">
                <div class="winner-crown-left">👑</div>
                <h2 class="winner-title">Champion!</h2>
                <div class="winner-crown-right">👑</div>
            </div>
            <div class="winner-trophy-container">
                <div class="winner-trophy">🏆</div>
                <div class="winner-sparkles">✨</div>
            </div>
            <div class="winner-info">
                <h3 class="winner-name">${winner.name}</h3>
                <div class="winner-score-container">
                    <span class="winner-score-label">Final Score</span>
                    <span class="winner-score">${winner.total}</span>
                </div>
                <p class="winner-quote">"${quote}"</p>
            </div>
            <div class="winner-stats">
                <div class="stat-item">
                    <span class="stat-label">Best Round</span>
                    <span class="stat-value">${Math.min(...winner.scores.filter(score => score !== null))}</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">Average</span>
                    <span class="stat-value">${Math.round(winner.total / TOTAL_ROUNDS)}</span>
                </div>
            </div>
            <div class="winner-buttons">
                <button id="view-scores-btn" class="neon-button accent">View Final Scores</button>
                <button id="new-game-btn" class="neon-button">New Game</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Enhanced animations
    gsap.fromTo(modal, 
        { opacity: 0 }, 
        { opacity: 1, duration: 0.5 }
    );
    
    const content = modal.querySelector('.winner-modal-content');
    gsap.fromTo(content, 
        { scale: 0.8, y: 50 }, 
        { scale: 1, y: 0, duration: 0.8, ease: "elastic.out(1, 0.75)" }
    );
    
    // Animate trophy and crowns
    gsap.fromTo('.winner-trophy', 
        { scale: 0, rotation: -180 }, 
        { scale: 1, rotation: 0, duration: 1, ease: "back.out(1.7)", delay: 0.3 }
    );
    
    gsap.fromTo(['.winner-crown-left', '.winner-crown-right'], 
        { scale: 0, opacity: 0 }, 
        { scale: 1, opacity: 1, duration: 0.5, stagger: 0.2, delay: 0.5 }
    );
    
    // Add sparkle animations
    const sparkles = modal.querySelector('.winner-sparkles');
    gsap.to(sparkles, {
        opacity: 0.8,
        scale: 1.2,
        duration: 1,
        repeat: -1,
        yoyo: true
    });
    
    // Add confetti effect
    createConfetti();
    
    // Add event listeners
    modal.querySelector('#new-game-btn').addEventListener('click', () => {
        gsap.to(modal, {
            opacity: 0,
            duration: 0.3,
            onComplete: () => {
                resetGame();
                modal.remove();
            }
        });
    });
    
    modal.querySelector('#view-scores-btn').addEventListener('click', () => {
        showFinalScores(modal);
    });
};

const showFinalScores = (winnerModal) => {
    // Sort players by score (ascending)
    const sortedPlayers = [...players].sort((a, b) => a.total - b.total);
    
    // Create final scores content with enhanced design
    const finalScoresContent = document.createElement('div');
    finalScoresContent.className = 'final-scores-content';
    
    let scoresHTML = `
        <div class="final-scores-header">
            <h2 class="final-scores-title">Final Standings</h2>
            <div class="final-scores-summary">
                <span class="games-played">5 Rounds Completed</span>
                <span class="players-count">${players.length} Players</span>
            </div>
        </div>
        <div class="final-scores-grid">
    `;
    
    const rankSuffixes = ['st', 'nd', 'rd'];
    sortedPlayers.forEach((player, index) => {
        const isWinner = index === 0;
        const rankNum = index + 1;
        const rankSuffix = rankNum <= 3 ? rankSuffixes[index] : 'th';
        const bestRound = Math.min(...player.scores.filter(score => score !== null));
        const avgScore = Math.round(player.total / TOTAL_ROUNDS);
        
        scoresHTML += `
            <div class="final-score-card ${isWinner ? 'winner' : ''}" data-rank="${rankNum}">
                <div class="rank-badge">${rankNum}${rankSuffix}</div>
                ${isWinner ? '<div class="winner-crown">👑</div>' : ''}
                <div class="player-info">
                    <h3 class="final-player-name">${player.name}</h3>
                    <div class="final-player-score-container">
                        <span class="final-score-label">Total Score</span>
                        <div class="final-player-score">${player.total}</div>
                    </div>
                </div>
                <div class="player-stats">
                    <div class="stat-item">
                        <span class="stat-label">Best Round</span>
                        <span class="stat-value">${bestRound}</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Average</span>
                        <span class="stat-value">${avgScore}</span>
                    </div>
                </div>
                <div class="score-details">
                    <h4 class="round-history-title">Round History</h4>
                    <div class="round-history">
                        ${player.scores.map((score, roundIndex) => `
                            <div class="round-history-item ${score === bestRound ? 'best-round' : ''}">
                                <span class="round-label">Round ${roundIndex + 1}</span>
                                <span class="round-value">${score !== null ? score : '-'}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
                ${isWinner ? '<div class="winner-glow"></div>' : ''}
            </div>
        `;
    });
    
    scoresHTML += `
        </div>
        <div class="final-scores-buttons">
            <button id="back-to-winner-btn" class="neon-button secondary">Back to Winner</button>
            <button id="new-game-from-scores-btn" class="neon-button">New Game</button>
        </div>
    `;
    
    finalScoresContent.innerHTML = scoresHTML;
    
    // Hide the winner content with animation
    const winnerContent = winnerModal.querySelector('.winner-modal-content');
    gsap.to(winnerContent, {
        opacity: 0,
        scale: 0.8,
        duration: 0.3,
        onComplete: () => {
            winnerContent.style.display = 'none';
            
            // Add final scores content to modal
            winnerModal.appendChild(finalScoresContent);
            
            // Animate in the final scores
            gsap.fromTo(finalScoresContent, 
                { opacity: 0, scale: 0.8 }, 
                { opacity: 1, scale: 1, duration: 0.5, ease: "back.out(1.7)" }
            );
            
            // Animate in each score card with staggered delay
            const scoreCards = finalScoresContent.querySelectorAll('.final-score-card');
            scoreCards.forEach((card, index) => {
                const rank = parseInt(card.dataset.rank);
                const delay = rank * 0.15; // Stagger based on rank
                
                gsap.fromTo(card,
                    { 
                        opacity: 0,
                        x: -50,
                        rotateY: -30
                    },
                    { 
                        opacity: 1,
                        x: 0,
                        rotateY: 0,
                        duration: 0.5,
                        delay: delay,
                        ease: "back.out(1.7)"
                    }
                );
                
                // Add hover effect
                card.addEventListener('mousemove', (e) => {
                    const rect = card.getBoundingClientRect();
                    const x = e.clientX - rect.left;
                    const y = e.clientY - rect.top;
                    
                    const xRotation = ((y - rect.height / 2) / rect.height) * 10;
                    const yRotation = ((x - rect.width / 2) / rect.width) * -10;
                    
                    gsap.to(card, {
                        rotateX: xRotation,
                        rotateY: yRotation,
                        scale: 1.05,
                        duration: 0.3,
                        ease: "power2.out"
                    });
                });
                
                card.addEventListener('mouseleave', () => {
                    gsap.to(card, {
                        rotateX: 0,
                        rotateY: 0,
                        scale: 1,
                        duration: 0.3,
                        ease: "power2.out"
                    });
                });
            });
            
            // Add event listeners
            finalScoresContent.querySelector('#back-to-winner-btn').addEventListener('click', () => {
                // Hide final scores with animation
                gsap.to(finalScoresContent, {
                    opacity: 0,
                    scale: 0.8,
                    duration: 0.3,
                    onComplete: () => {
                        finalScoresContent.remove();
                        
                        // Show winner content again with animation
                        winnerContent.style.display = 'block';
                        gsap.fromTo(winnerContent, 
                            { opacity: 0, scale: 0.8 }, 
                            { opacity: 1, scale: 1, duration: 0.5, ease: "back.out(1.7)" }
                        );
                    }
                });
            });
            
            finalScoresContent.querySelector('#new-game-from-scores-btn').addEventListener('click', () => {
                // Reset game with animation
                gsap.to(winnerModal, {
                    opacity: 0,
                    duration: 0.3,
                    onComplete: () => {
                        resetGame();
                        winnerModal.remove();
                    }
                });
            });
        }
    });
};

const createConfetti = () => {
    const confettiCount = 200;
    const colors = ['#00ffff', '#ff00ff', '#ffff00', '#ffffff'];
    
    for (let i = 0; i < confettiCount; i++) {
        const confetti = document.createElement('div');
        confetti.className = 'confetti';
        confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        confetti.style.left = `${Math.random() * 100}%`;
        confetti.style.top = '-20px';
        confetti.style.width = `${Math.random() * 10 + 5}px`;
        confetti.style.height = `${Math.random() * 10 + 5}px`;
        confetti.style.opacity = Math.random();
        confetti.style.transform = `rotate(${Math.random() * 360}deg)`;
        
        document.body.appendChild(confetti);
        
        gsap.to(confetti, {
            y: `${window.innerHeight + 100}px`,
            x: `${(Math.random() - 0.5) * 200}px`,
            rotation: `+=${Math.random() * 360 + 180}`,
            duration: Math.random() * 3 + 2,
            ease: "power1.out",
            onComplete: () => {
                confetti.remove();
            }
        });
    }
};

const resetGame = () => {
    players = [];
    currentId = 0;
    currentRound = 1;
    navigateToPage(gamePage, introPage);
};

const resetAll = () => {
    if (confirm('Are you sure you want to reset all scores and players?')) {
        resetGame();
    }
};

// Notification system
const showNotification = (message, type = 'info') => {
    // Remove any existing notifications first
    const existingContainer = document.querySelector('.notifications-container');
    if (existingContainer) {
        gsap.to(existingContainer, {
            opacity: 0,
            x: -100,
            duration: 0.3,
            onComplete: () => existingContainer.remove()
        });
    }

    // Create new notifications container
    const notificationsContainer = document.createElement('div');
    notificationsContainer.className = 'notifications-container';
    document.body.appendChild(notificationsContainer);

    // Create new notification
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    
    // Add icon based on type
    let icon;
    switch(type) {
        case 'success':
            icon = '✓';
            break;
        case 'error':
            icon = '✕';
            break;
        case 'warning':
            icon = '⚠';
            break;
        default:
            icon = 'ℹ';
    }
    
    notification.innerHTML = `
        <div class="notification-icon">${icon}</div>
        <div class="notification-message">${message}</div>
        <button class="notification-close">×</button>
    `;
    
    // Add to container
    notificationsContainer.appendChild(notification);
    
    // Add click handler for close button
    const closeBtn = notification.querySelector('.notification-close');
    closeBtn.addEventListener('click', () => {
        gsap.to(notificationsContainer, {
            opacity: 0,
            x: -100,
            duration: 0.3,
            onComplete: () => notificationsContainer.remove()
        });
    });
    
    // Animate in
    gsap.fromTo(notification, 
        { x: -100, opacity: 0 }, 
        { x: 0, opacity: 1, duration: 0.5, ease: "back.out(1.7)" }
    );
    
    // Auto remove after delay
    setTimeout(() => {
        if (notificationsContainer.parentElement) {
            gsap.to(notificationsContainer, {
                x: -100,
                opacity: 0,
                duration: 0.3,
                onComplete: () => notificationsContainer.remove()
            });
        }
    }, 5000);
};

// Rendering Functions
const renderScoreboard = () => {
    scoreboardEl.innerHTML = '';
    
    if (players.length === 0) {
        scoreboardEl.innerHTML = `
            <div class="empty-state">
                <p>No players added yet. Go back to add players.</p>
            </div>
        `;
        return;
    }
    
    // Find player with lowest score (winner)
    let lowestScore = Infinity;
    let winnerId = null;
    
    players.forEach(player => {
        if (player.total < lowestScore) {
            lowestScore = player.total;
            winnerId = player.id;
        }
    });
    
    // Create player cards
    players.forEach(player => {
        const isWinner = player.id === winnerId && players.length > 1;
        const playerCard = document.createElement('div');
        playerCard.className = `player-card ${isWinner ? 'winner' : ''}`;
        playerCard.dataset.id = player.id;
        
        // Create round scores HTML
        let roundScoresHTML = '';
        for (let i = 0; i < TOTAL_ROUNDS; i++) {
            const score = player.scores[i];
            const isCurrentRound = i === currentRound - 1;
            roundScoresHTML += `
                <div class="round-score ${isCurrentRound ? 'current' : ''} ${score !== null ? 'scored' : ''}">
                    <span class="round-number">R${i + 1}</span>
                    <span class="round-score-value">${score !== null ? score : '-'}</span>
                </div>
            `;
        }
        
        playerCard.innerHTML = `
            <h3 class="player-name">${player.name}</h3>
            <div class="player-score">${player.total}</div>
            <div class="round-scores-container">
                ${roundScoresHTML}
            </div>
        `;
        
        scoreboardEl.appendChild(playerCard);
        
        // Add 3D hover effect
        playerCard.addEventListener('mousemove', (e) => {
            const rect = playerCard.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            const xRotation = ((y - rect.height / 2) / rect.height) * 10;
            const yRotation = ((x - rect.width / 2) / rect.width) * -10;
            
            playerCard.style.transform = `
                perspective(1000px)
                rotateX(${xRotation}deg)
                rotateY(${yRotation}deg)
                translateZ(10px)
                ${isWinner ? 'translateZ(20px)' : ''}
            `;
        });
        
        playerCard.addEventListener('mouseleave', () => {
            playerCard.style.transform = isWinner ? 'translateZ(20px)' : '';
        });
    });
    
    // Add 3D rotation to scoreboard on mouse move
    const scoreboardWrapper = document.querySelector('.scoreboard-wrapper');
    document.addEventListener('mousemove', (e) => {
        const xAxis = (window.innerWidth / 2 - e.pageX) / 100;
        const yAxis = (window.innerHeight / 2 - e.pageY) / 100;
        
        scoreboardWrapper.style.transform = `rotateY(${xAxis}deg) rotateX(${yAxis}deg)`;
    });
    
    // Check if all players have scores for the current round
    checkAllPlayersScored();
};

const updatePlayerSelect = () => {
    playerSelectEl.innerHTML = '<option value="" disabled selected>Select player</option>';
    
    players.forEach(player => {
        // Only show players who haven't scored in the current round
        if (player.scores[currentRound - 1] === null) {
            const option = document.createElement('option');
            option.value = player.id;
            option.textContent = player.name;
            playerSelectEl.appendChild(option);
        }
    });
};

// Event Listeners - Intro Page
startGameBtn.addEventListener('click', () => {
    navigateToPage(introPage, addPlayersPage);
});

// Event Listeners - Add Players Page
addPlayerToListBtn.addEventListener('click', () => {
    addPlayerToList(playerNameInput.value);
});

playerNameInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        addPlayerToList(playerNameInput.value);
    }
});

backToIntroBtn.addEventListener('click', () => {
    navigateToPage(addPlayersPage, introPage);
});

goToGameBtn.addEventListener('click', () => {
    if (players.length >= MIN_PLAYERS && players.length <= MAX_PLAYERS) {
        navigateToPage(addPlayersPage, gamePage);
    } else {
        showNotification(`You need between ${MIN_PLAYERS} and ${MAX_PLAYERS} players to start the game.`, 'error');
    }
});

// Event Listeners - Game Page
addScoreBtn.addEventListener('click', () => {
    const playerId = parseInt(playerSelectEl.value);
    addScore(playerId, scoreInputEl.value);
});

scoreInputEl.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && playerSelectEl.value) {
        const playerId = parseInt(playerSelectEl.value);
        addScore(playerId, scoreInputEl.value);
    }
});

backToPlayersBtn.addEventListener('click', () => {
    navigateToPage(gamePage, addPlayersPage);
});

resetBtn.addEventListener('click', resetAll);

if (endRoundBtn) {
    endRoundBtn.addEventListener('click', endRound);
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    initBackgroundEffects();
    
    // Start with the intro page
    introPage.classList.add('active');
}); 