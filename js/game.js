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
}

function create() {
    // Background Cozinha
    this.add.rectangle(600, 300, 600, 600, 0xffebf0);
    this.add.grid(600, 300, 500, 500, 50, 50, 0xffffff, 0.1);

    // Painel Match-3 (Cor alterada para roxo conforme pedido)
    this.add.rectangle(150, 300, 300, 600, 0x9575cd);
    this.match3 = new Match3(this, 10, 150, 6, 6, 45);
    this.match3.canMove = false; // Bloqueado até iniciar

    // Título Principal (Phaser) - Iniciado no centro
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

        let icon = this.add.image(x - 18, y, item.icon).setScale(0.06).setDepth(21);

        let textColor = (item.key === 'milk' || item.key === 'sugar') ? '#6f4e37' : '#ffffff';
        let text = this.add.text(x + 18, y, '0', {
            fontSize: '18px',
            color: textColor,
            fontFamily: 'Outfit',
            fontWeight: 'bold'
        }).setOrigin(0.5).setDepth(21);

        this.inventoryTexts[item.key] = text;
    });

    this.hurryUpPlayed = false;

    // UI - Score
    this.scoreText = this.add.text(15, 20, 'Score: 0', {
        fontSize: '20px', color: '#fff', backgroundColor: '#fc8eac', padding: { x: 8, y: 4 }, fontFamily: 'Outfit'
    });

    // UI - Vidas
    this.add.text(170, 15, 'VIDAS', { fontSize: '16px', color: '#fff', fontFamily: 'Outfit', fontWeight: 'bold' });
    this.livesText = this.add.text(170, 35, '🐾🐾🐾', { fontSize: '24px', color: '#fff', fontFamily: 'Outfit' });

    // UI - Pedido
    this.orderBubble = this.add.container(600, 150);
    let bubbleBg = this.add.rectangle(0, 0, 300, 100, 0xffffff, 0.9).setStrokeStyle(4, 0xfc8eac);
    this.orderText = this.add.text(0, -10, 'Aguardando Pedido...', {
        fontSize: '20px', color: '#8d6e63', fontFamily: 'Outfit', fontWeight: 'bold'
    }).setOrigin(0.5);
    this.ingredientsNeededText = this.add.text(0, 20, '', {
        fontSize: '16px', color: '#ad8762', fontFamily: 'Outfit'
    }).setOrigin(0.5);
    this.orderBubble.add([bubbleBg, this.orderText, this.ingredientsNeededText]);

    // UI - Barra de Tempo
    this.timerBg = this.add.rectangle(600, 220, 300, 12, 0xeeeeee).setStrokeStyle(2, 0xfc8eac);
    this.timerBar = this.add.rectangle(450, 220, 300, 12, 0xfc8eac).setOrigin(0, 0.5);
    this.timerBar.setVisible(false);
    this.timerBg.setVisible(false);

    // Inicializar Cozinha
    this.kitchen = new Kitchen(this);
    this.kitchen.updateInventoryUI();

    // Bancada de Entrega
    let counter = this.add.rectangle(600, 500, 200, 60, 0x8d6e63).setInteractive();
    this.add.text(600, 500, 'ENTREGAR', { color: '#fff' }).setOrigin(0.5);

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

    // Função para Iniciar Jogo (Shared logic)
    this.startGame = () => {
        this.match3.canMove = true;
        this.kitchen.spawnOrder();

        // Animando o título para cima do pedido (Posição final solicitada)
        this.tweens.add({
            targets: this.gameTitle,
            y: 60,
            scale: 0.7,
            duration: 800,
            ease: 'Power2'
        });

        if (!this.musicStarted) {
            this.sound.play('bgMusic', { loop: true, volume: 0.5 });
            this.musicStarted = true;
        }
    };

    // Gerenciamento do Botão de Início
    const startBtn = document.getElementById('start-btn');
    if (startBtn) {
        startBtn.style.display = 'inline-block';
        startBtn.onclick = () => {
            startBtn.style.display = 'none';
            document.getElementById('loading-screen').style.display = 'none';
            this.startGame();
        };
    } else {
        // Fallback robusto
        setTimeout(() => {
            const screen = document.getElementById('loading-screen');
            if (screen) screen.style.display = 'none';
            this.startGame();
        }, 2000);
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
