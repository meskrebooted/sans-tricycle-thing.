window.addEventListener('load', showStartScreen);

function showStartScreen() {
    const gameArea = document.getElementById('gameArea');
    gameArea.innerHTML = '';
    gameArea.style.position = 'relative';
    gameArea.style.width = '100vw';
    gameArea.style.height = '100vh';
    gameArea.style.background = '#000';
    gameArea.style.overflow = 'hidden';

    // Titolo centrato più verso il centro
    const title = document.createElement('img');
    title.src = 'title.png';
    title.style.position = 'absolute';
    title.style.left = '50%';
    title.style.top = '40%';
    title.style.transform = 'translate(-50%, -50%)';
    title.style.height = '120px';
    title.style.imageRendering = 'pixelated';
    title.style.zIndex = 10;
    gameArea.appendChild(title);

    // men.png sopra il titolo, ma più verso il centro
    const men = document.createElement('img');
    men.src = 'men.png';
    men.style.position = 'absolute';
    men.style.left = '50%';
    men.style.top = 'calc(40% - 110px)';
    men.style.transform = 'translate(-50%, 0)';
    men.style.height = '100px';
    men.style.imageRendering = 'pixelated';
    men.style.zIndex = 11;
    gameArea.appendChild(men);

    // Scritta sotto il titolo, più verso il centro
    const startText = document.createElement('div');
    startText.innerText = "Press 'Z' to start blastin.";
    startText.style.position = 'absolute';
    startText.style.left = '50%';
    startText.style.top = 'calc(40% + 110px)';
    startText.style.transform = 'translate(-50%, 0)';
    startText.style.color = '#fff';
    startText.style.fontFamily = 'pixel, monospace';
    startText.style.fontSize = '32px';
    startText.style.textAlign = 'center';
    startText.style.textShadow = '0 0 8px #000';
    startText.style.zIndex = 12;
    gameArea.appendChild(startText);

    // Avvia il gioco solo con Z
    function startOnZ(e) {
        if (e.key === 'z' || e.key === 'Z') {
            document.removeEventListener('keydown', startOnZ);

            // Mostra exp.gif centrato e molto grande
            gameArea.innerHTML = '';
            const exp = document.createElement('img');
            exp.src = 'exp.gif';
            exp.style.position = 'fixed';
            exp.style.left = '50%';
            exp.style.top = '50%';
            exp.style.transform = 'translate(-50%, -50%)';
            exp.style.width = '200vw';
            exp.style.height = '200vh';
            exp.style.objectFit = 'cover';
            exp.style.imageRendering = 'pixelated';
            exp.style.zIndex = 100;
            gameArea.appendChild(exp);

            // Suono exp.mp3
            const expSound = new Audio('exp.mp3');
            expSound.volume = 1;
            expSound.play();

            // Dopo 1.8 secondi (o la durata della gif), avvia il gioco
            setTimeout(() => {
                startGame();
            }, 1800);
        }
    }
    document.addEventListener('keydown', startOnZ);
}

let laneCount = 3;
let currentLane = 1;
let lanePositions = [];
let enemyInterval;
let enemies = [];
let laneLineIntervals = [];
let startTime, timerInterval;
let specialReady = false;
let specialActive = false;
let specialTimeout;
let gasterBlasterEl;
let beamEl = null; // AGGIUNGI QUESTA RIGA TRA LE VARIABILI GLOBALI

function startGame() {
    // Play sound at game start
    const audio = new Audio('stmpwyfs.mp3');
    audio.currentTime = 0;
    audio.volume = 1;
    audio.loop = true;
    audio.muted = false; // Assicurati che l'audio non sia muto
    // Prova a riprodurre l'audio immediatamente
    // per evitare problemi di autoplay su alcuni browser
    document.body.appendChild(audio);
    audio.load();
    // Attendi che l'utente interagisca con la pagina
    audio.play().catch(() => {
        const resumeAudio = () => {
            audio.play();
            document.removeEventListener('keydown', resumeAudio);
            document.removeEventListener('mousedown', resumeAudio);
        };
        document.addEventListener('keydown', resumeAudio);
        document.addEventListener('mousedown', resumeAudio);
    });
    // Riduci la velocità dei nemici e delle linee
    // (modifica i valori usati più avanti)
    const gameArea = document.getElementById('gameArea');
    gameArea.innerHTML = '';
    gameArea.style.position = 'relative';
    gameArea.style.width = '100vw';
    gameArea.style.height = '100vh';
    gameArea.style.margin = '0';
    gameArea.style.imageRendering = 'pixelated';
    gameArea.style.borderRadius = '0';
    gameArea.style.boxShadow = 'none';
    gameArea.style.background = '#0000';
    gameArea.style.overflow = 'hidden';

    lanePositions = [];
    for (let i = 0; i < laneCount; i++) {
        lanePositions.push((gameArea.clientHeight / laneCount) * i + gameArea.clientHeight / (laneCount * 2));
    }

    for (let i = 1; i < laneCount; i++) {
        const line = document.createElement('div');
        line.className = 'lane-line';
        line.style.top = `${(gameArea.clientHeight / laneCount) * i - 2}px`;
        line.style.left = '0';
        line.style.width = '100%';
        line.style.height = '18px'; // ancora più spesse
        line.style.background = `
    repeating-linear-gradient(
        to right,
        #FFD700 0 60px,      /* tratto giallo caldo lungo */
        transparent 60px 120px
    ),
    repeating-radial-gradient(
        circle at 90px 50%,
        #FFD700 0 10px,
        transparent 10px 120px
    )
`;
        line.style.opacity = '0.95'; // più visibili
        line.style.position = 'absolute';
        gameArea.appendChild(line);

        // Animazione delle linee - molto più veloce
        let offset = 0;
        const interval = setInterval(() => {
            offset = (offset - 32 + 80) % 80; // velocità aumentata
            line.style.backgroundPosition = `${offset}px 0`;
        }, 15); // intervallo dimezzato
        laneLineIntervals.push(interval);
    }

    const player = document.createElement('img');
    player.id = 'player';
    player.src = 'try.png';
    player.style.position = 'absolute';
    player.style.height = '200px';
    player.style.width = 'auto';
    player.style.left = '40px';
    player.style.top = `${lanePositions[currentLane] - 100}px`;
    player.style.transform = 'rotate(0deg)';
    gameArea.appendChild(player);

    const timer = document.createElement('div');
    timer.id = 'timer';
    timer.style.position = 'fixed';
    timer.style.zIndex = 10;

    timer.style.top = '50%';
    timer.style.left = '50%';
    timer.style.transform = 'translate(-50%, -50%)';
    timer.style.color = 'white';
    timer.style.fontSize = '30px';
    timer.style.top = 'unset';
    timer.style.left = '0';
    timer.style.bottom = '0';
    timer.style.transform = 'none';
    timer.style.textAlign = 'left';
    timer.style.margin = '20px';
    timer.style.fontFamily = 'pixel';
    gameArea.appendChild(timer);

    startTime = new Date();
    timerInterval = setInterval(updateTimer, 10);

    specialReady = false;
    specialActive = false;
    gasterBlasterEl = null;
    setTimeout(() => {
        specialReady = true;
        showSpecialReady();
    }, 10000); // 10 secondi per caricare l'attacco
    document.addEventListener('keydown', handleLaneChange);
    document.addEventListener('keydown', handleSpecialAttack);

    // Nemici spawnano molto più spesso
    enemyInterval = setInterval(createEnemy, 350);

    // Barra di carica speciale
    let specialBar = document.createElement('div');
    specialBar.id = 'specialBar';
    specialBar.style.position = 'fixed';
    specialBar.style.right = '40px';
    specialBar.style.bottom = '40px';
    specialBar.style.height = '60px';
    specialBar.style.display = 'flex';
    specialBar.style.alignItems = 'center';
    specialBar.style.zIndex = 20;

    // Icona Gaster Blaster
    let specialIcon = document.createElement('img');
    specialIcon.src = 'gaster2.png';
    specialIcon.style.height = '60px';
    specialIcon.style.width = 'auto';
    specialIcon.style.marginRight = '10px';
    specialBar.appendChild(specialIcon);

    // Barra vera e propria
    let specialBarFill = document.createElement('div');
    specialBarFill.id = 'specialBarFill';
    specialBarFill.style.height = '24px';
    specialBarFill.style.width = '200px';
    specialBarFill.style.background = '#222';
    specialBarFill.style.border = '2px solid #fff';
    specialBarFill.style.borderRadius = '12px';
    specialBarFill.style.overflow = 'hidden';
    specialBarFill.style.imageRendering = 'pixelated';
    specialBar.appendChild(specialBarFill);

    // Riempimento dinamico
    let specialBarInner = document.createElement('div');
    specialBarInner.id = 'specialBarInner';
    specialBarInner.style.height = '100%';
    specialBarInner.style.width = '0%';
    specialBarInner.style.background = 'linear-gradient(90deg, #fff 70%, #bff 100%)';
    specialBarInner.style.transition = 'width 0.2s';
    specialBarFill.appendChild(specialBarInner);

    // Testo sotto la barra
    let specialBarText = document.createElement('div');
    specialBarText.id = 'specialBarText';
    specialBarText.innerText = "Press 'Z' to use Gaster Blaster";
    specialBarText.style.position = 'absolute';
    specialBarText.style.bottom = '-30px';
    specialBarText.style.width = '100%';
    specialBarText.style.color = '#fff';
    specialBarText.style.fontFamily = 'pixel, monospace';
    specialBarText.style.fontSize = '18px';
    specialBarText.style.textAlign = 'center';
    specialBarText.style.marginTop = '4px';
    specialBarText.style.textShadow = '0 0 4px #000';
    specialBar.appendChild(specialBarText);

    document.body.appendChild(specialBar);

    startSpecialBarCharge(10000);
    setTimeout(() => {
        specialReady = true;
        showSpecialReady();
        updateSpecialBar(100);
    }, 10000);
}


function handleSpecialAttack(e) {
    if ((e.key === 'z' || e.key === 'Z') && specialReady && !specialActive) {
        activateSpecial();
    }
}

function activateSpecial() {
    updateSpecialBar(0); // Reset barra subito
    specialReady = false;
    specialActive = true;
    const gameArea = document.getElementById('gameArea');
    gasterBlasterEl = document.createElement('img');
    gasterBlasterEl.src = 'gaster1.png'; // sprite 1
    gasterBlasterEl.style.position = 'absolute';
    gasterBlasterEl.style.height = '120px';
    gasterBlasterEl.style.left = '120px';
    gasterBlasterEl.style.top = `${lanePositions[currentLane] - 60}px`;
    gasterBlasterEl.style.zIndex = 5;
    gameArea.appendChild(gasterBlasterEl);

    // SUONO DEL RAGGIO PARTE SUBITO
    const blastSound = new Audio('gasterblaster.mp3');
    blastSound.volume = 1;
    blastSound.play();

    // INIZIA SUBITO LA RICARICA DELLA BARRA
    startSpecialBarCharge(10000);

    setTimeout(() => {
        // Dopo 1 secondo: Sprite 2 (raggio)
        gasterBlasterEl.src = 'gaster2.png';

        // CREA IL RAGGIO VISIBILE
        beamEl = document.createElement('div');
        beamEl.className = 'gaster-beam';
        beamEl.style.position = 'absolute';
        beamEl.style.left = '220px'; // parte dalla bocca
        beamEl.style.top = `${lanePositions[currentLane] - 25}px`;
        beamEl.style.width = `calc(100vw - 240px)`; // si estende fino a fine schermo
        beamEl.style.height = '50px';
        beamEl.style.background = 'linear-gradient(90deg, #fff 80%, #bff 100%)';
        beamEl.style.boxShadow = '0 0 40px 20px #fff8';
        beamEl.style.opacity = '0.85';
        beamEl.style.zIndex = 4;
        beamEl.style.borderRadius = '18px';
        gameArea.appendChild(beamEl);

        // Rimuovi tutti i nemici nella corsia attuale subito
        clearEnemiesInLane(currentLane);
        // Per 3 secondi, ogni 100ms, elimina i nemici nella corsia attuale (anche se cambi corsia)
        specialTimeout = setInterval(() => {
            clearEnemiesInLane(currentLane);
        }, 100);

        setTimeout(() => {
            clearInterval(specialTimeout);
            // Sprite 3 (vuoto)
            gasterBlasterEl.src = 'gaster3.png';
            if (beamEl) {
                beamEl.remove();
                beamEl = null;
            }
            setTimeout(() => {
                if (gasterBlasterEl) {
                    gasterBlasterEl.remove();
                    gasterBlasterEl = null;
                }
                specialActive = false;
                // DOPO 10 SECONDI, ABILITA L'ATTACCO
                setTimeout(() => {
                    specialReady = true;
                    showSpecialReady();
                    updateSpecialBar(100);
                }, 10000);
            }, 500);
        }, 3000);
    }, 1000); // 1 secondo sprite 1, poi sprite 2
}

function clearEnemiesInLane(lane) {
    enemies = enemies.filter(obj => {
        if (obj.lane === lane) {
            if (obj.interval) clearInterval(obj.interval);
            if (obj.el && obj.el.parentNode) obj.el.remove();
            return false;
        }
        return true;
    });
}

function handleLaneChange(e) {
    if (e.key === 'ArrowUp' || e.key === 'w') {
        if (currentLane > 0) currentLane--;
    }
    if (e.key === 'ArrowDown' || e.key === 's') {
        if (currentLane < laneCount - 1) currentLane++;
    }
    movePlayerToLane();
    // Se il Gaster Blaster è attivo, spostalo nella nuova corsia
    if (specialActive && gasterBlasterEl) {
        gasterBlasterEl.style.top = `${lanePositions[currentLane] - 60}px`;
    }
    // Se il raggio è attivo, spostalo nella nuova corsia
    if (specialActive && beamEl) {
        beamEl.style.top = `${lanePositions[currentLane] - 25}px`;
    }
}

function movePlayerToLane() {
    const player = document.getElementById('player');
    player.style.top = `${lanePositions[currentLane] - 100}px`;
}

function createEnemy() {
    const gameArea = document.getElementById('gameArea');
    const lane = Math.floor(Math.random() * laneCount);
    const enemy = document.createElement('img');
    enemy.className = 'enemy';
    enemy.src = 'enemy.png';
    enemy.style.position = 'absolute';
    enemy.style.height = '100px';
    enemy.style.width = 'auto';
    enemy.style.top = `${lanePositions[lane] - 30}px`;
    enemy.style.left = `${window.innerWidth}px`;
    enemy.style.transform = 'rotate(0deg)';
    gameArea.appendChild(enemy);
    enemies.push({el: enemy, lane: lane, x: window.innerWidth});
    moveEnemy(enemy, lane);
}

function moveEnemy(enemy, lane) {
    let x = window.innerWidth;
    const obj = enemies.find(e => e.el === enemy);
    obj.interval = setInterval(() => {
        x -= 16;
        enemy.style.left = `${x}px`;
        if (x < 100 && x > 40) {
            if (lane === currentLane) {
                clearInterval(obj.interval);
                const boom = new Audio('boom.mp3');
                boom.volume = 1;
                boom.play();
                endGame();
            }
        }
        if (x < -60) {
            clearInterval(obj.interval);
            enemy.remove();
        }
    }, 15);
}

function updateTimer() {
    const timer = document.getElementById('timer');
    const currentTime = new Date();
    const timeElapsed = ((currentTime - startTime) / 1000).toFixed(2);
    timer.innerText = `${timeElapsed}s`;
    timer.style.textAlign = 'bottom';
}

function endGame() {
    clearInterval(timerInterval);
    clearInterval(enemyInterval);
    laneLineIntervals.forEach(clearInterval);
    document.removeEventListener('keydown', handleLaneChange);

    const gameArea = document.getElementById('gameArea');
    gameArea.innerHTML = '';

    // Mostra "GET DUNKED ON." centrato
    const dunked = document.createElement('div');
    dunked.innerText = "GET DUNKED ON.";
    dunked.style.position = 'fixed';
    dunked.style.left = '50%';
    dunked.style.top = '50%';
    dunked.style.transform = 'translate(-50%, -50%)';
    dunked.style.color = '#fff';
    dunked.style.fontFamily = 'pixel, monospace';
    dunked.style.fontSize = '64px';
    dunked.style.textAlign = 'center';
    dunked.style.textShadow = '0 0 16px #000';
    dunked.style.zIndex = 101;
    gameArea.appendChild(dunked);

    // Dopo 1 secondo, esplosione
    setTimeout(() => {
        gameArea.innerHTML = '';
        const exp = document.createElement('img');
        exp.src = 'exp.gif';
        exp.style.position = 'fixed';
        exp.style.left = '50%';
        exp.style.top = '50%';
        exp.style.transform = 'translate(-50%, -50%)';
        exp.style.width = '200vw';
        exp.style.height = '200vh';
        exp.style.objectFit = 'cover';
        exp.style.imageRendering = 'pixelated';
        exp.style.zIndex = 100;
        gameArea.appendChild(exp);

        // Suono exp.mp3
        const expSound = new Audio('exp.mp3');
        expSound.volume = 1;
        expSound.play();

        // Dopo 1.8 secondi, ricarica la pagina
        setTimeout(() => window.location.reload(), 1800);
    }, 1000);
}

function updateSpecialBar(percent) {
    const bar = document.getElementById('specialBarInner');
    if (bar) bar.style.width = `${percent}%`;
}

function startSpecialBarCharge(durationMs) {
    let start = Date.now();
    updateSpecialBar(0);
    let interval = setInterval(() => {
        let elapsed = Date.now() - start;
        let percent = Math.min(100, (elapsed / durationMs) * 100);
        updateSpecialBar(percent);
        if (percent >= 100) clearInterval(interval);
    }, 50);
}