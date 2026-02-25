class Match3 {
    constructor(scene, x, y, rows, cols, size) {
        this.scene = scene;
        this.x = x;
        this.y = y;
        this.rows = rows;
        this.cols = cols;
        this.size = size;
        this.grid = [];
        this.selectedTile = null;
        this.canMove = true;
        this.types = ['coffee', 'milk', 'strawberry', 'tea', 'sugar'];
        this.colors = {
            coffee: 0x6f4e37,
            milk: 0xffffff,
            strawberry: 0xff4081,
            tea: 0x4caf50,
            sugar: 0xe0e0e0
        };

        this.init();
    }

    init() {
        for (let r = 0; r < this.rows; r++) {
            this.grid[r] = [];
            for (let c = 0; c < this.cols; c++) {
                let type = Phaser.Utils.Array.GetRandom(this.types);
                let tile = this.createTile(r, c, type);
                this.grid[r][c] = tile;
            }
        }
    }

    createTile(r, c, type) {
        let x = this.x + c * this.size + this.size / 2;
        let y = this.y + r * this.size + this.size / 2;

        let container = this.scene.add.container(x, y);
        let bg = this.scene.add.rectangle(0, 0, this.size - 4, this.size - 4, this.colors[type], 1).setInteractive();
        bg.setStrokeStyle(2, 0xffffff);

        // Simbolo simples (coração/círculo para ficar fofo)
        let icon = this.scene.add.circle(0, 0, this.size / 4, 0x000000, 0.2);

        container.add([bg, icon]);
        container.setData('row', r);
        container.setData('col', c);
        container.setData('type', type);

        bg.on('pointerdown', () => this.handleTileClick(container));

        return container;
    }

    handleTileClick(tile) {
        if (!this.canMove) return;

        if (this.selectedTile) {
            if (this.isAdjacent(this.selectedTile, tile)) {
                this.swapTiles(this.selectedTile, tile);
            } else {
                this.deselectTile();
                this.selectTile(tile);
            }
        } else {
            this.selectTile(tile);
        }
    }

    selectTile(tile) {
        this.selectedTile = tile;
        tile.list[0].setStrokeStyle(4, 0xffeb3b);
        this.scene.tweens.add({
            targets: tile,
            scale: 1.1,
            duration: 100
        });
    }

    deselectTile() {
        if (this.selectedTile) {
            this.selectedTile.list[0].setStrokeStyle(2, 0xffffff);
            this.scene.tweens.add({
                targets: this.selectedTile,
                scale: 1.0,
                duration: 100
            });
            this.selectedTile = null;
        }
    }

    isAdjacent(t1, t2) {
        let r1 = t1.getData('row');
        let c1 = t1.getData('col');
        let r2 = t2.getData('row');
        let c2 = t2.getData('col');
        return (Math.abs(r1 - r2) + Math.abs(c1 - c2)) === 1;
    }

    swapTiles(t1, t2) {
        this.canMove = false;
        let r1 = t1.getData('row'), c1 = t1.getData('col');
        let r2 = t2.getData('row'), c2 = t2.getData('col');

        this.scene.tweens.add({
            targets: t1,
            x: t2.x,
            y: t2.y,
            duration: 200,
            onComplete: () => {
                this.grid[r2][c2] = t1;
                t1.setData('row', r2);
                t1.setData('col', c2);
            }
        });

        this.scene.tweens.add({
            targets: t2,
            x: t1.x,
            y: t1.y,
            duration: 200,
            onComplete: () => {
                this.grid[r1][c1] = t2;
                t2.setData('row', r1);
                t2.setData('col', c1);
                this.checkMatches();
            }
        });

        this.deselectTile();
    }

    checkMatches() {
        let matches = [];
        // Check rows
        for (let r = 0; r < this.rows; r++) {
            let count = 1;
            for (let c = 1; c < this.cols; c++) {
                if (this.grid[r][c].getData('type') === this.grid[r][c - 1].getData('type')) {
                    count++;
                } else {
                    if (count >= 3) {
                        for (let i = 1; i <= count; i++) matches.push(this.grid[r][c - i]);
                    }
                    count = 1;
                }
            }
            if (count >= 3) for (let i = 1; i <= count; i++) matches.push(this.grid[r][this.cols - i]);
        }
        // Check cols
        for (let c = 0; c < this.cols; c++) {
            let count = 1;
            for (let r = 1; r < this.rows; r++) {
                if (this.grid[r][c].getData('type') === this.grid[r - 1][c].getData('type')) {
                    count++;
                } else {
                    if (count >= 3) {
                        for (let i = 1; i <= count; i++) matches.push(this.grid[r - i][c]);
                    }
                    count = 1;
                }
            }
            if (count >= 3) for (let i = 1; i <= count; i++) matches.push(this.grid[this.rows - i][c]);
        }

        if (matches.length > 0) {
            this.handleMatches(matches);
        } else {
            this.canMove = true;
        }
    }

    handleMatches(matches) {
        // Remove duplicates
        matches = [...new Set(matches)];

        matches.forEach(tile => {
            let type = tile.getData('type');
            this.scene.events.emit('ingredient-collected', type);

            this.scene.tweens.add({
                targets: tile,
                scale: 0,
                alpha: 0,
                duration: 200,
                onComplete: () => {
                    tile.destroy();
                }
            });
        });

        this.scene.time.delayedCall(250, () => this.refillGrid());
    }

    refillGrid() {
        // Simple refill logic
        for (let c = 0; c < this.cols; c++) {
            let emptySpaces = 0;
            for (let r = this.rows - 1; r >= 0; r--) {
                if (!this.grid[r][c].active) {
                    emptySpaces++;
                } else if (emptySpaces > 0) {
                    let tile = this.grid[r][c];
                    let newRow = r + emptySpaces;
                    this.grid[newRow][c] = tile;
                    tile.setData('row', newRow);
                    this.scene.tweens.add({
                        targets: tile,
                        y: this.y + newRow * this.size + this.size / 2,
                        duration: 200
                    });
                    this.grid[r][c] = { active: false };
                }
            }
            for (let i = 0; i < emptySpaces; i++) {
                let r = emptySpaces - i - 1;
                let type = Phaser.Utils.Array.GetRandom(this.types);
                let tile = this.createTile(-i - 1, c, type);
                this.grid[r][c] = tile;
                tile.setData('row', r);
                this.scene.tweens.add({
                    targets: tile,
                    y: this.y + r * this.size + this.size / 2,
                    duration: 200
                });
            }
        }

        this.scene.time.delayedCall(250, () => this.checkMatches());
    }
}
