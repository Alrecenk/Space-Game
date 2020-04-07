


// Draws a circle with a gradient suggesting a light position to give a 3D effect.
var light_size = .12;
var grad_size = .7;
function drawLitCircle(x, y, radius, main_color, light_x, light_y, light_color, ambient_color, border_color, border_size){
	
	
	// Create gradient
	var grd = context.createRadialGradient(light_x,light_y,0,light_x,light_y, 1.5*radius);
	grd.addColorStop(0,light_color);
	grd.addColorStop(light_size, main_color);
	grd.addColorStop(grad_size, ambient_color);

	// Fill with gradient
	context.fillStyle = grd;
	context.beginPath();
	context.arc(x,y,radius,0,2*Math.PI);
	context.closePath();
	context.fill();

	if(border_color != null && border_size > 0){
		context.lineWidth = border_size;
		context.strokeStyle = border_color;
		context.stroke();
	}
}



//Convenience camera class handles drawing stuff considering the users camera position.
// x and y are where he camera is centered, zoom is the width of the game space shown.
// Objects smaller than minimum size will be drawn as outlines at minimum size.

function Camera(screen_box_i, x_i, y_i, zoom_i, minimum_size_i, theCanvas, context) {
	this.screen_box = screen_box_i;
    this.x = x_i;
    this.y = y_i;
    this.zoom = zoom_i;
    this.minimum_size = minimum_size_i;

	  // Draw the given circle (in absolute coordinates) onto the view.
	  this.drawSphere = function(cx, cy, cr, color){
	    var scale = (this.screen_box[2]-this.screen_box[0])/this.zoom;
	    var sx = (cx-this.x)*scale + (this.screen_box[2]+this.screen_box[0])*.5 ;
	    var sy = (cy-this.y)*scale + (this.screen_box[3]+this.screen_box[1])*.5 ;
	    var radius = cr*scale;
	    if(sx+radius > 0 && sy+radius > 0 && sx-radius < this.screen_box[2] && sy-radius < this.screen_box[3]){
		    drawFancyCircle(sx, sy, radius, color, color, 2);
		    if(radius < this.minimum_size){
		    	drawFancyCircle(sx, sy, this.minimum_size, color, color, 2);
		    } 
	    }
	    
	  }
	  
	// Draw the given circle (in absolute coordinates) onto the view.
	  this.drawCircle = function(cx, cy, cr, fill_color, stroke_color, stroke_size){
	    var scale = (this.screen_box[2]-this.screen_box[0])/this.zoom;
	    var sx = (cx-this.x)*scale + (this.screen_box[2]+this.screen_box[0])*.5 ;
	    var sy = (cy-this.y)*scale + (this.screen_box[3]+this.screen_box[1])*.5 ;
	    var radius = cr*scale;
	    drawCircle(sx, sy, radius, fill_color, stroke_color, stroke_size);
	    if(radius < this.minimum_size){
	    	drawCircle(sx, sy, this.minimum_size, fill_color, stroke_color, stroke_size);
	    } 
	  }
	  
	// Draw the given line(in absolute coordinates) onto the view.
	  this.drawLine = function(x1, y1, x2, y2, color){
	    var scale = (this.screen_box[2]-this.screen_box[0])/this.zoom;
	    var sx1 = (x1-this.x)*scale + (this.screen_box[2]+this.screen_box[0])*.5 ;
	    var sy1 = (y1-this.y)*scale + (this.screen_box[3]+this.screen_box[1])*.5 ;
	    var sx2 = (x2-this.x)*scale + (this.screen_box[2]+this.screen_box[0])*.5 ;
	    var sy2 = (y2-this.y)*scale + (this.screen_box[3]+this.screen_box[1])*.5 ;
	
	    if((sx1 > this.screen_box[0] && sx1 < this.screen_box[2] && sy1 > this.screen_box[1] && sy1 < this.screen_box[3]) ||
	    		(sx2 > this.screen_box[0] && sx2 < this.screen_box[2] && sy2 > this.screen_box[1] && sy2 < this.screen_box[3])){
	    drawLine(color, 1, sx1, sy1, sx2, sy2);
	    }
	  }
	
	this.drawShip = function(cx, cy, angle, cr, thrust){
		 var scale = (this.screen_box[2]-this.screen_box[0])/this.zoom;
		 var sx = (cx-this.x)*scale + (this.screen_box[2]+this.screen_box[0])*.5 ;
		 var sy = (cy-this.y)*scale + (this.screen_box[3]+this.screen_box[1])*.5 ;
		 var radius = cr*scale;
		 drawShip(sx, sy, angle, radius, thrust, true);
		 if(radius < this.minimum_size*10){
			 drawShip(sx, sy, angle, this.minimum_size*10, thrust, false);
		 }
	}
	
	// Converts world coordinates to screen coordinates.
	this.toScreenCoord = function(x, y){
		var scale = (this.screen_box[2]-this.screen_box[0])/this.zoom;
		var sx = (cx-this.x)*scale + (this.screen_box[2]+this.screen_box[0])*.5 ;
	    var sy = (cy-this.y)*scale + (this.screen_box[3]+this.screen_box[1])*.5 ;
	    return [sx, sy];
	}
	
	// Converts screen coordinates to world coordinates
	this.toWorldCoord = function(sx, sy){
		var scale = (this.screen_box[2]-this.screen_box[0])/this.zoom;
		var x = (sx - (this.screen_box[2]+this.screen_box[0])*.5)/scale + this.x;
		var y = (sy - (this.screen_box[3]+this.screen_box[1])*.5)/scale + this.y;
		return [x,y];
	}
	
	function rgbToHex2(rgb) {
	    return "#" + ((1 << 24) + (rgb[0] << 16) + (rgb[1] << 8) + rgb[2]).toString(16).slice(1);
	}
	function rgbToHex(r, g, b) {
		return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
	}
	function hexToRgb(hex) {
		var bigint = parseInt(hex.substring(1,7), 16);
		var r = (bigint >> 16) & 255;
		var g = (bigint >> 8) & 255;
		var b = bigint & 255;
		return [r,g,b];
	}

	// Same as drawLitCircle but automatically places light and selects highlight color, so it appears light is near viewpoint.
	function drawFancyCircle(x, y, radius, color){
		var rgb = hexToRgb(color);
		var light_rgb = [Math.round(Math.min(rgb[0]+100,255)), Math.round(Math.min(rgb[1]+100,255)), Math.round(Math.min(rgb[2]+100,255))];
		var ambient_rgb = [Math.round(rgb[0]/4.0), Math.round(rgb[1]/4.0), Math.round(rgb[2]/4.0)];
		var light_x = x-radius*(x/theCanvas.width-.5)*1.5;
		var light_y = y-radius*(y/theCanvas.height-.5)*1.5;
		drawLitCircle(x,y,radius,color, light_x, light_y, rgbToHex2(light_rgb), rgbToHex2(ambient_rgb),rgbToHex2(light_rgb), 1);
	}
	
	function rgbToHex(red, green, blue) {
        var rgb = blue | (green << 8) | (red << 16);
        return '#' + (0x1000000 + rgb).toString(16).slice(1)
	}
	
	// Draw a canvas line with a single call.
	function drawLine(color, size, x1, y1, x2, y2){
	    context.beginPath();
	    context.lineWidth = size;
	    context.strokeStyle = color;// set line color
	    context.moveTo(x1, y1);
	    context.lineTo(x2, y2);
	    context.stroke();
    }
	
	//Draw a canvas circle with a single call.
	//Use null for fill or stroke color if you do not wish to draw that element.
	function drawCircle(x, y, radius, fill_color, stroke_color, stroke_size){
		context.beginPath();
		context.arc(x, y, radius, 0, 2 * Math.PI, false);
		context.closePath();
		if(fill_color != null){
			context.fillStyle = fill_color;
			context.fill();
		}
		if(stroke_color != null){
			context.lineWidth = stroke_size;
			context.strokeStyle = stroke_color;
			context.stroke();
		}
	}
	
	function drawShip(x, y, angle, size, thrust, fill){
		var cs = Math.cos(angle)*size/6;
		var ss = Math.sin(angle)*size/6;
		context.strokeStyle = "#505050";
		context.fillStyle = "#505050";
		context.lineWidth = 1;
		// Nose.
		context.beginPath();
		rotatedMoveTo(x, y, 3,-1.5, cs, ss);
		rotatedLineTo(x, y, 5, 0, cs, ss);
		rotatedLineTo(x, y, 3, 1.5, cs, ss);
		context.closePath();
		if(fill){
			context.fill();
		} else {
			context.stroke();
		}
		// Body
		context.fillStyle = "#808080";
		context.strokeStyle = "#808080";
		context.beginPath();
		rotatedMoveTo(x, y, 3, -1.5, cs, ss);
		rotatedLineTo(x, y, 3, 1.5, cs, ss);
		rotatedLineTo(x, y, -3, 1.5, cs, ss);
		rotatedLineTo(x, y, -3, -1.5, cs, ss);
		context.closePath();
		if(fill){
			context.fill();
		} else {
			context.stroke();
		}
		context.fillStyle = "#707070";
		context.strokeStyle = "#707070";
		// Tail fins.
		context.beginPath();
		rotatedMoveTo(x, y, 0, -1.5, cs, ss);
		rotatedLineTo(x, y, -3, -4, cs, ss);
		rotatedLineTo(x, y, -3, -1.5, cs, ss);
		context.closePath();
		if(fill){
			context.fill();
		} else {
			context.stroke();
		}
		context.beginPath();
		rotatedMoveTo(x, y, 0, 1.5, cs, ss);
		rotatedLineTo(x, y, -3, 4, cs, ss);
		rotatedLineTo(x, y, -3, 1.5, cs, ss);
		context.closePath();
		if(fill){
			context.fill();
		} else {
			context.stroke();
		}
		// Thrust
		if(thrust > 0){
			context.fillStyle = "#D08000";	
			context.strokeStyle = "#D08000";
			context.beginPath();
			rotatedMoveTo(x, y, -3, -1, cs, ss);
			rotatedLineTo(x, y, -3-thrust, 0, cs, ss);
			rotatedLineTo(x, y, -3, 1, cs, ss);
			context.closePath();
			if(fill){
				context.fill();
			} else {
				context.stroke();
			}
			context.beginPath();
			rotatedMoveTo(x, y, -3, -1.5, cs, ss);
			rotatedLineTo(x, y, -3-thrust*.75, -.75, cs, ss);
			rotatedLineTo(x, y, -3, 0, cs, ss);
			context.closePath();
			if(fill){
				context.fill();
			} else {
				context.stroke();
			}
			context.beginPath();
			rotatedMoveTo(x, y, -3, 1.5, cs, ss);
			rotatedLineTo(x, y, -3-thrust*.75, .75, cs, ss);
			rotatedLineTo(x, y, -3, 0, cs, ss);
			context.closePath();
			if(fill){
				context.fill();
			} else {
				context.stroke();
			}
		}
		
		
	}
	
	// Runs context.lineTo to for a scaled and rotated point.
	// cs = size * cos(angle, ss = size * sin(angle)
	function rotatedLineTo(cx,cy, dx,dy, cs, ss){
		context.lineTo(cx + dx * cs + dy * ss, cy + dx * ss - dy *cs);
	}
	function rotatedMoveTo(cx,cy, dx,dy, cs, ss){
		context.moveTo(cx + dx * cs + dy * ss, cy + dx * ss - dy *cs);
	}
	
}



