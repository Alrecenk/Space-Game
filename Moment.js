
function Moment(entity, parent_moment, time, x, v, swept_area = null, last_safe_step = null){
	this.time = time;
	this.x = x;
	this.v = v;
	this.swept_area = swept_area ;
	this.delta_angle = 0 ;
	this.entity = entity;
	this.parent_moment = parent_moment;
	
	if(this.parent_moment == null){
		this.a = [0,0];
		this.j = [0,0];
		this.safe_step_time = DEFAULT_TIME_STEP;
	}else{
		var rel_x = subtract(this.x, this.parent_moment.x);
		var rel_v = subtract(this.v, this.parent_moment.v);
		var d2 = dot(rel_x, rel_x);
		var g = this.parent_moment.entity.mass * -G / Math.pow(d2, 1.5);
      	this.a = add(scale(rel_x,g), this.parent_moment.a);
      	//this.j = [0,0];
      	this.j = scale(add(scale(rel_x,-3*dot(rel_v,rel_x)),scale(rel_v, d2)) , -G*parent_moment.entity.mass*Math.pow(d2, -2.5));
      	this.j = add(this.j, this.parent_moment.j);
      	if(this.swept_area == null){ // If got swept area from past, keep it to prevent error accumulation
      		this.swept_area = Math.abs(cross(rel_x, rel_v));
      	}
      	if(this.type == ASTEROID){
      		this.safe_time_step = Math.min(MAX_DELTA_THETA_ASTEROID * d2 / this.swept_area, DEFAULT_TIME_STEP); // time we can step without exceeding max angle change
      		this.delta_angle = MAX_DELTA_THETA_ASTEROID;
      	}else{
	      	this.safe_step_time = Math.min(MAX_DELTA_THETA * d2 / this.swept_area, DEFAULT_TIME_STEP); // time we can step without exceeding max angle change
	      	
	      	if(this.entity.type == SHIP){
	      		this.safe_step_time = Math.min(this.safe_step_time, MAX_RELATIVE_MOVEMENT*(Math.sqrt(d2)-this.parent_moment.entity.radius)/Math.sqrt(dot(rel_v, rel_v))); // time we can step without violating speed
	      	}
	      	if(last_safe_step != null){
		    	this.safe_step_time = Math.min(this.safe_step_time, last_safe_step*2);
		    }
	      	
	      	if(isNaN(this.safe_step_time) || this.safe_step_time < ACCEPTABLE_TIME_STEP){
		    	this.safe_step_time = ACCEPTABLE_TIME_STEP;
		    }
	      	this.delta_angle = this.safe_step_time*this.swept_area/d2 ;
      	}
      	
	}
	this.last_future = null;
	this.last_future_time = -1;
	this.getFuture = function(time){
		if(time == this.last_future_time){
			return this.last_future;
		}
		var dt = time - this.time;

		
		var nx = [this.x[0] + this.v[0]*dt + .5*this.a[0]*dt*dt + 1.0/6 * this.j[0]*dt*dt*dt,
		          this.x[1] + this.v[1]*dt + .5*this.a[1]*dt*dt + 1.0/6 * this.j[1]*dt*dt*dt];
      	var nv = [this.v[0] + this.a[0]*dt + .5*this.j[0]*dt*dt,
      	          this.v[1] + this.a[1]*dt + .5*this.j[1]*dt*dt];
      	
      	// Force fixed swept area to prevent orbit degredation.
      	var p_m = null;
      	if (this.parent_moment != null){
	      	p_m = this.parent_moment.getFuture(time);
	      	var rel_x = subtract(nx, p_m.x);
			var rel_v = subtract(nv, p_m.v);
			
	      	var new_swept_area = Math.abs(cross(rel_x, rel_v));
	      	if(Math.abs(new_swept_area) > AREA_FOR_SWEEP){// Don't change flying straight up.
		      	var s = this.swept_area/new_swept_area;
	      		s = Math.sqrt(s);
		      	nv[0] = p_m.v[0] + rel_v[0]*s;
		      	nv[1] = p_m.v[1] + rel_v[1]*s;
		      	nx[0] = p_m.x[0] + rel_x[0]*s;
		      	nx[1] = p_m.x[1] + rel_x[1]*s;
	      	}
      		
      	
	      	// If player ship check for shifting orbit
	      	if(this.entity.type == SHIP && time < current_time + ORBIT_SHIFT_TIME){
	      		var transfers = p_m.entity.possible_transfers;
	      		var best_error = 9999999999999999;
	      		var best_parent = null;
	      		// Determine best parent by sphere of influence
	      		for(var k = 0 ; k < transfers.length; k++){
	   				var mpm = transfers[k].getMoment(time);
	  				var rel_x = subtract(nx, mpm.x);
	   				var d2 = dot(rel_x, rel_x);
	   				var sphere = transfers[k].mass*SPHERE_OF_INFLUENCE_PER_MASS ;
	   				sphere = sphere*sphere;
	   				if( d2 < sphere && d2 < best_error){
	   					best_error = d2;
	   					best_parent = mpm;
	   				}
	      			
	      		}
	      		if(best_parent != null){
	      			p_m = best_parent ;
	      			
	      		}
	      		
	      	}
      	}
      	
      	this.last_future_time = time;
   		if(this.parent_moment == null){ // If not orbitting (should only be sun).
   			this.last_future = new Moment(this.entity, p_m, time, nx, nv);
   		}else if(p_m.entity == this.parent_moment.entity){ // If same parent.
   			this.last_future = new Moment(this.entity, p_m, time, nx, nv, this.swept_area, this.safe_step_time);
   		}else if(time - this.time < MAX_ORBIT_SHIFT_STEP){// If new parent but step is small enough.
   			this.last_future = new Moment(this.entity, p_m, time, nx, nv);
   		}else{ // New parent and step is too large.
   			//Split step in half and recurse.
   			this.last_future = this.getFuture(this.time  + (time - this.time)*.5).getFuture(time);
   		}
      	return this.last_future;
    }
}