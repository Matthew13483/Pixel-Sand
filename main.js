const ctx = canvas.getContext('2d');

class Grid {
	constructor(width, height) {
		this.width = width;
		this.height = height;

		this.padding = 0;
		this.cellWidth = (canvas.width - this.padding) / this.width;
		this.offset = Math.floor(canvas.height - (this.height * canvas.width / this.width) + this.padding);

		this.cells = [];
		for (let y = 0; y < height; y++) {
			for (let x = 0; x < width; x++) {
				this.cells.push(new Cell(x, y, 0, this, this.cells));
			}
		}
		this.cells.forEach(cell => cell.getNeighbors());

		this.cells2U = new Set();
	}
	update() {
		let cells2U = [];
		this.cells.forEach(cell => {
			let update = cell.update();
			if (update) cells2U.push(...update);
		});
		this.cells2U.clear();
		cells2U.forEach(cell => {
			cell.v = cell.vf;
			cell.draw();
		});
	}
}

class Cell {
	constructor(x, y, v, grid, cells) {
		this.x = x;
		this.y = y;
		this.v = v;
		this.vf = v;
		this.grid = grid;
		this.cells = cells;
	}
	getNeighbors() {
		this.neighbors = [];
		[[0, -1, -1], [1, 0, -1], [2, 1, -1], [3, -1, 0], [5, 1, 0], [6, -1, 1], [7, 0, 1], [8, 1, 1]].forEach(pos => {
			let [dir, dx, dy] = pos;
			let nx = this.x + dx;
			let ny = this.y + dy;
			if (nx >= this.grid.width || nx < 0 || ny >= this.grid.height || ny < 0) return;
			this.neighbors.push({
				cell: this.cells[nx + ny * this.grid.width],
				dir: dir
			});
		});
	}
	neighbor(dir) {
		let n = this.neighbors.find(neighbor => neighbor.dir === dir)
		if (n) return n.cell;
	}
	update() {
		if (!this.v) return;
		
		let down = this.neighbor(7);
		if (!down) return;
		
		if (down.v === 0) {
			this.vf = 0;
			down.vf = this.v;
			return [this, down];
		}
		else {
			let ndlr = [[this.neighbor(6), this.neighbor(3)], [this.neighbor(8), this.neighbor(5)]].filter(n => n[0] && n[0].vf === 0 && n[1].vf === 0).map(n => n[0]);
			if (ndlr.length > 0) {
				let neig = ndlr[Math.floor(Math.random() * ndlr.length)];
				this.vf = 0;
				neig.vf = this.v;
				return [this, neig];
			}
		}
	}
	draw() {
		let x = Math.floor(this.x * this.grid.cellWidth) + this.grid.padding;
		let y = Math.floor(this.y * this.grid.cellWidth) + this.grid.padding + this.grid.offset;
		let w = Math.floor((this.x + 1) * this.grid.cellWidth) - Math.floor(this.x * this.grid.cellWidth) - this.grid.padding;
		let h = Math.floor((this.y + 1) * this.grid.cellWidth) - Math.floor(this.y * this.grid.cellWidth) - this.grid.padding;

		if (this.v === 0) {
			ctx.clearRect(x, y, w, h);
			return;
		}
		let r = colors[0][0] + (this.v - 1) * (colors[1][0] - colors[0][0]);
		let g = colors[0][1] + (this.v - 1) * (colors[1][1] - colors[0][1]);
		let b = colors[0][2] + (this.v - 1) * (colors[1][2] - colors[0][2]);
		ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
		ctx.fillRect(x, y, w, h);
	}
}

let size = 3;

let fillMode = true;
let fill = 1;
let df = 0.001;
let colors = [[192, 192, 112], [192, 112, 112]];

let width = 72;
let grid;

let c = 0;

function loop() {
	requestAnimationFrame(loop);

	/*if ((c++) % 1 == 0)*/ grid.update();
}


window.onload = () => {
	canvas.width = window.innerWidth;
	canvas.height = window.innerHeight - 50;

	let height = Math.floor((canvas.height / canvas.width) * width);
	grid = new Grid(width, height);

	loop();
};

function touchCanvas(x, y) {
	let gx = Math.floor(grid.width * x / canvas.width);
	let gy = Math.floor(grid.width * (y - 1 * grid.offset) / canvas.width);
	let update = cell => {
		if ((cell.v === 0 && fillMode) || (cell.v !== 0 && !fillMode)) {
			cell.v = cell.vf = fillMode ? fill : 0;
			/*grid.cells2U.add(cell);
			cell.allNeighbors().map(n => n.cell).forEach(cell => {
				grid.cells2U.add(cell);
			});*/
			cell.draw();
			if (fillMode) {
				fill += df;
				if (fill > 2) {
					fill = 2;
					df *= -1;
				}
				if (fill < 1) {
					fill = 1;
					df *= -1;
				}
			}
		}
	}
	let cell = grid.cells[gx + gy * grid.width];
	if (cell) {
		update(cell);
		if (size > 1) cell.neighbors.forEach(n => {
			let cell = n.cell;
			update(cell);
			if (size > 2) cell.neighbors.forEach(n => {
				let cell = n.cell;
				update(cell);
				if (size > 3) cell.neighbors.forEach(n => {
					let cell = n.cell;
					update(cell);
					if (size > 4) cell.neighbors.forEach(n => {
						let cell = n.cell;
						update(cell);
					
					});
				});
			});
		});
	}
}

let isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints;

canvas.addEventListener(isTouchDevice ? 'touchstart' : 'mousedown', handleStart);
canvas.addEventListener(isTouchDevice ? 'touchmove' : 'mousemove', handleMove);
canvas.addEventListener(isTouchDevice ? 'touchend' : 'mouseup', handleEnd);
canvas.addEventListener(isTouchDevice ? 'touchcancel' : '', handleCancel);

function handleStart(event) {
	event.preventDefault();
	if (isTouchDevice) {
		for (let i = 0; i < event.changedTouches.length; i++) {
			let touch = event.changedTouches.item(i);
			let x = touch.pageX - event.target.getBoundingClientRect().left;
			let y = touch.pageY - event.target.getBoundingClientRect().top;
			touchCanvas(x, y);
		}
	} else {
		let x = event.pageX - event.target.getBoundingClientRect().left;
		let y = event.pageY - event.target.getBoundingClientRect().top;
		touchCanvas(x, y);
	}
}

function handleMove(event) {
	event.preventDefault();
	if (isTouchDevice) {
		for (let i = 0; i < event.changedTouches.length; i++) {
			let touch = event.changedTouches.item(i);
			let x = touch.pageX - event.target.getBoundingClientRect().left;
			let y = touch.pageY - event.target.getBoundingClientRect().top;
			touchCanvas(x, y);
		}
	} else {
		let x = event.pageX - event.target.getBoundingClientRect().left;
		let y = event.pageY - event.target.getBoundingClientRect().top;
		touchCanvas(x, y);
	}
}

function handleEnd(event) {
	event.preventDefault();
	if (isTouchDevice) {
		for (let i = 0; i < event.changedTouches.length; i++) {
			let touch = event.changedTouches.item(i);
			
		}
	}
	else;
}

function handleCancel(event) {
	
}

s1.onclick = () => {
	c1.style.width = c1.style.height = '30px';
	c2.style.width = c2.style.height = '20px';
	fillMode = true;
}

s2.onclick = () => {
	c2.style.width = c2.style.height = '30px';
	c1.style.width = c1.style.height = '20px';
	fillMode = false;
}

s3.onclick = () => {
	s3.style.border = "2px solid white";
	s4.style.border = s5.style.border = s6.style.border = "2px solid #00000000";
	size = 1;
}

s4.onclick = () => {
	s4.style.border = "2px solid white";
	s3.style.border = s5.style.border = s6.style.border = "2px solid #00000000";
	size = 2;
}

s5.onclick = () => {
	s5.style.border = "2px solid white";
	s3.style.border = s4.style.border = s6.style.border = "2px solid #00000000";
	size = 3;
}

s6.onclick = () => {
	s6.style.border = "2px solid white";
	s3.style.border = s4.style.border = s5.style.border = "2px solid #00000000";
	size = 4;
}

s1.onclick();
s4.onclick();