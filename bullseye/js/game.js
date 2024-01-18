calculateGradientColor = (position) => {
    var colorStops = [
        { color: [255, 0, 0], position: 0 },
        { color: [255, 225, 0], position: 25 },
        { color: [255, 255, 255], position: 50 },
        { color: [20, 255, 20], position: 100 }
    ];

    colorStops.sort((a, b) => a.position - b.position);

    var startIndex = 0;
    var endIndex = colorStops.length - 1;

    for (var i = 0; i < colorStops.length - 1; i++) {
        if (position <= colorStops[i + 1].position) {
            endIndex = i + 1;
            break;
        }
        startIndex = i + 1;
    }

    var t = (position - colorStops[startIndex].position) / (colorStops[endIndex].position - colorStops[startIndex].position);

    var interpolate = function (c1, c2) {
        return Math.round(c1 * (1 - t) + c2 * t);
    };

    var color1 = colorStops[startIndex].color;
    var color2 = colorStops[endIndex].color;

    var r = interpolate(color1[0], color2[0]);
    var g = interpolate(color1[1], color2[1]);
    var b = interpolate(color1[2], color2[2]);

    return "rgb(" + r + "," + g + "," + b + ")";
}


formatTime = (time) => {
    return `${ Math.floor(time/3600)}:${(Math.floor(time/60) % 60).toString().padStart(2, '0')}:${Math.floor(time % 60).toString().padStart(2, '0')}`;
}

class Shot {

    emojis = 
    [ 
        ["💀"],
        ["💀"],
        ["😅", "🤣"],
        ["👎"],
        ["😅"],
        ["🏹"],
        ["⚡", "💪🏽"],
        ["💣", "💥"],
        ["🏆", "🎖️", "🏅", "🥇", "👑"],
        ["💯", "🎯", "🎉","🌟", "🔥", "🎊", "🔝", "✨",],
        ["🌈"]
    ];

    constructor(game, targetX, targetY, clickX, clickY, points) {
        this.game = game;

        this.width = 50;
        this.height = 50;

        this.element = document.createElement('shot');
        this.element.classList.add('shot');

        this.element.style.left = `${ targetX }px`;
        this.element.style.top = `${ targetY }px`;       

        this.element.innerHTML = points;

        game.targetField.appendChild(this.element);

        setInterval(() => { this.element.remove(); }, 1000);

        var audio = new Audio('./sounds/shot.mp3');
        audio.play();

        for (let i = 0; i < points/20; i++)
        {
            const confetti = document.createElement('div');

            confetti.innerText = this.emojis[Math.floor(points/10)][Math.floor(Math.random() * this.emojis[Math.floor(points/10)].length)];
            confetti.className = 'confetti';

            confetti.style.left = clickX + 'px';
            confetti.style.top = clickY + 'px';
            confetti.style.setProperty('--x', clickX + (Math.random()-0.5) * 200 + 'px');
            confetti.style.setProperty('--y', clickY + (Math.random()-0.5) * 200 + 'px');

            game.targetField.appendChild(confetti);
            
            setTimeout(() => { game.targetField.removeChild(confetti); }, 4000); 
        }
    }
}

class Target {
    constructor(game) {
        this.game = game;

        this.width = 50;
        this.height = 50;

        this.element = document.createElement('target');
        this.element.classList.add('target');
        this.element.style.width = `${this.width}px`;
        this.element.style.height = `${this.height}px`;

        game.targetField.appendChild(this.element);

        this.element.style.left = `${Math.random() * (game.targetField.clientWidth - this.width ) }px`;
        this.element.style.top = `${Math.random() * (game.targetField.clientHeight - this.height ) }px`;


        this.element.addEventListener('click', (event) => this.hitTarget(event));

        
    }

    hitTarget = (event) => {

        const clickX = event.clientX;
        const clickY = event.clientY;

        const rect = this.element.getBoundingClientRect();

        const targetX = rect.left + rect.width / 2;
        const targetY = rect.top + rect.height / 2;

        const distance = Math.sqrt((clickX - targetX) ** 2 + (clickY - targetY) ** 2);
        const maxDistance = Math.sqrt((rect.width / 2 / Math.sqrt(2)) ** 2 + (rect.height / 2 / Math.sqrt(2)) ** 2);

        const accuracy = 1 - distance / maxDistance;
        const points = Math.round(accuracy * 100);

        this.game.addPoints(points);

        new Shot(this.game, targetX, targetY, clickX, clickY, points);
        this.element.remove();
    }
}

class Game {
    timerDisplay = null;
    pointsDisplay = null;
    targetField = null;
    timeLeftDisplay = null;

    maxtime = 600; //ms * 10
    timeleft = 600; //ms * 10
    time = 0;
    points = 0;
    
    active = false;

    timerInterval = null;
    targetInterval = null;
    gameInterval = null;
    intervalIntervalTime = null;

    
    constructor(uiManager) {
        this.timerDisplay = document.getElementById('timer');
        this.pointsDisplay = document.getElementById('points');
        this.targetField = document.getElementById('targets');
        this.timeLeftDisplay = document.getElementById('bar');
        this.uiManager = uiManager;

        this.active = true;

        this.targetField.innerHTML = '';
        this.timerDisplay.innerHTML = formatTime(this.time);
        this.pointsDisplay.innerHTML = this.points;
        this.timeLeftDisplay.style.width = '100%';

        this.intervalIntervalTime = 1000;

        this.timerInterval = setInterval(() => { this.time++; this.timerDisplay.innerHTML = formatTime( this.time ) }, 1000);
        this.gameInterval = setInterval(this.gameLoop, 100);
        this.targetInterval = setInterval(this.spawnTargetLoop, this.intervalIntervalTime);

        // document.addEventListener('keydown', (event) => {
        //     if (event.key === 'Escape' && this.active) {
        //         this.gameOver();
        //     }
        // });
    }

    spawnTargetLoop = () =>{

        this.spawnTarget();

        this.intervalIntervalTime *= 0.99;
        clearInterval(this.targetInterval); 
        this.targetInterval = setInterval(this.spawnTargetLoop, this.intervalIntervalTime);
    }

    gameLoop = () => {

        this.timeleft -= Math.sqrt(this.time);
        this.maxtime = Math.max(this.maxtime, this.timeleft);

        this.timeLeftDisplay.style.width = `${Math.max(this.timeleft/this.maxtime * 100, 0)}%`;
        this.timeLeftDisplay.style.backgroundColor = calculateGradientColor(Math.max(this.timeleft/this.maxtime * 100, 0));


        if(this.timeleft <= 0) 
        {
            this.gameOver();
            return;
        }
    }

    gameOver = () => {
        uiManager.showGameOver();
        uiManager.showGameOver();

        clearInterval(this.timerInterval);
        clearInterval(this.gameInterval);
        clearInterval(this.targetInterval);

        this.active = false;
    }

    spawnTarget = () => {
        const target = new Target(this);
    }

    addPoints = (points) => {
        this.points += points;
        this.pointsDisplay.innerHTML = this.points;

        this.timeleft += points/2;
    }
}

class UI {
    lastgamepoints = 0;
    lastgametime = 0;
    gameManager = null;
    hughscores = null;
    
    scoreTable = document.getElementById('score_table');
    constructor() 
    {
        document.querySelectorAll('#play').forEach((button) => { button.addEventListener('click', this.startGame); });
        document.querySelectorAll('#show_mainmenu').forEach((button) => { button.addEventListener('click', this.showMainMenu); });
        document.querySelectorAll('#show_highscores').forEach((button) => { button.addEventListener('click', this.showHighscores); });
        document.querySelectorAll('#show_tutorial').forEach((button) => { button.addEventListener('click', this.showTutorial); });
        document.querySelectorAll('#submit_score').forEach((button) => { button.addEventListener('click', this.submitScore ); });

        this.scoreTable = document.getElementById('score_table');

        this.lastgamepoints = 0;
        this.lastgametime = 0;

        this.highscores = new Highscores();
    }


    startGame = () => {
        document.getElementById('main_menu').classList.add('closed');
        document.getElementById('highscores').classList.add('closed');
        document.getElementById('tutorial').classList.add('closed');
        document.getElementById('game_over').classList.add('closed');

        document.getElementById('game').classList.remove('closed');

        this.gameManager = new Game();
    }

    showGameOver = () => {
        document.getElementById('main_menu').classList.add('closed');
        document.getElementById('highscores').classList.add('closed');
        document.getElementById('tutorial').classList.add('closed');
        document.getElementById('game').classList.add('closed');

        document.getElementById('score').innerHTML = this.gameManager.points;
        document.getElementById('in_time').innerHTML = `${ formatTime(this.gameManager.time) }`;

        document.getElementById('game_over').classList.remove('closed');
    }

    submitScore = () => {    
        this.highscores.addHighscore(document.getElementById('nickname').value, this.gameManager.points, this.gameManager.time);
        this.showHighscores();
    }
    

    showMainMenu = () => {

        document.getElementById('game_over').classList.add('closed');
        document.getElementById('highscores').classList.add('closed');
        document.getElementById('tutorial').classList.add('closed');
        document.getElementById('game').classList.add('closed');

        document.getElementById('main_menu').classList.remove('closed');
    }

    showHighscores = () => {

        document.getElementById('main_menu').classList.add('closed');
        document.getElementById('game_over').classList.add('closed');
        document.getElementById('tutorial').classList.add('closed');
        document.getElementById('game').classList.add('closed');

        document.getElementById('highscores').classList.remove('closed');

        this.updateHighscores();
    }

    showTutorial = () => {
        document.getElementById('main_menu').classList.add('closed');
        document.getElementById('highscores').classList.add('closed');
        document.getElementById('game_over').classList.add('closed');
        document.getElementById('game').classList.add('closed');

        document.getElementById('tutorial').classList.remove('closed');
    }

    updateHighscores = () => 
    {
        let data = this.highscores.Highscores;
        let place = 1;
        this.scoreTable.innerHTML = '<span class="header">Place</span><span class="header">Nickname</span><span class="header">Points</span><span class="header">Time</span>';
        data.forEach(record => 
        {
            this.scoreTable.innerHTML += 
            `
            <span>${place++}</span>
            <span>${record.nickname}</span>
            <span>${record.points}</span>
            <span>
            ${ formatTime(record.time) }
            </span>`;
        });
    }
}

class Highscores {
    constructor() {
        this.Highscores = JSON.parse(localStorage.getItem('Bullseye-Highscores')) || [];
    }

    addHighscore = (nickname, points, time) => {
        this.Highscores.push({ nickname, points, time });
        this.Highscores.sort((a, b) => b.points - a.points);
        this.Highscores = this.Highscores.slice(0, 10);
        localStorage.setItem('Bullseye-Highscores', JSON.stringify(this.Highscores));
    }
}

var uiManager;
window.addEventListener('load', function () {
    uiManager = new UI();
    uiManager.updateHighscores();

});
