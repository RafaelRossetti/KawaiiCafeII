const config = {
    type: Phaser.AUTO,
    width: 900,
    height: 600,
    backgroundColor: '#fff9f0',
    parent: 'game-container',
    scene: {
        preload: preload,
        create: create,
        update: update
    }
};

const game = new Phaser.Game(config);

function preload() {
    this.load.audio('bgMusic', 'Music.wav');
    this.load.audio('hurryUp', 'HurryUp.mp3');
    this.load.audio('collect', 'Collect.wav');

    this.load.image('icon_coffee', 'cafe.png');
    this.load.image('icon_milk', 'leite.png');
    this.load.image('icon_strawberry', 'morango.png');
    this.load.image('icon_tea', 'cha.png');
    this.load.image('icon_sugar', 'acucar.png');
    this.load.image('puzzleFull', 'Puzzle.png');
}

function create() {
    // Background Cozinha
    this.add.rectangle(600, 300, 600, 600, 0xffebf0);
    this.add.grid(600, 300, 500, 500, 50, 50, 0xffffff, 0.1);

    // Painel Match-3
    this.add.rectangle(150, 300, 300, 600, 0x9575cd);
    this.match3 = new Match3(this, 10, 150, 6, 6, 45);
    this.match3.canMove = false;

    // Título Principal
    this.gameTitle = this.add.text(600, 300, 'Kawaii Café', {
        fontSize: '64px',
        color: '#8d6e63',
        fontFamily: 'Outfit',
        fontWeight: 'bold',
        stroke: '#ffffff',
        strokeThickness: 8
    }).setOrigin(0.5).setDepth(100);

    // UI - Inventário Rodapé
    this.inventoryTexts = {};
    const inventoryColors = {
        coffee: 0x6f4e37,
        milk: 0xffffff,
        strawberry: 0xff4081,
        tea: 0x4caf50,
        sugar: 0xd1c4e9
    };

    const items = [
        { key: 'coffee', icon: 'icon_coffee' },
        { key: 'milk', icon: 'icon_milk' },
        { key: 'strawberry', icon: 'icon_strawberry' },
        { key: 'tea', icon: 'icon_tea' },
        { key: 'sugar', icon: 'icon_sugar' }
    ];

    items.forEach((item, index) => {
        let x = 360 + (index * 90);
        let y = 560;
        let graphics = this.add.graphics();
        graphics.fillStyle(inventoryColors[item.key], 1);
        graphics.fillRoundedRect(x - 40, y - 22, 80, 44, 12);
        graphics.lineStyle(2, 0xffffff, 1);
        graphics.strokeRoundedRect(x - 40, y - 22, 80, 44, 12);
        graphics.setDepth(20);

        this.add.image(x - 18, y, item.icon).setScale(0.06).setDepth(21);
        let textColor = (item.key === 'milk' || item.key === 'sugar') ? '#6f4e37' : '#ffffff';
        this.inventoryTexts[item.key] = this.add.text(x + 18, y, '0', {
            fontSize: '18px', color: textColor, fontFamily: 'Outfit', fontWeight: 'bold'
        }).setOrigin(0.5).setDepth(21);
    });

    this.hurryUpPlayed = false;

    // UI - HUD Superior
    this.scoreText = this.add.text(15, 20, 'Score: 0', {
        fontSize: '20px', color: '#fff', backgroundColor: '#fc8eac', padding: { x: 8, y: 4 }, fontFamily: 'Outfit'
    }).setDepth(30);

    this.add.text(170, 15, 'VIDAS', { fontSize: '16px', color: '#fff', fontFamily: 'Outfit', fontWeight: 'bold' }).setDepth(30);
    this.livesText = this.add.text(170, 35, '🐾🐾🐾', { fontSize: '24px', color: '#fff', fontFamily: 'Outfit' }).setDepth(30);

    // UI - Pedido
    this.orderBubble = this.add.container(600, 140);
    let bubbleBg = this.add.rectangle(0, 0, 300, 80, 0xffffff, 0.9).setStrokeStyle(4, 0xfc8eac);
    this.orderText = this.add.text(0, -10, 'Aguardando Pedido...', {
        fontSize: '18px', color: '#8d6e63', fontFamily: 'Outfit', fontWeight: 'bold'
    }).setOrigin(0.5);
    this.ingredientsNeededText = this.add.text(0, 15, '', {
        fontSize: '14px', color: '#ad8762', fontFamily: 'Outfit'
    }).setOrigin(0.5);
    this.orderBubble.add([bubbleBg, this.orderText, this.ingredientsNeededText]);

    // UI - Barra de Tempo
    this.timerBg = this.add.rectangle(600, 195, 300, 10, 0xeeeeee).setStrokeStyle(2, 0xfc8eac);
    this.timerBar = this.add.rectangle(450, 195, 300, 10, 0xfc8eac).setOrigin(0, 0.5);
    this.timerBar.setVisible(false);
    this.timerBg.setVisible(false);

    // SISTEMA DE PUZZLE
    this.puzzleCost = 200;
    this.puzzlePieces = [];
    const puzzleX = 600;
    const puzzleY = 345;
    const imgWidth = 380;
    const imgHeight = 240;
    const cols = 4;
    const rows = 3;
    const pieceW = imgWidth / cols;
    const pieceH = imgHeight / rows;

    // Moldura do Puzzle
    this.add.rectangle(puzzleX, puzzleY, imgWidth + 10, imgHeight + 10, 0x8d6e63, 0.2).setStrokeStyle(2, 0x8d6e63);

    this.puzzleCostText = this.add.text(600, 475, `Próxima peça: ${this.puzzleCost} pts`, {
        fontSize: '16px', color: '#8d6e63', fontFamily: 'Outfit', fontWeight: 'bold',
        backgroundColor: '#ffffffaa', padding: { x: 10, y: 5 }
    }).setOrigin(0.5).setDepth(30);

    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            let px = (puzzleX - imgWidth / 2) + (c * pieceW) + pieceW / 2;
            let py = (puzzleY - imgHeight / 2) + (r * pieceH) + pieceH / 2;

            let piece = this.add.sprite(px, py, 'puzzleFull').setDisplaySize(imgWidth, imgHeight);
            // Crop precisa ser baseado no tamanho original da imagem
            piece.setCrop(c * (piece.width / cols), r * (piece.height / rows), piece.width / cols, piece.height / rows);
            piece.setInteractive();
            piece.setTint(0x333333); // Tons de cinza
            piece.setData('unlocked', false);

            piece.on('pointerdown', () => {
                if (piece.getData('unlocked')) return;
                if (this.kitchen.score >= this.puzzleCost) {
                    this.kitchen.score -= this.puzzleCost;
                    this.scoreText.setText(`Score: ${this.kitchen.score}`);
                    piece.clearTint();
                    piece.setData('unlocked', true);
                    this.puzzleCost *= 2;
                    this.puzzleCostText.setText(`Próxima peça: ${this.puzzleCost} pts`);
                    this.sound.play('collect', { volume: 0.4, detune: 500 }); // Efeito sonoro diferente
                } else {
                    this.cameras.main.shake(100, 0.002);
                }
            });
            this.puzzlePieces.push(piece);
        }
    }

    // Inicializar Cozinha
    this.kitchen = new Kitchen(this);
    this.kitchen.updateInventoryUI();

    // Bancada de Entrega
    let counter = this.add.rectangle(600, 520, 200, 50, 0x8d6e63).setInteractive();
    this.add.text(600, 520, 'ENTREGAR', { color: '#fff', fontFamily: 'Outfit' }).setOrigin(0.5);

    counter.on('pointerdown', () => {
        if (!this.match3.canMove) return;
        if (this.kitchen.tryCompleteOrder()) {
            this.scoreText.setText(`Score: ${this.kitchen.score}`);
            this.cameras.main.shake(100, 0.005);
        }
    });

    this.events.on('order-failed', () => {
        this.cameras.main.flash(300, 255, 0, 0, 0.5);
        this.updateLivesUI();
        this.hurryUpPlayed = false;
    });

    this.events.on('ingredient-collected', () => {
        this.sound.play('collect', { volume: 0.6 });
    });

    this.startGame = () => {
        this.match3.canMove = true;
        this.kitchen.spawnOrder();
        this.tweens.add({
            targets: this.gameTitle,
            y: 50,
            scale: 0.6,
            duration: 800,
            ease: 'Power2'
        });
        if (!this.musicStarted) {
            this.sound.play('bgMusic', { loop: true, volume: 0.5 });
            this.musicStarted = true;
        }
    };

    const startBtn = document.getElementById('start-btn');
    if (startBtn) {
        startBtn.onclick = () => {
            startBtn.style.display = 'none';
            document.getElementById('loading-screen').style.display = 'none';
            this.startGame();
        };
    }
}

function update() {
    if (this.kitchen && this.kitchen.orderTimer) {
        this.timerBar.setVisible(true);
        this.timerBg.setVisible(true);
        let progress = this.kitchen.orderTimer.getProgress();
        this.timerBar.width = 300 * (1 - progress);
        let remainingTime = this.kitchen.baseOrderTime * (1 - progress);
        let hurryThreshold = Math.min(5000, this.kitchen.baseOrderTime * 0.3);
        if (remainingTime <= hurryThreshold && !this.hurryUpPlayed) {
            this.sound.play('hurryUp', { volume: 0.7 });
            this.hurryUpPlayed = true;
        }
        if (progress > 0.8) this.timerBar.setFillStyle(0xff0000);
        else this.timerBar.setFillStyle(0xfc8eac);
    } else {
        this.timerBar.setVisible(false);
        this.timerBg.setVisible(false);
    }
}

Phaser.Scene.prototype.updateOrderUI = function (order) {
    if (!order) return;
    this.orderText.setText(`Pedido: ${order.name}`);
    let ingredientsText = "";
    for (let ing in order.ingredients) {
        ingredientsText += `${ing} (${order.ingredients[ing]}) `;
    }
    this.ingredientsNeededText.setText(`Precisa: ${ingredientsText}`);
};

Phaser.Scene.prototype.updateLivesUI = function () {
    let hearts = "";
    for (let i = 0; i < 3; i++) {
        hearts += (i < this.kitchen.lives) ? "🐾" : "🖤";
    }
    this.livesText.setText(hearts);
};
