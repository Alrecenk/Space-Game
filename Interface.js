//Draw a rounded rectangle on the canvas with a single call.
//Use null for fill or stroke color if you do not wish to draw that element.
function drawRoundedRect(x, y, width, height, radius, fill_color, stroke_color, stroke_size){
	if (width< 2 * radius) radius = width / 2;
	if (height < 2 * radius) radius = height / 2;
	context.beginPath();
	context.moveTo(x+radius, y);
	context.arcTo(x+width, y,   x+width, y+height, radius);
	context.arcTo(x+width, y+height, x,   y+height, radius);
	context.arcTo(x,   y+height, x,   y,   radius);
	context.arcTo(x,   y,   x+width, y,   radius);
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

// Draws horizontally centered text on a canvas context that wraps at word boundaries when it exceeds the given width.
function drawText(text, size, color, x, y, width){
	context.font = size + "px Arial";
	context.fillStyle = color;
	var words = text.split(" "); 
	y+=size;
	line = words[0] + " ";
	for(var w = 1; w < words.length; w++){
		if(context.measureText(line + words[w]).width > width){ // If next word doesn't fit.
			var line_width = context.measureText(line).width;
			context.fillText(line, x + (width-line_width)*.5, y);
			y+=size;
			line = words[w] + " ";
		}else{ // If word does fit.
			line += words[w] + " ";
		}
	}
	var line_width = context.measureText(line).width;
	context.fillText(line, x + (width-line_width)*.5, y);
}

function drawFlask(x, y, size=15, fill_color="#2020FF", light_color="#A070FF", border_color="#F0F0F0", stroke_size = 2){
	context.strokeStyle = border_color;
	context.fillStyle = fill_color;
	context.lineWidth = stroke_size;
	var grd = context.createRadialGradient(x + 0.1 *size, y - 0.05*size,0,x + 0.1 *size, y - 0.05*size, 1.5*size);
	grd.addColorStop(0,light_color);
	grd.addColorStop(.4, fill_color);

	// Fill with gradient
	context.fillStyle = grd;
	context.beginPath();
	context.moveTo(x - 0.5 *size , y + .5*size);
	context.lineTo(x + 0.5 *size, y + 0.5*size);
	context.lineTo(x + 0.15 *size, y - 0.2*size);
	context.lineTo(x + 0.15 *size, y - 0.5*size);
	context.lineTo(x - 0.15 *size, y - 0.5*size);
	context.lineTo(x - 0.15 *size, y - 0.2*size);
	context.lineTo(x - 0.5 *size, y + 0.5*size);
	context.fill();
	context.stroke();
}

function drawCoin(x, y, size=15, fill_color="#D0D04F", light_color="#FFFF8F", border_color="#FFFFA0", stroke_size = 2){
	drawLitCircle(x, y, size*.5, fill_color, x-.1*size, y-.1*size, light_color, fill_color, border_color, stroke_size);
}



// A button on the interface.
// You can add these to the interface_buttons map to use them. A button is considered "clicked" if the mouse goes down and up on it.
function InterfaceButton(x_i, y_i, width_i, height_i, text_i, text_size_i, text_color_i, back_color_i, edge_color_i, edge_size_i, my_function_i){
	this.x = x_i;
	this.y = y_i;
	this.width = width_i;
	this.height = height_i;
	this.text = text_i;
	this.text_size = text_size_i;
	this.text_color = text_color_i;
	this.back_color = back_color_i;
	this.edge_color = edge_color_i;
	this.my_function = my_function_i;
	this.edge_size = edge_size_i;
	this.rounded = Math.min(.2*this.width,.2*this.height);
	this.context = context ;
	
	// Draw the b utton on the given context.
	this.draw = function(){
		drawRoundedRect(this.x, this.y, this.width, this.height, this.rounded, this.back_color, this.edge_color, this.edge_size);
		drawText(this.text, this.text_size, this.text_color, this.x+this.rounded, this.y+this.rounded, this.width-this.rounded*2);
	}
	
	// Returns is a position is inside the button.
	this.inside = function(m_x, m_y){
		return m_x >= this.x && m_x <= this.x + this.width && m_y >= this.y && m_y <= this.y + this.height;
	}
	
	this.execute = function(){
		if(this.my_function != null){
			this.my_function();
		}
	}
}