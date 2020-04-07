// Some 2D vector functions

function add(a, b){
	return [a[0] + b[0], a[1] + b[1]];
}

function subtract(a, b){
	return [a[0] - b[0], a[1] - b[1]];
}

function dot(a, b){
	return a[0]*b[0]+a[1]*b[1];
}
function scale(a, s){
	return [a[0] *s, a[1] *s];
}
function distanceSquared(a, b){
	return (a[0]-b[0])*(a[0]-b[0]) + (a[1]-b[1])*(a[1]-b[1]);
}
// The signed area spanned by a triangle if the vectors were placed end to end.
function cross(a, b){
	return a[0]*b[1] - a[1]*b[0];
}