export class Point {
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

export class Segment {
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

export function areClose(a, b, epsilon = Number.EPSILON) {
    return Math.abs(a - b) < epsilon;
}

export function asPixel(value){
	return value + 'px';
}

