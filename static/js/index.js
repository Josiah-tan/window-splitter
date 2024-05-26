import {Stack} from "./stack.js"
function areClose(a, b, epsilon = Number.EPSILON) {
    return Math.abs(a - b) < epsilon;
}


class Point {
	constructor(x, y){
		this.x = x;
		this.y = y;
	}
	getEuclideanDistance2(point){
		return (point.x - this.x) * (point.x - this.x) + (point.y - this.y) * (point.y - this.y);
	}
	subtract(point){
		return new Point(this.x - point.x, this.y - point.y);
	}
    toString() {
        return `Point(${this.x}, ${this.y})`;
    }
}

class Segment {
	constructor(first, second){
		this.first = first;
		this.second = second;
	}
	isOverlapping(segment){
		return this.second >= segment.first && this.first <= segment.second
	}
	getOverlappingLength(segment){
		if (this.isOverlapping(segment)){
			 return Math.min(this.second, segment.second)- Math.max(this.first, segment.first);
		}
		else {
			return 0;
		}
	}
}

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
		this.div.addEventListener('mouseover', () => {
			this.div.classList.add('hover');
		})
		this.div.addEventListener('mouseout', () => {
			this.div.classList.remove('hover');
		})

		this.selected = false;
		this.div.addEventListener('click', () => {
			this.selected = true;
		})
		this._relative_x = 1;
		this._relative_y = 1;
	}
	setActive(){
		this.div.classList.remove('inactive');
		this.div.classList.add('active');
	}
	setInactive(){
		this.div.classList.remove('active');
		this.div.classList.add('inactive');
	}
	getDimensions() {
		let div_style = getComputedStyle(this.div);
		let width = parseFloat(div_style.width);
		let height = parseFloat(div_style.height);
		let left = parseFloat(div_style.left);
		let top = parseFloat(div_style.top);
		return [width, height, left, top];
	}
	getMiddleCoordinates(){
		const [width, height, left, top] = this.getDimensions()
		return new Point(width / 2 + left, height / 2 + top);
	}
	getTopLeftCoordinates(){
		const [, , left, top] = this.getDimensions()
		return new Point(left, top);
	}
	getTopRightCoordinates(){
		const [width, , left, top] = this.getDimensions()
		return new Point(left + width, top);
	}
	getBottomRightCoordinates(){
		const [width, height, left, top] = this.getDimensions()
		return new Point(left + width, top + height);
	}
	getBottomLeftCoordinates(){
		const [, height, left, top] = this.getDimensions()
		return new Point(left, top + height);
	}
}

class TilingManager {
	constructor(div = document.body, max_number_windows = 20){
		this.max_number_windows = max_number_windows;
		this.windows = new Set();
		this._number_windows = 0;
		this.active_window = this._createNewWindow();
		if (this.active_window == null){
			console.log("something is very wrong")
		}
		this.root = this.active_window;
		this.div = div;
		this.addWindowLeaf(this.active_window);
		this.displayAll();
		this.div.addEventListener('click', () => {
			for (var current_window of this.windows){
				if (current_window.selected){
					current_window.selected = false;
					this.setActiveWindow(current_window);
				}
			}
		})
		this.zoomed_in = false;
		this.showing_number_order = false;
	}
	_createNewWindow(state){
		if (this._number_windows == this.max_number_windows){
			return null;
		} else {
			return new WindowLeaf(state);
		}
	}
	displayAll(){
		let div_style = getComputedStyle(this.div);
		let width = parseFloat(div_style.width);
		let height = parseFloat(div_style.height);
		let top = 0;
		let left = 0;
		this.displayNode(this.root, width, height, top, left);
		if (this.showing_number_order){
			this.showNumberOrder();
		}
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
		this._number_windows++;
		this.windows.add(new_window);
		this.div.appendChild(new_window.div);
	}

	removeWindowLeafFromDiv(old_window){
		this._number_windows--;
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
		if (this.zoomed_in) return;
		let west = this.active_window;
		let east = this._createNewWindow('inactive');
		if (east == null){
			alert(`max windows (${this.max_number_windows}) reached, cannot vertical split)`)
			return;
		}
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
		if (this.zoomed_in) return;
		let north = this.active_window;
		let south = this._createNewWindow('inactive');
		if (south == null){
			alert(`max windows (${this.max_number_windows}) reached, cannot horizontal split)`)
			return;
		}
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
		this.active_window.setInactive();
		this.active_window = new_window;
		this.active_window.setActive();
	}
	getClosestWindow(middle_coordinates){
		let closest = null;
		let closest_distance = Number.MAX_VALUE;
		for (var current_window of this.windows){
			let current_middle_coordinates = current_window.getMiddleCoordinates()
			let distance = current_middle_coordinates.getEuclideanDistance2(middle_coordinates) 
			if (distance < closest_distance){
				closest = current_window;
				closest_distance = distance;
			}
		}
		return closest;
	}
	closeActive(){
		if (this.active_window.parent != null){
			let current_window = this.active_window;
			let middle_coordinates = current_window.getMiddleCoordinates();
			let sibling = this.getSibling(current_window);
			this.replaceParentKid(current_window.parent.parent, current_window.parent, sibling);
			this.removeWindowLeafFromDiv(this.active_window);
			sibling.parent = current_window.parent.parent;
			this.updateAncestors(sibling.parent);
			this.root = sibling;
			this.siftUpRootIfNecessary();
			this.displayAll();
			let new_active_window = this.getClosestWindow(middle_coordinates);
			this.setActiveWindow(new_active_window);
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
	switchDown(){
		let div_style = getComputedStyle(this.div);
		let height = parseFloat(div_style.height);

		
		let {x: bottom_left_x, y: bottom} = this.active_window.getBottomLeftCoordinates()
		let {x: bottom_right_x} = this.active_window.getBottomRightCoordinates()

		// 0.2 ∵ accumulation of floating point errors
		if (areClose(bottom, height, 0.2)){
			bottom = 0;
		}

		let bottom_segment = new Segment(bottom_left_x, bottom_right_x);

		let down_window = null;
		let segment_longest = 0;
		
		for (var current_window of this.windows){
			let {x: top_left_x, y: top} = current_window.getTopLeftCoordinates()
			let {x: top_right_x} = current_window.getTopRightCoordinates()
			let top_segment = new Segment(top_left_x, top_right_x);
			if (areClose(top, bottom, 0.2)){
				let segment_length = top_segment.getOverlappingLength(bottom_segment);
				if (segment_length > segment_longest){
					down_window = current_window;
					segment_longest = segment_length;
				}
			}
		}
		this.setActiveWindow(down_window);
	}
	switchUp(){
		let div_style = getComputedStyle(this.div);
		let height = parseFloat(div_style.height);

		
		let {x: top_left_x, y: top} = this.active_window.getTopLeftCoordinates();
		let {x: top_right_x} = this.active_window.getTopRightCoordinates();

		if (top == 0){
			top = height;
		}

		let top_segment = new Segment(top_left_x, top_right_x);

		let up_window = null;
		let segment_longest = 0;
		
		for (var current_window of this.windows){
			let {x: bottom_left_x, y: bottom} = current_window.getBottomLeftCoordinates();
			let {x: bottom_right_x} = current_window.getBottomRightCoordinates();
			let bottom_segment = new Segment(bottom_left_x, bottom_right_x);
			if (areClose(bottom, top, 0.2)){
				let segment_length = bottom_segment.getOverlappingLength(top_segment);
				if (segment_length > segment_longest){
					up_window = current_window;
					segment_longest = segment_length;
				}
			}
		}
		this.setActiveWindow(up_window);
	}
	switchLeft(){
		let div_style = getComputedStyle(this.div);
		let width = parseFloat(div_style.width);

		let {x: left, y: top_left_y} = this.active_window.getTopLeftCoordinates();
		let {y: bottom_left_y} = this.active_window.getBottomLeftCoordinates();

		if (left === 0){
			left = width;
		}

		let left_segment = new Segment(top_left_y, bottom_left_y);

		let left_window = null;
		let segment_longest = 0;

		for (var current_window of this.windows){
			let {x: right, y: top_right_y} = current_window.getTopRightCoordinates();
			let {y: bottom_right_y} = current_window.getBottomRightCoordinates();
			let right_segment = new Segment(top_right_y, bottom_right_y);
			if (areClose(right, left, 0.2)){
				let segment_length = right_segment.getOverlappingLength(left_segment);
				if (segment_length > segment_longest){
					left_window = current_window;
					segment_longest = segment_length;
				}
			}
		}
		this.setActiveWindow(left_window);
	}
	switchRight(){
		let div_style = getComputedStyle(this.div);
		let width = parseFloat(div_style.width);

		let {x: right, y: top_right_y} = this.active_window.getTopRightCoordinates();
		let {y: bottom_right_y} = this.active_window.getBottomRightCoordinates();

		if (areClose(right, width, 0.2)){
			right = 0;
		}

		let right_segment = new Segment(top_right_y, bottom_right_y);

		let right_window = null;
		let segment_longest = 0;

		for (var current_window of this.windows){
			let {x: left, y: top_left_y} = current_window.getTopLeftCoordinates();
			let {y: bottom_left_y} = current_window.getBottomLeftCoordinates();
			let left_segment = new Segment(top_left_y, bottom_left_y);
			if (areClose(right, left, 0.2)){
				let segment_length = right_segment.getOverlappingLength(left_segment);
				if (segment_length > segment_longest){
					right_window = current_window;
					segment_longest = segment_length;
				}
			}
		}
		this.setActiveWindow(right_window);
	}
	toggleZoom(){
		if (this.active_window.parent != null){
			if (this.zoomed_in){
				this.displayAll();
			}
			else {
				this.active_window.div.style.top = '0';
				this.active_window.div.style.left = '0';
				this.active_window.div.style.width = '100%';
				this.active_window.div.style.height = '100%';
				let z_index = 0;
				for (let current_window of this.windows){
					let div_style = getComputedStyle(current_window.div);
					z_index = Math.max(z_index, parseInt(div_style.zIndex));
				}
				this.active_window.div.style.zIndex = (z_index + 1).toString()
			}
			this.zoomed_in = !this.zoomed_in;
		} else {
			this.zoomed_in = false;
		}
	}
	only(){
		if (this.zoomed_in) {
			this.zoomed_in = false;
		}
		for (let current_window of this.windows){
			if (current_window != this.active_window){
				this.removeWindowLeafFromDiv(current_window);
			}
		}
		this.active_window.parent = null;
		this.root = this.active_window;
		this.displayAll();
	}
	showNumberOrder(){
		this.showing_number_order = true;
		let counter = 0;
		let stack = new Stack();
		let visited = new Set();
		stack.push(this.root);
		while (!stack.isEmpty()){
			let current_window = stack.peek();
			if (current_window.isLeaf()){
				let number_order = current_window.div.getElementsByClassName('number-order');

				var new_paragraph;
				if (Array.from(number_order).length == 0){
					new_paragraph = document.createElement('p');
					new_paragraph.classList.add("number-order")
					current_window.div.appendChild(new_paragraph);
				}
				else {
					new_paragraph = number_order[0];
				}
				new_paragraph.textContent = counter;
				let div_style = getComputedStyle(current_window.div);
				let width = parseFloat(div_style.width);
				let height = parseFloat(div_style.height);
				new_paragraph.style.fontSize = asPixel(Math.min(width / counter.toString().length / 2, height / 2))
				counter++;
				stack.pop();
			} else {
				if (visited.has(current_window)){
					stack.pop();
					if (current_window.east != null){
						stack.push(current_window.east);
					} else {
						stack.push(current_window.south);
					}
				} else {
					visited.add(current_window);
					if (current_window.west != null){
						stack.push(current_window.west);
					} else {
						stack.push(current_window.north);
					}
				}
			}
		}
	}
	toggleShowNumberOrder(){
		this.showing_number_order = !this.showing_number_order;
		if (this.showing_number_order){
			this.showNumberOrder();
		} else {
			for (let current_window of this.windows){
				let number_order = current_window.div.getElementsByClassName('number-order');
				Array.from(number_order).forEach(function(child){
					child.parentNode.removeChild(child);
				})
			}
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
	} else if (event.key === 'ArrowDown') {
		tiling_manager.switchDown();
	} else if (event.key === 'ArrowUp') {
		tiling_manager.switchUp();
	} else if (event.key === 'ArrowLeft') {
		tiling_manager.switchLeft();
	} else if (event.key === 'ArrowRight') {
		tiling_manager.switchRight();
	} else if (event.key === 'z'){
		tiling_manager.toggleZoom();
	} else if (event.key === 'o'){
		tiling_manager.only();
	} else if (event.key === 'n'){
		tiling_manager.toggleShowNumberOrder();
	}
	console.log(tiling_manager)
});

window.addEventListener('resize', function() {
	if (tiling_manager.zoomed_in) return;
	tiling_manager.displayAll();
})

function asPixel(value){
	return value + 'px';
}
