class Window {
	static instanceCount = 0;
	constructor(state = 'active', parent_window = null, north = null, south = null, west = null, east = null){
		this.id = Window.instanceCount;
		Window.instanceCount++;
		
		this.state = state;
		this.parent_window = parent_window;
		this.north = north;
		this.south = south;
		this.west = west;
		this.east = east;
		this.div = document.createElement('div');
		this.div.classList.add('window');
		this.div.classList.add(state);

		this._relative_x = 1;
		this._relative_y = 1;
	}
	isLeaf(){
		return this.north == null && this.south == null && this.west == null && this.east == null;
	}
}

class TilingManager {
	constructor(div = document.body){
		this.windows = [];
		this.current_window = new Window('active');
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
		while (this.root.parent_window != null){
			this.root = this.root.parent_window;
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
		let east = new Window('inactive');
		let parent_window = new Window('inactive');
		this.resetGrandparent(west.parent_window, west, parent_window);

		parent_window.parent_window = west.parent_window;
		parent_window.west = west;
		parent_window.east = east;
		this.addWindow(east);
		this.addWindow(parent_window);
		east.parent_window = parent_window;
		west.parent_window = parent_window;
		this.updateParent(parent_window);

		this.siftUpRootIfNecessary();
		this.displayAll();
	}
	horizontalSplit(){
		let north = this.current_window;
		let south = new Window('inactive');
		let parent_window = new Window('inactive');
		this.resetGrandparent(north.parent_window, north, parent_window);
		parent_window.parent_window = north.parent_window;
		parent_window.north = north;
		parent_window.south = south;
		this.addWindow(south);
		this.addWindow(parent_window);
		north.parent_window = parent_window;
		south.parent_window = parent_window;
		this.updateParent(parent_window);

		this.siftUpRootIfNecessary();
		this.displayAll();
	}
	updateParent(parent_window){
		while (parent_window != null){
			if (parent_window.east != null && parent_window.west != null){
				parent_window._relative_x = parent_window.east._relative_x + parent_window.west._relative_x;
				parent_window._relative_y = Math.max(parent_window.east._relative_y, parent_window.west._relative_y);
			}
			else if (parent_window.north != null && parent_window.south != null) {
				parent_window._relative_x = Math.max(parent_window.north._relative_x, parent_window.south._relative_x);
				parent_window._relative_y = parent_window.north._relative_y + parent_window.south._relative_y;
			}
			else {
				console.log("something's very wrong");
			}
			parent_window = parent_window.parent_window;
		}
	}
}

var tiling_manager = new TilingManager(document.body)

document.addEventListener('keydown', function(event) {
	if (event.key === 'v') {
		tiling_manager.verticalSplit()
	} else if (event.key === 'h') {
		tiling_manager.horizontalSplit()
	}
	console.log(tiling_manager);
	// for (win in tiling_manager.windows){
	// 	console.log($`{win.}`)
	// }


});

// export {tiling_manager};

function asPixel(value){
	return value + 'px';
}

function extractDimensions(windowElement){
	const windowStyle = getComputedStyle(windowElement);
	const left = parseFloat(windowStyle.left);
	const width = parseFloat(windowStyle.width);
	const top = parseFloat(windowStyle.top);
	const height = parseFloat(windowStyle.height);
	return [left, width, top, height];
}

function splitVertically(windowElement) {
	const [left, width, top, height] = extractDimensions(windowElement);

	let newWindow = document.createElement('div');
	newWindow.className = 'window inactive';
	newWindow.style.width = asPixel(width / 2);
	newWindow.style.top = asPixel(top);
	newWindow.style.height = asPixel(height);
	newWindow.style.left = asPixel(left + width / 2);
	document.body.appendChild(newWindow);

	windowElement.style.width = asPixel(width / 2);
}

function splitHorizontally(windowElement) {
	const [left, width, top, height] = extractDimensions(windowElement);

	let newWindow = document.createElement('div');
	newWindow.className = 'window inactive';
	newWindow.style.top = asPixel(top + height / 2);
	newWindow.style.height = asPixel(height / 2);
	newWindow.style.left = asPixel(left);
	newWindow.style.width = asPixel(width);
	document.body.appendChild(newWindow);

	windowElement.style.height = asPixel(height / 2);
}


