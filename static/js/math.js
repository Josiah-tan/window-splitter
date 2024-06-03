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
	doesContain(value){
		return (Math.min(this.first, this.second) <= value && value <= Math.max(this.first, this.second)) ||
			areClose(this.first, value, 0.2) || areClose(this.second, value, 0.2);
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

