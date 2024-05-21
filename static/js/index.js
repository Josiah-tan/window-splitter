class _Window {
	static instanceCount = 0;
	constructor(parent = null){
		this.id = _Window.instanceCount;
		console.log(`this.id = ${this.id}`)
		_Window.instanceCount++;
		this.parent = parent;
	}
	isLeaf(){
		return this instanceof WindowLeaf;
	}
}

class WindowStem extends _Window {
	constructor(north = null, south = null, west = null, east = null, parent = null){
		super(parent);
		console.log(this.id)
		this.north = north;
		this.south = south;
		this.west = west;
		this.east = east;
	}
}

class WindowLeaf extends _Window {
	constructor(state = 'active', parent = null){
		super(parent);
		this.state = state;
		this.div = document.createElement('div');
		this.div.classList.add('window');
		this.div.classList.add(state);
		this._relative_x = 1;
		this._relative_y = 1;
	}
}

class TilingManager {
	constructor(div = document.body){
		this.windows = [];
		this.current_window = new WindowLeaf('active');
		this.root = this.current_window;
		this.div = div;
		this.addWindow(this.current_window);
		this.displayAll();
	}

	displayAll(){
		let div_style = getComputedStyle(this.div);
		let width = parseFloat(div_style.width);
		let height = parseFloat(div_style.height);
		let top = 0;
		let left = 0;
		this.displayNode(this.root, width, height, top, left);
	}

	displayNode(current_window, width, height, top, left){
		if (current_window.isLeaf()){
			current_window.div.style.width = asPixel(width);
			current_window.div.style.height = asPixel(height);
			current_window.div.style.top = asPixel(top);
			current_window.div.style.left = asPixel(left);
		}
		else {
			if (current_window.east != null && current_window.west != null){
				let west = current_window.west;
				this.displayNode(
					west,
					width * west._relative_x / current_window._relative_x,
					height,
					top,
					left
				)
				let east = current_window.east;
				this.displayNode(
					east,
					width * east._relative_x /
					current_window._relative_x,
					height,
					top,
					left + width * west._relative_x / current_window._relative_x
				)
			}
			else if (current_window.north != null && current_window.south != null) {
				let north = current_window.north;
				this.displayNode(
					north,
					width,
					height * north._relative_y / current_window._relative_y,
					top,
					left
				);
				let south = current_window.south;
				this.displayNode(
					south,
					width,
					height * south._relative_y / current_window._relative_y,
					top + height * north._relative_y / current_window._relative_y,
					left
				);
			}
			else {
				console.log("something's very wrong");
			}
		}
	}

	addWindow(new_window){
		this.windows.push(new_window);
		this.div.appendChild(new_window.div);
	}

	siftUpRootIfNecessary(){
		while (this.root.parent != null){
			this.root = this.root.parent;
		}
	}
	resetGrandparent(grandparent, old_window, new_window){
		if (grandparent == null){
			return;
		}
		if (grandparent.west == old_window){
			grandparent.west = new_window;
		}
		else if (grandparent.east == old_window){
			grandparent.east = new_window;
		}
		else if (grandparent.north == old_window){
			grandparent.north = new_window;
		}
		else if (grandparent.south == old_window){
			grandparent.south = new_window;
		}
	}
	verticalSplit(){
		let west = this.current_window;
		let east = new WindowLeaf('inactive');
		let parent = new WindowStem();
		this.resetGrandparent(west.parent, west, parent);

		parent.parent = west.parent;
		parent.west = west;
		parent.east = east;
		this.addWindow(east);
		east.parent = parent;
		west.parent = parent;
		this.updateAncestors(parent);

		this.siftUpRootIfNecessary();
		this.displayAll();
	}
	horizontalSplit(){
		let north = this.current_window;
		let south = new WindowLeaf('inactive');
		let parent = new WindowStem();
		this.resetGrandparent(north.parent, north, parent);

		parent.parent = north.parent;
		parent.north = north;
		parent.south = south;
		this.addWindow(south);
		north.parent = parent;
		south.parent = parent;
		this.updateAncestors(parent);

		this.siftUpRootIfNecessary();
		this.displayAll();
	}
	updateAncestors(parent){
		while (parent != null){
			if (parent.east != null && parent.west != null){
				parent._relative_x = parent.east._relative_x + parent.west._relative_x;
				parent._relative_y = Math.max(parent.east._relative_y, parent.west._relative_y);
			}
			else if (parent.north != null && parent.south != null) {
				parent._relative_x = Math.max(parent.north._relative_x, parent.south._relative_x);
				parent._relative_y = parent.north._relative_y + parent.south._relative_y;
			}
			else {
				console.log("something's very wrong");
			}
			parent = parent.parent;
		}
	}
}

var tiling_manager = new TilingManager(document.body)

document.addEventListener('keydown', function(event) {
	if (event.key === 'v') {
		tiling_manager.verticalSplit()
	} else if (event.key === 's') {
		tiling_manager.horizontalSplit()
	}
	console.log( tiling_manager)
});

function asPixel(value){
	return value + 'px';
}
