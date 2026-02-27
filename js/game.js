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

    // Listener de Progresso de Carregamento
    const loadingText = document.getElementById('loading-text');
    this.load.on('progress', (value) => {
        if (loadingText) {
            loadingText.innerText = `Preparando os ingredientes... ${Math.round(value * 100)}%`;
        }
    });

    this.load.on('complete', () => {
        if (loadingText) {
            loadingText.innerText = 'Pronto! Vamos cozinhar? 🐾';
        }
    });
}

function create() {
    // Background Cozinha
    this.add.rectangle(600, 300, 600, 600, 0xffebf0);
    this.add.grid(600, 300, 500, 500, 50, 50, 0xffffff, 0.1);

    // Painel Match-3 com visual refinado
    this.add.rectangle(150, 300, 300, 600, 0x9575cd);
    this.add.rectangle(150, 300, 280, 580, 0x7e57c2, 0.3).setStrokeStyle(4, 0xffffff, 0.5);

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

    // Fundo para o Inventário
    let invBg = this.add.graphics();
    invBg.fillStyle(0xffffff, 0.5);
    invBg.fillRoundedRect(310, 530, 460, 60, 15);
    invBg.lineStyle(2, 0x8d6e63, 0.3);
    invBg.strokeRoundedRect(310, 530, 460, 60, 15);
    invBg.setDepth(15);

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

    // Adicionar um ícone de estrela ao Score
    this.add.text(15, 20, '⭐', { fontSize: '24px' }).setDepth(31).setOrigin(0, 0.5).setX(5);

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
    this.puzzleCost = 10;
    this.puzzlePieces = [];
    const puzzleX = 600;
    const puzzleY = 320;
    const imgWidth = 500;
    const imgHeight = 280;
    const cols = 6;
    const rows = 2;
    const pieceW = imgWidth / cols;
    const pieceH = imgHeight / rows;

    // Dimensões da textura original
    const puzzleTexture = this.textures.get('puzzleFull').getSourceImage();
    const tw = puzzleTexture.width;
    const th = puzzleTexture.height;

    // Fundo do Puzzle
    this.add.rectangle(puzzleX, puzzleY, imgWidth + 4, imgHeight + 4, 0xfff0f5, 1).setStrokeStyle(2, 0x8d6e63);

    this.puzzleCostText = this.add.text(600, 490, `Próxima peça: ${this.puzzleCost} pts`, {
        fontSize: '16px', color: '#8d6e63', fontFamily: 'Outfit', fontWeight: 'bold',
        backgroundColor: '#ffffffaa', padding: { x: 10, y: 5 }
    }).setOrigin(0.5).setDepth(30);

    // Loop para criar as peças via RenderTexture — sem distorção nem fendas
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            const cellX = (puzzleX - imgWidth / 2) + (c * pieceW);
            const cellY = (puzzleY - imgHeight / 2) + (r * pieceH);
            const cellW = Math.round(pieceW);
            const cellH = Math.round(pieceH);

            // Fragmento correspondente na textura original
            const srcX = (c / cols) * tw;
            const srcY = (r / rows) * th;
            const srcW = tw / cols;
            const srcH = th / rows;

            // Escala para que srcW pixels da textura caibam em cellW pixels na tela
            const scaleX = cellW / srcW;
            const scaleY = cellH / srcH;

            // RenderTexture com o tamanho exato da célula
            const rt = this.add.renderTexture(cellX, cellY, cellW, cellH).setOrigin(0, 0);

            // Desenha a imagem inteira deslocada e escalada de modo que
            // apenas o fragmento correto apareça dentro do domínio do RenderTexture
            rt.beginDraw();
            rt.batchDraw('puzzleFull', -srcX * scaleX, -srcY * scaleY, scaleX, scaleY);
            rt.endDraw();

            rt.setAlpha(0.3); // bloqueada = escurecida
            rt.setData('unlocked', false);
            rt.setInteractive(new Phaser.Geom.Rectangle(0, 0, cellW, cellH), Phaser.Geom.Rectangle.Contains);

            rt.on('pointerdown', () => {
                if (rt.getData('unlocked')) return;
                if (this.kitchen.score >= this.puzzleCost) {
                    this.kitchen.score -= this.puzzleCost;
                    this.scoreText.setText(`Score: ${this.kitchen.score}`);
                    rt.setAlpha(1);
                    rt.setData('unlocked', true);
                    this.puzzleCost *= 2;
                    this.puzzleCostText.setText(`Próxima peça: ${this.puzzleCost} pts`);
                    this.sound.play('collect', { volume: 0.4, detune: 500 });
                } else {
                    this.cameras.main.shake(100, 0.002);
                }
            });

            this.puzzlePieces.push(rt);
        }
    }

    // Sem linhas divisórias — as peças encostam perfeitamente

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

    this.events.on('order-complete', () => {
        this.hurryUpPlayed = false; // Resetar para o próximo pedido
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
        startBtn.style.display = 'block'; // Mostrar o botão quando o Phaser estiver pronto
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
