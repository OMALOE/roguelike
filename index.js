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
    if (!this.tileEl) {
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
    }

    this.tileEl.replaceChildren();
    this.tileEl.classList.remove("tileP");
    this.tileEl.classList.remove("tileE");
    this.tileEl.classList.remove("tileHP");
    this.tileEl.classList.remove("tileSW");

    if (this.entity) {
      this.tileEl.classList.add(this.entity.type);
      this.tileEl.appendChild(this.entity.healthBar);
    }

    if (this.item) {
      this.tileEl.classList.add(this.item.type);
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

    console.log(tile);

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
    field[this.Y][this.X].replaceChildren();
    field[this.Y][this.X].className = "tile " + this.currentTile;
  }

  dealDamage() {
    console.log("DAMAGE");
    for (const e of entities) {
      console.log(Math.abs(e.X - this.X), Math.abs(e.Y - this.Y));

      if (e.X === this.X && e.Y === this.Y) continue;

      if (Math.abs(e.X - this.X) <= 1 && Math.abs(e.Y - this.Y) <= 1) {
        e.setHealth(-this.damage);
      }
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

    if (nextTile.item && this.type === "tileP") {
      nextTile.item.affectEntity(this);
      nextTile.item = null;
    }

    this.currentTile.renderTile();
    nextTile.renderTile();
    this.currentTile = nextTile;
  }
}

class Hero extends Entity {
  constructor(coordX, coordY, type, tile) {
    super(coordX, coordY, type, tile);

    this.initMovement();
  }

  initMovement() {
    window.addEventListener("keydown", (e) => {
      switch (e.key) {
        case "w":
          this.move(0, -1);
          break;
        case "a":
          this.move(-1, 0);
          break;
        case "s":
          this.move(0, 1);
          break;
        case "d":
          this.move(1, 0);
          break;
        case " ":
          this.dealDamage();
          break;
        default:
          break;
      }
    });
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
    this.placeItems(new Item("tileSW", "buff", 10, "damage"), 2);

    this.placeHero();

    this.renderField();
  }

  placeEnemies() {
    //отфильтровать тайлы не стены и назначить на рандомные по индексу
    let emptyTiles = this._getNEmptyTiles(10);

    for (const tile of emptyTiles) {
      this._field[randomTile.coords.y][randomTile.coords.x].tileType = tileName;
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
    // return temp;
  }

  moveEntities() {
    // отфильтровать все тайлы на которых есть ентити
    //сделать интервал по которому все ентити раз в 500мс передвигаются
    // занулить ентити тайла если убили
  }

  renderField() {
    //сопоставить рендируемый тайл с соответствующим классом и отрендерить
    $(".field")[0].replaceChildren();
    for (const row of this._field) {
      for (const tile of row) {
        tile.renderTile();
      }
    }
    console.log(this._field);
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

function generateField() {
  let field = [];

  //   for (let i = 0; i < 24; i++) {
  //     let tile = document.createElement("div");
  //     tile.classList.add("tile");
  //     field.push(new Array(40).fill(tile));
  //   }

  //   console.log(field);
  for (let ri = 0; ri < 24; ri++) {
    let row = [];
    for (let ti = 0; ti < 40; ti++) {
      let tile = document.createElement("div");
      tile.classList.add("tileW");
      tile.classList.add("tile");
      tile.setAttribute("data-coords", `${ti};${ri}`);
      tile.style.left = ti * 50 + "px";
      tile.style.top = ri * 50 + "px";
      row.push(tile);
    }
    field.push(row);
  }

  for (let i = 0; i < getRandomNumber(5, 10); i++) {
    field = generateRoom(field);
  }

  field = generatePaths(field);

  field = placeItems(field, "tileHP", 10);
  field = placeItems(field, "tileSW", 2);

  return field;
}

// let field = generateField();

// let entities = initEntities(field, 11);

// renderField();

function generateRoom(field = []) {
  let sizeX = getRandomNumber(3, 8);
  let sizeY = getRandomNumber(3, 8);

  let locationX = getRandomNumber(0, 39 - sizeX); //вычитание чтоб точно убедиться, что комнаты будут нужного размера
  let locationY = getRandomNumber(0, 23 - sizeY);

  for (let ri = 0; ri < sizeY; ri++) {
    for (let ti = 0; ti < sizeX; ti++) {
      if (
        ri + locationY > field.length - 1 ||
        ti + locationX > field[0].length - 1
      ) {
        continue;
      }
      let pathTile = field[ri + locationY][ti + locationX];
      pathTile.className = "tile";
    }
  }

  return field;
}

function generatePaths(field = []) {
  let pathsNum = getRandomNumber(3, 5);

  //по вертикали
  for (let i = 0; i < pathsNum; i++) {
    let coord = getRandomNumber(1, 38);
    for (let i = 0; i < field.length; i++) {
      let path = field[i][coord];
      path.className = "tile";
    }
  }

  //по горизонтали
  pathsNum = getRandomNumber(3, 5);
  for (let i = 0; i < pathsNum; i++) {
    let coord = getRandomNumber(1, 22);
    for (let i = 0; i < field.length; i++) {
      for (let n = 0; n < field[0].length; n++) {
        let path = field[coord][n];
        path.className = "tile";
      }
    }
  }

  return field;
}

function placeItems(field, tileName, count) {
  for (let i = 0; i < count; i++) {
    let found = false;
    while (!found) {
      let coordX = getRandomNumber(0, 39);
      let coordY = getRandomNumber(0, 23);

      if (field[coordY][coordX].className !== "tile") continue;

      field[coordY][coordX].classList.add(tileName);
      found = true;
    }
  }

  return field;
}

function initEntities(field, count) {
  let heroPlaced = false;
  let entities = [];

  for (let i = 0; i < count; i++) {
    let found = false;
    while (!found) {
      let coordX = getRandomNumber(0, 39);
      let coordY = getRandomNumber(0, 23);

      if (field[coordY][coordX].className !== "tile") continue;
      if (!heroPlaced) {
        entities.push(new Hero(coordX, coordY, "tileP"));
        heroPlaced = true;
      } else {
        entities.push(new Entity(coordX, coordY, "tileE"));
      }

      found = true;
    }
  }

  return entities;
}

function getRandomNumber(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function renderField() {
  for (const row of field) {
    for (const tile of row) {
      $(".field")[0].append(tile);
    }
  }
}
