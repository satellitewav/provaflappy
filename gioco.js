var DEBUG = false;
var SPEED = 180;
var GRAVITY = 23;
var FLAP = 420;
var SPAWN_RATE = 1 / 1.3;
var OPENING = 165;

function init(parent) {

var state = {
    preload: preload,
    create: create,
    update: update,
    render: render
};

var game = new Phaser.Game(
    480,
    700,
    Phaser.CANVAS,
    parent,
    state,
    false,
    false
);

function preload() {
    game.load.image('sky', 'assets/cielo.png');
    var assets = {
        spritesheet: {
            birdie: ['assets/satellite.png', 48, 24],
            clouds: ['assets/razzi.png', 128, 64]
        },
        image: {
            finger: ['assets/megalaser.png'],
            fence: ['assets/catene.png']
        },
        audio: {
            score: ['assets/score.wav'],
            hurt: ['assets/hurt.wav']
        }
    };
    Object.keys(assets).forEach(function(type) {
        Object.keys(assets[type]).forEach(function(id) {
            game.load[type].apply(game.load, [id].concat(assets[type][id]));
        });
    });
}

var gameStarted,
    gameOver,
    score,
    bg,
    credits,
    clouds,
    fingers,
    invs,
    birdie,
    fence,
    scoreText,
    instText,
    gameOverText,
    scoreSnd,
    hurtSnd,
    fingersTimer,
    cloudsTimer,
    cobraMode = 0,
    gameOvers = 0;



function create() {
    game.stage.scaleMode = Phaser.StageScaleMode.SHOW_ALL;
    game.stage.scale.setScreenSize(true);
    // Draw bg
    bg = game.add.graphics(0, 0);
    bg.beginFill(0xDDEEFF, 1);
    bg.drawRect(0, 0, game.world.width, game.world.height);
    game.add.sprite(0, 0, 'sky', game.world.width, game.world.height);
    bg.endFill();

    // Credits 'yo
    credits = game.add.text(
        game.world.width / 2,
        10,
        'Satellite Games\n@satellite.wav',
        {
            font: '8px "Press Start 2P"',
            fill: '#fff',
            align: 'center'
        }
    );
    credits.anchor.x = 0.5;
    // Add clouds group
    clouds = game.add.group();
    // Add fingers
    fingers = game.add.group();
    // Add invisible thingies
    invs = game.add.group();
    // Add birdie
    birdie = game.add.sprite(0, 0, 'birdie');
    birdie.anchor.setTo(0.5, 0.5);
    birdie.animations.add('fly', [0, 1, 2, 3], 10, true);
    birdie.animations.add('cobra', [4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19], 60, false);
    birdie.inputEnabled = true;
    birdie.body.collideWorldBounds = true;
    birdie.body.gravity.y = GRAVITY;
    // Add fence
    fence = game.add.tileSprite(0, game.world.height - 32, game.world.width, 32, 'fence');
//    fence2 = game.add.tileSprite(100, game.world.height - 32, game.world.width, 32, 'fence');
    fence.tileScale.setTo(2, 2);
    // Add score text
    scoreText = game.add.text(
        game.world.width / 2,
        game.world.height / 4,
        "",
        {
            font: '16px "Press Start 2P"',
            fill: '#fff',
            stroke: '#8d0d26',
            strokeThickness: 4,
            align: 'center'
        }
    );
    scoreText.anchor.setTo(0.5, 0.5);
    // Add instructions text
    instText = game.add.text(
        game.world.width / 2,
        game.world.height - game.world.height / 4,
        "",
        {
            font: '8px "Press Start 2P"',
            fill: '#fff',
            stroke: '#8d0d26',
            strokeThickness: 4,
            align: 'center'
        }
    );
    instText.anchor.setTo(0.5, 0.5);
    // Add game over text
    gameOverText = game.add.text(
        game.world.width / 2,
        game.world.height / 2,
        "",
        {
            font: '16px "Press Start 2P"',
            fill: '#fff',
            stroke: '#8d0d26',
            strokeThickness: 4,
            align: 'center'
        }
    );
    gameOverText.anchor.setTo(0.5, 0.5);
    gameOverText.scale.setTo(2, 2);
    // Add sounds
    scoreSnd = new Audio('/FlappySatellite/assets/score.wav');
    scoreSnd.volume = 0.25;
    hurtSnd = new Audio('/FlappySatellite/assets/hurt.wav');
    hurtSnd.volume = 0.25;
    // Add controls
    game.input.onDown.add(flap);
    game.input.keyboard.addCallbacks(game, onKeyDown, onKeyUp);
    // Start clouds timer
    cloudsTimer = new Phaser.Timer(game);
    cloudsTimer.onEvent.add(spawnCloud);
    cloudsTimer.start();
    cloudsTimer.add(Math.random());
    // RESET!
    reset();
}

function reset() {
    gameStarted = false;
    gameOver = false;
    score = 0;
    credits.renderable = true;
    scoreText.setText("FLAPPY\nSATELLITE");
    instText.setText("TOCCA PER GIOCARE");
    gameOverText.renderable = false;
    birdie.body.allowGravity = false;
    birdie.angle = 0;
    birdie.reset(game.world.width / 4, game.world.height / 2);
    birdie.scale.setTo(2, 2);
    birdie.animations.play('fly');
    fingers.removeAll();
    invs.removeAll();
}

function start() {
    ost.currentTime = 0;
    ost.play();
    ost.volume = 0.6;
    credits.renderable = false;
    birdie.body.allowGravity = true;
    // SPAWN FINGERS!
    fingersTimer = new Phaser.Timer(game);
    fingersTimer.onEvent.add(spawnFingers);
    fingersTimer.start();
    fingersTimer.add(2);
    // Show score
    scoreText.setText(score);
    instText.renderable = false;
    // START!
    gameStarted = true;
}

function flap() {
    if (!gameStarted) {
        start();
    }
    if (!gameOver) {
        birdie.body.velocity.y = -FLAP;
    }
}

function spawnCloud() {
    cloudsTimer.stop();
    var cloudY = Math.random() * game.height / 2;
    var cloud = clouds.create(
        game.width,
        cloudY,
        'clouds',
        Math.floor(4 * Math.random())
    );
    var cloudScale = 0 + 1 * Math.random();
    cloud.alpha = 2 / cloudScale;
    cloud.scale.setTo(cloudScale, cloudScale);
    cloud.body.allowGravity = false;
    cloud.body.velocity.x = -SPEED / cloudScale;
    cloud.anchor.y = 0;

    cloudsTimer.start();
    cloudsTimer.add(4 * Math.random());
}

function o() {
    return OPENING + 60 * ((score > 50 ? 50 : 50 - score) / 50);
}

function spawnFinger(fingerY, flipped) {
    var finger = fingers.create(
        game.width,
        fingerY + (flipped ? -o() : o()) / 2,
        'finger'
    );
    finger.body.allowGravity = false;

    // Flip finger! *GASP*
    finger.scale.setTo(2, flipped ? -2 : 2);
    finger.body.offset.y = flipped ? -finger.body.height * 2 : 0;

    // Move to the left
    finger.body.velocity.x = -SPEED;

    return finger;
}

function spawnFingers() {
    fingersTimer.stop();

    var fingerY = ((game.height - 16 - o() / 2) / 2) + (Math.random() > 0.5 ? -1 : 1) * Math.random() * game.height / 6;
    // Bottom finger
    var botFinger = spawnFinger(fingerY);
    // Top finger (flipped)
    var topFinger = spawnFinger(fingerY, true);

    // Add invisible thingy
    var inv = invs.create(topFinger.x + topFinger.width, 0);
    inv.width = 2;
    inv.height = game.world.height;
    inv.body.allowGravity = false;
    inv.body.velocity.x = -SPEED;

    fingersTimer.start();
    fingersTimer.add(1 / SPAWN_RATE);
}

function addScore(_, inv) {
    invs.remove(inv);
    score += 1;
    scoreText.setText(score);
    scoreSnd.play();
}

function setGameOver() {
    ost.pause();
    sil.play();
    gameOver = true;
    var text=document.getElementById('name');

    if( document.getElementById("name").value != ''){
        instText.setText("TOCCA IL SATELLITE\nPER RIPROVARE");
        instText.renderable = true;
        var hiscore = window.localStorage.getItem('hiscore');
        hiscore = hiscore ? hiscore : score;
        hiscore = score > parseInt(hiscore, 10) ? score : hiscore;
        window.localStorage.setItem('hiscore', hiscore);
        gameOverText.setText("GAME OVER\n\nRECORD\n" + text.value + ":" + hiscore);
    }else{
        instText.setText("TOCCA IL SATELLITE\nPER RIPROVARE\n\nINSERISCI UN NOME\nPER SALVARE IL RECORD");
        instText.renderable = true;
        var hiscore = window.localStorage.getItem('hiscore');
        hiscore = hiscore ? hiscore : score;
        hiscore = score > parseInt(hiscore, 10) ? score : hiscore;
        window.localStorage.setItem('hiscore', hiscore);
        gameOverText.setText("GAME OVER\n\nRECORD\n" + hiscore);
    }

    
    var x = parseInt(hiscore)
    
    
    assegnaPunteggio(x, hiscore);
  
    gameOverText.renderable = true;
    // Stop all fingers
    fingers.forEachAlive(function(finger) {
        finger.body.velocity.x = 0;
    });
    invs.forEach(function(inv) {
        inv.body.velocity.x = 0;
    });
    // Stop spawning fingers
    fingersTimer.stop();
    // Make birdie reset the game
    birdie.events.onInputDown.addOnce(reset);
    hurtSnd.play();
    gameOvers++;
}

function update() {
    if (gameStarted) {
        // Make birdie dive
        var dvy = FLAP + birdie.body.velocity.y;
        birdie.angle = (90 * dvy / FLAP) - 180;
        if (birdie.angle < -30) {
            birdie.angle = -30;
        }
        if (
            gameOver ||
            birdie.angle > 90 ||
            birdie.angle < -90
        ) {
            birdie.angle = 90;
            birdie.animations.stop();
            birdie.frame = 3;
        } else {
            birdie.animations.play(cobraMode > 0 ? 'cobra' : 'fly');
        }
        // Birdie is DEAD!
        if (gameOver) {
            if (birdie.scale.x < 4) {
                birdie.scale.setTo(
                    birdie.scale.x * 1.2,
                    birdie.scale.y * 1.2
                );
            }
            // Shake game over text
            gameOverText.angle = Math.random() * 5 * Math.cos(game.time.now / 100);
        } else {
            // Check game over
            if (cobraMode < 1) {
                game.physics.overlap(birdie, fingers, setGameOver);
                if (!gameOver && birdie.body.bottom >= game.world.bounds.bottom) {
                    setGameOver();
                }
            }
            // Add score
            game.physics.overlap(birdie, invs, addScore);
        }
        // Remove offscreen fingers
        fingers.forEachAlive(function(finger) {
            if (finger.x + finger.width < game.world.bounds.left) {
                finger.kill();
            }
        });
        // Update finger timer
        fingersTimer.update();
    } else {
        birdie.y = (game.world.height / 2) + 8 * Math.cos(game.time.now / 200);
    }
    if (!gameStarted || gameOver) {
        // Shake instructions text
        instText.scale.setTo(
            2 + 0.1 * Math.sin(game.time.now / 100),
            2 + 0.1 * Math.cos(game.time.now / 100)
        );
    }
    // Shake score text
    scoreText.scale.setTo(
        2 + 0.1 * Math.cos(game.time.now / 100),
        2 + 0.1 * Math.sin(game.time.now / 100)
    );
    // Update clouds timer
    cloudsTimer.update();
    // Remove offscreen clouds
    clouds.forEachAlive(function(cloud) {
        if (cloud.x + cloud.width < game.world.bounds.left) {
            cloud.kill();
        }
    });
    // Scroll fence
    if (!gameOver) {
        fence.tilePosition.x -= game.time.physicsElapsed * SPEED / 2;
    }
    // Decrease cobra mode
    cobraMode -= game.time.physicsElapsed * SPEED * 5;
}

function render() {
    if (DEBUG) {
        game.debug.renderSpriteBody(birdie);
        fingers.forEachAlive(function(finger) {
            game.debug.renderSpriteBody(finger);
        });
        invs.forEach(function(inv) {
            game.debug.renderSpriteBody(inv);
        });
    }
}

function onKeyUp(e) { }

var pressTime = 0;
function onKeyDown(e) {
    if (Phaser.Keyboard.SPACEBAR == e.keyCode) {
        if (game.time.now - pressTime < 200) {
            cobraMode = 1000;
        } else {
            flap();
        }
        pressTime = game.time.now;
    }
}

};

async function controlloUtente() {
    // Make the initial query
    var text=document.getElementById('name');
    var migliore = "0";
    var hiscore = "0";
    const query = await db.collection("players").where("name", "==", text.value).get();
  
    if (!query.empty) {
        const snapshot = query.docs[0];
        const data = snapshot.data();
        let migliore  = `${data.score}`;
        var hiscore = migliore;
        window.localStorage.setItem('hiscore', hiscore);
        console.log(hiscore)
        console.log(data);
    } else {
        var hiscore = 0;
        window.localStorage.setItem('hiscore', hiscore);
        console.log("Nuovo utente, assegno punteggio ", hiscore);
    }
  
}

async function assegnaPunteggio(x, hiscore) {
    // Make the initial query
    var text=document.getElementById('name');

    const query = await db.collection("players").where("name", "==", text.value).get();
  
    if (!query.empty) {
        const snapshot = query.docs[0];
        const data = snapshot.data();
        let migliore  = `${data.score}`;
        if (hiscore > migliore){
            console.log("Miglior punteggio superato");
            db.collection("players").where("name", "==", text.value)
            .get()
            .then((querySnapshot) => {
                querySnapshot.forEach((doc) => {
                // doc.data() is never undefined for query doc snapshots
                    db.collection("players").doc(doc.id).update({
                        score: x,
                    })
                    console.log("Dati precedenti aggiornati");
                });
            })
        }else{
            console.log("Miglior punteggio non superato");
        }
    } else {
        if( document.getElementById("name").value != ''){
            db.collection("players").add({
                name: text.value,
                score: x,
            })
            .then((docRef) => {
                console.log("Document written with ID: ", docRef.id);
            })
            .catch((error) => {
            console.error("Error adding document: ", error);
            });
        } 
        console.log("Nuovo utente, assegno nome", text.value, "e punteggio ", hiscore);
    }
}

function StartGame(){

    ost = new Audio('soundtrack.mp3');
    sil = new Audio('silenzio.mp3');
    ost.loop = true;
    ost.volume = 0.6;
    
    var text=document.getElementById('name');
    var migliore = "0";
    var hiscore = "0";
    
    controlloUtente();
    var top = document.getElementById("top");
    var bottom = document.getElementById("bottom");
            
    if (top.style.display == "none")
    {
        top.style.display = "block";
        bottom.style.display = "none";
    }
    else{
        top.style.display = "none";
        bottom.style.display = "block";
    }

    function start() {
        init(document.querySelector('#screen'));
    }

    WebFontConfig = {
        google: { families: [ 'Press+Start+2P::latin' ] },
        active: start
    };
    (function() {
        var wf = document.createElement('script');
        wf.src = ('https:' == document.location.protocol ? 'https' : 'http') +
        '://ajax.googleapis.com/ajax/libs/webfont/1/webfont.js';
        wf.type = 'text/javascript';
        wf.async = 'true';
        var s = document.getElementsByTagName('script')[0];
        s.parentNode.insertBefore(wf, s);
    })();

   init(parent);
   console.log("start");
}