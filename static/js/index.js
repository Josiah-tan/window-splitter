import { Stack } from "./stack.js"
import { asPixel, areClose, Point, Segment } from "./math.js";

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
		this.plot_json_ptrs = [];
		this.plot_ptr = -1;
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

		this.dragstart = false;
		this.div.addEventListener('mousedown', () => {
			this.dragstart = true;
		})	

		this._relative_x = 1;
		this._relative_y = 1;
	}
	duplicate(state = "active", plots_json, parent = null){
		const window_leaf = new WindowLeaf(state, parent)
		for (var plot_json_ptr of this.plot_json_ptrs){
			window_leaf.plot_json_ptrs.push(plot_json_ptr)
		}
		window_leaf.plot_ptr = this.plot_ptr
		window_leaf.showCurrentPlot(plots_json)
		return window_leaf
	}
	showCurrentPlot(plots_json) {
		var lookup = this.getCurrentPlot();
		var plot_json = plots_json[lookup];
		if (plot_json != undefined){
			Plotly.react(this.div, plot_json.data, plot_json.layout, {'responsive': true});
		}
	}
	showNextPlot(plots_json, increment){
		this.plot_ptr += increment;
		this.showCurrentPlot(plots_json);
	}
	addNewPlot(lookup){
		this.plot_json_ptrs.push(lookup);
	}
	showLatestPlot(plots_json){
		this.plot_ptr = -1;
		this.showCurrentPlot(plots_json);
	}
	getCurrentPlot(){
		if (this.plot_json_ptrs.length == 0){
			return null;
		}
		else {
			return this.plot_json_ptrs[(this.plot_json_ptrs.length + this.plot_ptr) % this.plot_json_ptrs.length];
		}
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
	isContained(x, y){
		let {x: x_min, y: y_min} = this.getTopLeftCoordinates();
		let {x: x_max, y: y_max} = this.getBottomRightCoordinates();
		return (
			(x >= x_min && x <= x_max) &&
			(y >= y_min && y <= y_max)
		)
	}
	getMiddleCoordinates(){
		const [width, height, left, top] = this.getDimensions()
		return new Point(width / 2 + left, height / 2 + top);
	}
	getMiddleRightCoordinates(){
		const [width, height, left, top] = this.getDimensions();
		return new Point(left + width, height / 2 + top);
	}
	getMiddleLeftCoordinates(){
		const [, height, left, top] = this.getDimensions();
		return new Point(left, height / 2 + top);
	}
	getTopMiddleCoordinates(){
		const [width, , left, top] = this.getDimensions();
		return new Point(left + width / 2, top);
	}
	getBottomMiddleCoordinates(){
		const [width, height, left, top] = this.getDimensions();
		return new Point(left + width / 2, top + height);
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
		this.plots_json = {};
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

		this.div.addEventListener('dragstart', (event) => {
			// hot fix: disable all dragging ghost effects
			event.preventDefault();
		})

		this.dragstart = null;
		this.div.addEventListener('mousedown', () => {
			for (var current_window of this.windows){
				if (current_window.dragstart){
					current_window.dragstart = false;
					this.dragstart = current_window;
					break;
				}
			}
		})

		this.dragdrop = null;
		this.div.addEventListener('mouseup', (event) => {
			const x = event.clientX;
			const y = event.clientY;
			for (var current_window of this.windows){
				if (current_window.isContained(x, y)){
					this.dragdrop = current_window;
					this._handleDragDrop(x, y);
					break;
				}
			}
			this.dragstart = null;
			this.dragdrop = null;
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
	_createNewWindowDuplicate(state, original){
		if (this._number_windows == this.max_number_windows){
			return null;
		} else {
			return original.duplicate(state, this.plots_json)
		}
	}
	_handleDragDrop(x, y){
		let dragdrop_parent = this.dragdrop.parent;
		let dragstart_parent = this.dragstart.parent;

		if (this.dragdrop == this.dragstart){
			// do nothing
		}
		else if (dragdrop_parent === dragstart_parent){
			if (dragdrop_parent.west != null && dragdrop_parent.east != null){
				[dragdrop_parent.west, dragdrop_parent.east] = [dragdrop_parent.east, dragdrop_parent.west]
			}
			else if (dragdrop_parent.north != null && dragdrop_parent.south != null){
				[dragdrop_parent.north, dragdrop_parent.south] = [dragdrop_parent.south, dragdrop_parent.north]
			}
			else {
				console.log("something's very wrong")
			}
		}
		else {
			this.replaceParentKid(dragdrop_parent, this.dragdrop, this.dragstart);
			this.replaceParentKid(dragstart_parent, this.dragstart, this.dragdrop);
			this.dragdrop.parent = dragstart_parent;
			this.dragstart.parent = dragdrop_parent;
		}

		this.displayAll();
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
		this.allPlotsHandleResize();
	}
	allPlotsHandleResize(){
		for (var current_window of this.windows){
			if (current_window.plot_json_ptrs.length > 0){
				current_window.div._responsiveChartHandler();
			}
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
		let east = this._createNewWindowDuplicate('inactive', this.active_window);
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
		let south = this._createNewWindowDuplicate('inactive', this.active_window);
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
	_closeWindow(current_window){
		if (current_window.parent != null){
			let middle_coordinates = current_window.getMiddleCoordinates();
			let sibling = this.getSibling(current_window);
			this.replaceParentKid(current_window.parent.parent, current_window.parent, sibling);
			this.removeWindowLeafFromDiv(current_window);
			sibling.parent = current_window.parent.parent;
			this.updateAncestors(sibling.parent);
			this.root = sibling;
			this.siftUpRootIfNecessary();
			this.displayAll();
			if (current_window == this.active_window){
				let new_active_window = this.getClosestWindow(middle_coordinates);
				this.setActiveWindow(new_active_window);
			}
		}
	}
	closeActive(){
		this._closeWindow(this.active_window);
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
		this.switchInDirection(0, 1);
	}
	switchUp(){
		this.switchInDirection(0, -1);
	}
	switchLeft(){
		this.switchInDirection(-1, 0);
	}
	switchRight(){
		this.switchInDirection(1, 0);
	}
	switchInDirection(x, y){
		let div_style = getComputedStyle(this.div);
		let div_width = parseFloat(div_style.width);
		let div_height = parseFloat(div_style.height);
		
		const moving_direction = new Point(x, y);
		let [width, height, left, top] = this.active_window.getDimensions();
		const offset = new Point(left + width / 2, top + height / 2);
		const point = offset.add(moving_direction.multiply(new Point(width / 2, height / 2)));
		
		if (areClose(point.x, div_width, 0.2)){
			point.x = 0;
		}
		else if (areClose(point.y, div_height, 0.2)){
			point.y = 0;
		}
		else if (point.x == 0){
			point.x = div_width;
		}
		else if (point.y == 0){
			point.y = div_height;
		}
		let padding = 0.2;
		for (var current_window of this.windows){
			if (current_window == this.active_window){
				continue;
			}
			[width, height, left, top] = current_window.getDimensions();
			// padding (for floating point errors)
			width += padding * 2;
			height += padding * 2;
			left -= padding;
			top -= padding;
			if ((point.y >= top && point.y <= top + height) &&
				(point.x >= left && point.x <= left + width)
			){
				this.setActiveWindow(current_window);
				break;
			}
		}
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
				let number_order_divs = current_window.div.getElementsByClassName('number-order');

				var number_order_div;
				var new_paragraph;
				if (Array.from(number_order_divs).length == 0){
					number_order_div = document.createElement('div');
					number_order_div.classList.add("number-order")
					new_paragraph = document.createElement('p');
					number_order_div.appendChild(new_paragraph);
					current_window.div.appendChild(number_order_div);
				}
				else {
					number_order_div = number_order_divs[0];
				}
				new_paragraph = number_order_div.getElementsByTagName("p")[0]
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
	setActiveNewPlot(plot_json){
		var lookup = plot_json.layout.title.text;
		this.plots_json[lookup] = plot_json;
		
		this.active_window.addNewPlot(lookup);
		this.active_window.showLatestPlot(this.plots_json);
	}
	setActiveNextPlot(increment){
		this.active_window.showNextPlot(this.plots_json, increment);
	}
	applyColorScheme(colorscheme_template){
		var background_color = colorscheme_template.layout.paper_bgcolor
		var font_color = colorscheme_template.layout.font.color
		this.div.style.color = font_color
		this.div.style.backgroundColor = background_color
		this.div.style.borderColor = font_color

		for (var lookup in this.plots_json){
			this.plots_json[lookup].layout.template = colorscheme_template;
		}
		for (var current_window of this.windows){
			var lookup = current_window.getCurrentPlot()
			if (lookup != null){
				Plotly.relayout(current_window.div, this.plots_json[lookup].layout);
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
	} else if (event.key === 'f'){
		tiling_manager.setActiveNextPlot(1);
	} else if (event.key == 'F'){
		tiling_manager.setActiveNextPlot(-1);
	} else if ((event.key == 'j' && event.ctrlKey) || event.key == "Escape"){
		event.preventDefault();
	}
	console.log(tiling_manager)
});

window.addEventListener('resize', function() {
	if (tiling_manager.zoomed_in) return;
	tiling_manager.displayAll();
})


document.addEventListener('DOMContentLoaded', function() {
	var socket = io.connect('http://' + document.domain + ':' + location.port);
	socket.on('update', function(data) {
		if (data.command == "setActivePlot"){
			var plot_json = JSON.parse(data.data);
			tiling_manager.setActiveNewPlot(plot_json);
		}
		if (data.command == "setColorscheme"){
			fetchColorschemeData(data.data);
		}
	});
});

function fetchColorschemeData(colorscheme) {
	var colorscheme_template
	fetch('/colorscheme-data', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json'
		},
		body: JSON.stringify(colorscheme)
	})
		.then(response => response.json())
		.then(data => {
			colorscheme_template = data.template;
			tiling_manager.applyColorScheme(colorscheme_template);
		})
		.catch(error => console.error('error fetching colorscheme-data:', error));
}
