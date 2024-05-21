class _Window {
	static instanceCount = 0;
	constructor(parent = null){
		this.id = _Window.instanceCount;
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
		this.windows = new Set();
		this.active_window = new WindowLeaf('active');
		this.root = this.active_window;
		this.div = div;
		this.addWindowLeaf(this.active_window);
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

	addWindowLeaf(new_window){
		this.windows.add(new_window);
		this.div.appendChild(new_window.div);
	}

	removeWindowLeaf(old_window){
		this.windows.delete(old_window);
		this.div.removeChild(old_window.div);
	}

	siftUpRootIfNecessary(){
		while (this.root.parent != null){
			this.root = this.root.parent;
		}
	}
	replaceParentKid(parent, old_kid, new_kid){
		if (parent == null){
			return;
		}
		if (parent.west == old_kid){
			parent.west = new_kid;
		}
		else if (parent.east == old_kid){
			parent.east = new_kid;
		}
		else if (parent.north == old_kid){
			parent.north = new_kid;
		}
		else if (parent.south == old_kid){
			parent.south = new_kid;
		}
	}
	verticalSplitActive(){
		let west = this.active_window;
		let east = new WindowLeaf('inactive');
		let parent = new WindowStem();
		this.replaceParentKid(west.parent, west, parent);

		parent.parent = west.parent;
		parent.west = west;
		parent.east = east;
		this.addWindowLeaf(east);
		east.parent = parent;
		west.parent = parent;
		this.updateAncestors(parent);

		this.siftUpRootIfNecessary();
		this.displayAll();
	}
	horizontalSplitActive(){
		let north = this.active_window;
		let south = new WindowLeaf('inactive');
		let parent = new WindowStem();
		this.replaceParentKid(north.parent, north, parent);

		parent.parent = north.parent;
		parent.north = north;
		parent.south = south;
		this.addWindowLeaf(south);
		north.parent = parent;
		south.parent = parent;
		this.updateAncestors(parent);

		this.siftUpRootIfNecessary();
		this.displayAll();
	}
	getSibling(current_window){
		parent = current_window.parent;
		for (let kid of [parent.east, parent.west, parent.south, parent.north]){
			if (kid != null && kid != current_window){
				return kid;
			}
		}
		console.log("something's gone very wrong");
	}
	setActiveWindow(new_window){
		this.active_window = new_window;
		new_window.div.classList.remove(new_window.state);
		new_window.div.classList.add('active');
	}
	closeActive(){
		if (this.active_window.parent != null){
			let current_window = this.active_window;
			let sibling = this.getSibling(current_window);
			this.replaceParentKid(current_window.parent.parent, current_window.parent, sibling);
			this.removeWindowLeaf(this.active_window);
			this.setActiveWindow(sibling);
			sibling.parent = current_window.parent.parent;
			this.updateAncestors(sibling.parent);
			this.root = sibling;
			this.siftUpRootIfNecessary();
			this.displayAll();
		}
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
		tiling_manager.verticalSplitActive();
	} else if (event.key === 's') {
		tiling_manager.horizontalSplitActive();
	} else if (event.key === 'q') {
		tiling_manager.closeActive();
	}
	console.log(tiling_manager)
});

function asPixel(value){
	return value + 'px';
}
