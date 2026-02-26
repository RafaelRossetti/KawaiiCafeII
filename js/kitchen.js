class Kitchen {
    constructor(scene) {
        this.scene = scene;
        this.inventory = {
            coffee: 0,
            milk: 0,
            strawberry: 0,
            tea: 0,
            sugar: 0
        };
        this.currentOrder = null;
        this.score = 0;
        this.lives = 3;
        this.orderTimer = null;
        this.baseOrderTime = 15000; // 15 segundos iniciais
        this.completedOrdersCount = 0;
        this.setupEventListeners();
        // spawnOrder será chamado quando o jogo iniciar oficialmente
    }

    setupEventListeners() {
        this.scene.events.on('ingredient-collected', (type) => {
            this.inventory[type]++;
            this.updateInventoryUI();
        });
    }

    updateInventoryUI() {
        // Atualiza os textos individuais ao lado de cada ícone
        if (this.scene.inventoryTexts) {
            for (let key in this.inventory) {
                if (this.scene.inventoryTexts[key]) {
                    this.scene.inventoryTexts[key].setText(this.inventory[key]);
                }
            }
        }
    }

    spawnOrder() {
        const recipes = [
            { name: 'Latte de Morango', ingredients: { coffee: 1, milk: 1, strawberry: 1 } },
            { name: 'Chá Doce', ingredients: { tea: 1, sugar: 1 } },
            { name: 'Café com Leite', ingredients: { coffee: 1, milk: 1 } },
            { name: 'Morango com Açúcar', ingredients: { strawberry: 2, sugar: 1 } }
        ];

        this.currentOrder = Phaser.Utils.Array.GetRandom(recipes);
        this.scene.updateOrderUI(this.currentOrder);
        this.scene.events.emit('order-spawned');

        // Iniciar timer com tempo progressivo
        if (this.orderTimer) this.orderTimer.remove();
        this.orderTimer = this.scene.time.delayedCall(this.baseOrderTime, () => {
            this.failOrder();
        });
    }

    failOrder() {
        if (!this.currentOrder) return;

        this.lives--;
        this.scene.events.emit('order-failed');

        // Efeito visual no balão de pedido
        if (this.scene.orderBubble) {
            let bg = this.scene.orderBubble.list[0];
            bg.setFillStyle(0xffcdd2); // Rosa/Vermelho claro
            bg.setStrokeStyle(6, 0xff0000); // Borda vermelha forte

            this.scene.tweens.add({
                targets: this.scene.orderBubble,
                x: '+=10',
                duration: 50,
                yoyo: true,
                repeat: 5,
                onComplete: () => {
                    this.scene.tweens.add({
                        targets: this.scene.orderBubble,
                        alpha: 0,
                        scale: 0.5,
                        duration: 300,
                        onComplete: () => {
                            bg.setFillStyle(0xffffff); // Reset
                            bg.setStrokeStyle(4, 0xfc8eac); // Reset
                            this.scene.orderBubble.alpha = 1;
                            this.scene.orderBubble.scale = 1;
                            this.spawnOrder();
                        }
                    });
                }
            });
        } else {
            this.spawnOrder();
        }

        if (this.lives <= 0) {
            alert("Game Over! Suas vidas acabaram.");
            location.reload();
        }
    }

    tryCompleteOrder() {
        let canComplete = true;
        for (let ing in this.currentOrder.ingredients) {
            if (this.inventory[ing] < this.currentOrder.ingredients[ing]) {
                canComplete = false;
                break;
            }
        }

        if (canComplete) {
            for (let ing in this.currentOrder.ingredients) {
                this.inventory[ing] -= this.currentOrder.ingredients[ing];
            }
            this.score += 100;
            if (this.orderTimer) {
                this.orderTimer.remove();
                this.orderTimer = null;
            }

            // Progressão de dificuldade
            this.completedOrdersCount++;
            if (this.completedOrdersCount % 5 === 0) {
                // Diminuir 1 segundo (mínimo de 5 segundos para não ficar impossível)
                this.baseOrderTime = Math.max(5000, this.baseOrderTime - 1000);
                console.log(`Dificuldade aumentada! Novo tempo: ${this.baseOrderTime / 1000}s`);

                // Feedback visual de nível subindo
                this.scene.cameras.main.flash(200, 255, 255, 255, 0.3);
            }

            this.updateInventoryUI();
            this.scene.events.emit('order-complete');
            this.spawnOrder();
            return true;
        }
        return false;
    }
}

class BearPlayer extends Phaser.GameObjects.Container {
    constructor(scene, x, y, type) {
        super(scene, x, y);
        this.scene = scene;
        this.type = type; // 'milk' ou 'mocha'

        let color = (type === 'milk') ? 0xffffff : 0x8d6e63;
        let body = scene.add.circle(0, 0, 30, color);
        let earsL = scene.add.circle(-20, -25, 12, color);
        let earsR = scene.add.circle(20, -25, 12, color);
        let face = scene.add.circle(0, 5, 20, 0xf5f5f5);
        let nose = scene.add.circle(0, 5, 5, 0x333333);
        let eyeL = scene.add.circle(-10, -5, 4, 0x333333);
        let eyeR = scene.add.circle(10, -5, 4, 0x333333);

        this.add([earsL, earsR, body, face, eyeL, eyeR, nose]);
        scene.add.existing(this);

        this.moveSpeed = 4;
        this.targetX = x;
        this.targetY = y;
    }

    update() {
        // Movimentação simples para o target
        let dx = this.targetX - this.x;
        let dy = this.targetY - this.y;

        if (Math.abs(dx) > 5) this.x += Math.sign(dx) * this.moveSpeed;
        if (Math.abs(dy) > 5) this.y += Math.sign(dy) * this.moveSpeed;
    }

    moveTo(x, y) {
        this.targetX = x;
        this.targetY = y;
    }
}
