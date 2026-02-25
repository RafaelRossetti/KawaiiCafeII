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
    // Assets serão carregados aqui
}

function create() {
    // Background Cozinha
    this.add.rectangle(600, 300, 600, 600, 0xffebf0);
    this.add.grid(600, 300, 500, 500, 50, 50, 0xffffff, 0.1);

    // Painel Match-3 (Cor alterada para roxo conforme pedido)
    this.add.rectangle(150, 300, 300, 600, 0x9575cd);
    this.match3 = new Match3(this, 10, 150, 6, 6, 45);
    this.match3.canMove = false; // Bloqueado até iniciar

    // Personagem (Mocha)
    this.player = new BearPlayer(this, 600, 400, 'mocha');

    // UI - Inventário Rodapé
    this.inventoryText = this.add.text(320, 560, '', {
        fontSize: '18px',
        color: '#6f4e37',
        fontFamily: 'Outfit',
        backgroundColor: '#fff',
        padding: { x: 10, y: 5 }
    });

    // UI - Score
    this.scoreText = this.add.text(20, 20, 'Score: 0', {
        fontSize: '24px',
        color: '#fff',
        backgroundColor: '#fc8eac',
        padding: { x: 10, y: 5 }
    });

    // UI - Vidas (Rótulo)
    this.add.text(170, 15, 'VIDAS', {
        fontSize: '18px',
        color: '#fff',
        backgroundColor: '#9575cd',
        padding: { x: 45, y: 2 },
        fontWeight: 'bold'
    });

    // UI - Vidas (Ícones abaixo do rótulo)
    this.livesText = this.add.text(170, 40, '🐾🐾🐾', {
        fontSize: '24px',
        color: '#fff',
        backgroundColor: '#9575cd',
        padding: { x: 26, y: 5 }
    });

    // UI - Pedido
    this.orderBubble = this.add.container(600, 150);
    let bubbleBg = this.add.rectangle(0, 0, 300, 100, 0xffffff, 0.9).setStrokeStyle(4, 0xfc8eac);
    this.orderText = this.add.text(0, -10, 'Aguardando Pedido...', {
        fontSize: '20px',
        color: '#8d6e63',
        fontFamily: 'Outfit',
        fontWeight: 'bold'
    }).setOrigin(0.5);
    this.ingredientsNeededText = this.add.text(0, 20, '', {
        fontSize: '16px',
        color: '#ad8762',
        fontFamily: 'Outfit'
    }).setOrigin(0.5);
    this.orderBubble.add([bubbleBg, this.orderText, this.ingredientsNeededText]);

    // Inicializar Cozinha (Movido para cá para garantir que a UI exista)
    this.kitchen = new Kitchen(this);
    this.kitchen.updateInventoryUI();

    // Bancada de Entrega
    let counter = this.add.rectangle(600, 500, 200, 60, 0x8d6e63).setInteractive();
    this.add.text(600, 500, 'ENTREGAR', { color: '#fff' }).setOrigin(0.5);

    counter.on('pointerdown', () => {
        if (!this.match3.canMove) return; // Só entrega se o jogo estiver ativo
        this.player.moveTo(600, 480);
        this.time.delayedCall(500, () => {
            if (this.kitchen.tryCompleteOrder()) {
                this.scoreText.setText(`Score: ${this.kitchen.score}`);
                this.cameras.main.shake(100, 0.005);
            }
        });
    });

    // Evento de Falha no Pedido
    this.events.on('order-failed', () => {
        this.cameras.main.flash(300, 255, 0, 0, 0.5);
        this.updateLivesUI();
    });

    // Gerenciamento do Botão de Início
    console.log("Phaser create() iniciado com sucesso!");
    const startBtn = document.getElementById('start-btn');
    const loadingText = document.getElementById('loading-text');

    if (startBtn && loadingText) {
        // Versão Nova do HTML detectada
        loadingText.style.display = 'none';
        startBtn.style.display = 'inline-block';

        startBtn.onclick = () => {
            document.getElementById('loading-screen').style.display = 'none';
            this.match3.canMove = true;
            this.kitchen.spawnOrder();
            console.log("Jogo iniciado pelo usuário!");
        };
    } else {
        // Fallback: se o HTML antigo ainda estiver carregado, inicia o jogo em 3 segundos sozinho
        console.warn("Elementos do botão de início não encontrados. Verifique se o index.html foi atualizado.");
        setTimeout(() => {
            const screen = document.getElementById('loading-screen');
            if (screen) {
                screen.style.display = 'none';
                this.match3.canMove = true;
                this.kitchen.spawnOrder();
            }
        }, 3000);
    }
}

function update() {
    if (this.player) {
        this.player.update();
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
