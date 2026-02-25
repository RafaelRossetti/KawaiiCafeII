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
        this.setupEventListeners();
        this.spawnOrder();
    }

    setupEventListeners() {
        this.scene.events.on('ingredient-collected', (type) => {
            this.inventory[type]++;
            this.updateInventoryUI();
        });
    }

    updateInventoryUI() {
        // Esta função será chamada para atualizar o rodapé
        if (this.scene.inventoryText) {
            let text = `📦 Inv: `;
            for (let key in this.inventory) {
                text += `${key.charAt(0).toUpperCase()}: ${this.inventory[key]} `;
            }
            this.scene.inventoryText.setText(text);
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
