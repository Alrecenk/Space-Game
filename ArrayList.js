//This is a faster array implemention to route around poor performance of push in Chrome.
function ArrayList(size=100){
	this.array = new Array(size);
	this.length=0;
	
	this.push = function(obj){
		this.set(this.length, obj);
	}
	
	this.set = function(k, obj){
		if(k < this.array.length){
			this.array[k] = obj;
		}else{
			this.extend(Math.max(k+1,this.array.length*2));
			this.array[k] = obj;
		}
		if(k>=this.length){
			this.length = k+1;
		}
			
	}
	
	this.get = function(k){
		return this.array[k];
	}
	
	this.extend = function(new_size){
		var new_array = new Array(new_size);
		for(var k = 0; k < this.array.length; k++){
			new_array[k] = this.array[k];
		}
		this.array = new_array;
	}
}