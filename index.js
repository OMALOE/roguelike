class Tile {
  tileType = "";
  entity = null;
  coords = { x: 0, y: 0 };
  item = null;
  tileEl = null;

  constructor(type, coords, entity = null, item = null) {
    this.tileType = type;
    this.coords = coords;
    this.entity = entity;
    this.item = item;
  }

  renderTile() {
    // if (!this.tileEl) {
    this.tileEl = document.createElement("div");
    this.tileEl.classList.add("tile");
    this.tileEl.classList.add(this.tileType);
    this.tileEl.setAttribute(
      "data-coords",
      `${this.coords.x};${this.coords.y}`
    );
    this.tileEl.style.left = this.coords.x * 50 + "px";
    this.tileEl.style.top = this.coords.y * 50 + "px";
    $(".field")[0].append(this.tileEl);
    // }

    // this.tileEl.replaceChildren();
    // this.tileEl.classList.remove("tileP");
    // this.tileEl.classList.remove("tileE");
    // this.tileEl.classList.remove("tileHP");
    // this.tileEl.classList.remove("tileSW");
    if (this.item) {
      this.tileEl.classList.add(this.item.type);
    }

    if (this.entity) {
      this.tileEl.classList.add(this.entity.type);
      this.tileEl.appendChild(this.entity.healthBar);
    }
  }
}

class Item {
  constructor(type, effect, effectAmount, affectedProp) {
    this.type = type;
    this.effect = effect;
    this.effectAmount = effectAmount;
    this.affectedProp = affectedProp;
  }

  affectEntity(entity) {
    // entity.setHealth(this.effectAmount);
    entity[this.affectedProp] = this.effectAmount;
  }
}

class Entity {
  currentTile = null;
  totalHealth = 100;
  _health = 100;
  healthBar = null;
  damage = 20;

  constructor(coordX, coordY, type, tile) {
    this.X = coordX;
    this.Y = coordY;
    this.tile = tile;
    this.type = type;

    this.currentTile = tile;

    let healthBar = document.createElement("div");
    healthBar.className = "health";
    this.healthBar = healthBar;

    this.setHealth(0);
  }

  placeEntity(x, y) {}

  set health(value) {
    this.setHealth(value);
  }

  setHealth(delta) {
    this._health += delta;

    if (this._health <= 0) {
      this._health = 0;
      this.destroyEntity();
    } else if (this._health > this.totalHealth) {
      this._health = this.totalHealth;
    }

    this.healthBar.style.width = (this._health / this.totalHealth) * 100 + "%";
  }

  destroyEntity() {
    let sound = new Audio("yoda.mp3");
    sound.play();
    this.currentTile.entity = null;
    this.currentTile.renderTile();

    if (this.type === "tileP") {
      alert("game over");
    }
  }

  dealDamage(target = "tileE") {
    const deltas = [
      { x: 1, y: 0 },
      { x: 1, y: 1 },
      { x: 1, y: -1 },

      { x: -1, y: 0 },
      { x: -1, y: 1 },
      { x: -1, y: -1 },

      { x: 0, y: 1 },
      { x: 0, y: -1 },
    ];

    for (const delta of deltas) {
      let enemy =
        game.field[this.currentTile.coords.y + delta.y][
          this.currentTile.coords.x + delta.x
        ].entity;

      if (!enemy || enemy.type !== target) continue;

      enemy.health = -this.damage;
    }
  }

  move(deltaX, deltaY) {
    let newCoordY = this.currentTile.coords.y + deltaY;
    let newCoordX = this.currentTile.coords.x + deltaX;

    if (newCoordY < 0 || newCoordY > 23) return;
    if (newCoordX < 0 || newCoordX > 39) return;

    let nextTile = game.field[newCoordY][newCoordX];
    if (nextTile.tileType === "tileW" || nextTile.entity) return;

    // this.Y = newCoordY;
    // this.X = newCoordX;
    // this.currentTile = field[this.Y][this.X].className.replace("tile", "");
    this.currentTile.entity = null;
    nextTile.entity = this;

    if (this.type === "tileE") {
      try {
        this.dealDamage("tileP");
      } catch (error) {}
    }

    // this.currentTile.renderTile();
    // nextTile.renderTile();
    this.currentTile = nextTile;
  }

  chaoticMovement() {
    this.move(getRandomNumber(-1, 1), getRandomNumber(-1, 1));
  }
}

class Hero extends Entity {
  constructor(coordX, coordY, type, tile) {
    super(coordX, coordY, type, tile);

    this.initMovement();
  }

  initMovement() {
    window.addEventListener("keydown", (e) => {
      e.preventDefault();
      switch (e.code) {
        case "KeyW":
          this.move(0, -1);
          break;
        case "KeyA":
          this.move(-1, 0);
          break;
        case "KeyS":
          this.move(0, 1);
          break;
        case "KeyD":
          this.move(1, 0);
          break;
        case "Space":
          this.dealDamage();
          break;
        default:
          break;
      }
    });
  }

  move(deltaX, deltaY) {
    let newCoordY = this.currentTile.coords.y + deltaY;
    let newCoordX = this.currentTile.coords.x + deltaX;

    if (newCoordY < 0 || newCoordY > 23) return;
    if (newCoordX < 0 || newCoordX > 39) return;

    let nextTile = game.field[newCoordY][newCoordX];
    if (nextTile.tileType === "tileW" || nextTile.entity) return;

    this.currentTile.entity = null;
    nextTile.entity = this;

    if (nextTile.item) {
      nextTile.item.affectEntity(this);
      nextTile.item = null;
    }

    if (this.type === "tileE") {
      this.dealDamage("tileP");
    }

    this.currentTile = nextTile;

    game.makeMove();
  }
}

class Game {
  _field = [];

  get field() {
    return this._field;
  }
  set field(value) {
    this._field = value;
    renderField(value);
  }

  init() {
    this.generateField();
    this.generateRooms();
    this.generatePaths();

    this.placeItems(new Item("tileHP", "buff", 20, "health"), 10);
    this.placeItems(new Item("tileSW", "buff", 30, "damage"), 2);

    this.placeHero();
    this.placeEnemies(10);

    this.renderField();
  }

  makeMove() {
    for (const row of this._field) {
      for (const tile of row) {
        if (tile.entity && tile.entity.type === "tileE") {
          tile.entity.chaoticMovement();
        }
      }
    }

    this.renderField();
  }

  placeEnemies(n) {
    //отфильтровать тайлы не стены и назначить на рандомные по индексу
    let emptyTiles = this._getNEmptyTiles(n);

    for (const tile of emptyTiles) {
      let entity = new Entity(tile.coords.x, tile.coords.y, "tileE", tile);
      this._field[tile.coords.y][tile.coords.x].entity = entity;
    }
  }

  placeHero() {
    let emptyTiles = this._getNEmptyTiles(1);

    this._field[emptyTiles[0].coords.y][emptyTiles[0].coords.x].entity =
      new Hero(
        emptyTiles[0].coords.x,
        emptyTiles[0].coords.y,
        "tileP",
        emptyTiles[0]
      );
  }

  placeItems(item, count) {
    //отфильтровать тайлы не стены и назначить на рандомные по индексу
    let emptyTiles = this._getNEmptyTiles(count);

    for (let i = 0; i < count; i++) {
      let randomTile = emptyTiles[i];

      this._field[randomTile.coords.y][randomTile.coords.x].item = item;
    }
  }

  _getNEmptyTiles(n) {
    let temp = [];
    for (const row of this._field) {
      let filtered = row.filter(
        (t, i) => t.tileType == "tileR" && t.entity === null && t.item === null
      );
      temp = [...temp, ...filtered];
    }
    let shuffled = temp.sort(() => 0.5 - Math.random());

    return shuffled.slice(0, n);
  }

  renderField() {
    //сопоставить рендируемый тайл с соответствующим классом и отрендерить
    $(".field")[0].replaceChildren();
    for (const row of this._field) {
      for (const tile of row) {
        tile.renderTile();
      }
    }
  }

  generateField() {
    let field = [];
    for (let ri = 0; ri < 24; ri++) {
      let row = [];
      for (let ti = 0; ti < 40; ti++) {
        let tile = new Tile("tileW", { x: ti, y: ri });

        row.push(tile);
      }
      field.push(row);
    }

    this._field = field;
  }

  generateRooms() {
    for (let i = 0; i < getRandomNumber(5, 10); i++) {
      let sizeX = getRandomNumber(3, 8);
      let sizeY = getRandomNumber(3, 8);

      let locationX = getRandomNumber(0, 39 - sizeX); //вычитание чтоб точно убедиться, что комнаты будут нужного размера внутри карты
      let locationY = getRandomNumber(0, 23 - sizeY);

      for (let ri = 0; ri < sizeY; ri++) {
        for (let ti = 0; ti < sizeX; ti++) {
          if (
            ri + locationY > this._field.length - 1 ||
            ti + locationX > this._field[0].length - 1
          ) {
            continue;
          }
          let pathTile = this._field[ri + locationY][ti + locationX];
          pathTile.tileType = "tileR";
        }
      }
    }
  }

  generatePaths() {
    let pathsNum = getRandomNumber(3, 5);

    //по вертикали
    for (let i = 0; i < pathsNum; i++) {
      let coord = getRandomNumber(1, 38);
      for (let i = 0; i < this._field.length; i++) {
        let path = this._field[i][coord];
        path.tileType = "tileR";
      }
    }

    //по горизонтали
    pathsNum = getRandomNumber(3, 5);
    for (let i = 0; i < pathsNum; i++) {
      let coord = getRandomNumber(1, 22);
      for (let i = 0; i < this._field.length; i++) {
        for (let n = 0; n < this._field[0].length; n++) {
          let path = this._field[coord][n];
          path.tileType = "tileR";
        }
      }
    }
  }
}

const game = new Game();
game.init();

function getRandomNumber(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
