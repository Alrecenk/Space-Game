function Entity(name_i, parent_i, radius_i, mass_i, color_i, x_i, v_i, t_i){
	// base stats
	this.name = name_i;
	this.radius = radius_i;
	this.mass = mass_i;
	this.color = color_i;
	this.type = PLANET;
	this.fixed_orbit = false;
	this.period = -1; // computed when orbit is fixed.
	this.landed = false; // Used for ship landing.
	this.possible_transfers = [] ; // Entities possible to transfer to from this one.
	
	// Station upgrades
	this.has_fuel = false; // Equivalent to having a station
	this.has_colony = false;
	this.has_lab = false;
	this.has_launchpad = false;
	this.has_brakes = false;
	this.has_satellite = false;
	
	// Science status
	this.science_fly_by = false;
	this.science_orbit = false;
	this.science_land = false;
	this.science_return = false;
	
	//Physics Info
	var parent_moment = null;
	if(parent_i !=null){
		parent_moment =  parent_i.getMoment(t_i);
	}
	//this.moment = [new Moment(this, parent_moment, t_i, x_i, v_i)];
	this.moment = new ArrayList(1000);
	this.moment.set(0, new Moment(this, parent_moment, t_i, x_i, v_i));
	// Adds a new moment dt past the current last moment
	this.addFuture = function addFuture(dt){
		//var last_moment = this.moment[this.moment.length-1];
		var last_moment = this.moment.get(this.moment.length-1);
		this.moment.push(last_moment.getFuture(last_moment.time + dt));
	}
	
	// Adds moments dt apart until the time is passed.
	this.addFutureUntil = function(time){
		//var last_moment = this.moment[this.moment.length-1];
		var last_moment = this.moment.get(this.moment.length-1);
		while(last_moment.time < time){
			this.moment.push(last_moment.getFuture(last_moment.time + last_moment.safe_step_time));
			//last_moment = this.moment[this.moment.length-1];
			last_moment = this.moment.get(this.moment.length-1);
		}
	}
	
	// Returns the index of the moment just before the given time.
	this.getMomentIndex = function(time){
		var min = 0 ;
		var max = this.moment.length-1;
		// Check if within available data.
		if(this.moment.get(min).time > time){
			
			console.log("Requested time earlier than earliest moment for " + this.name + "  " + this.moment.get(min).time + " > " + time);
			 var err = new Error();
			 console.log( err.stack);
			 
			return min;
		}
		if(this.moment.get(max).time < time){
			this.addFutureUntil(time);
			return max;
		}
		
		while(max-min > 1){
			var mid = Math.floor((max + min)/2);
			if(time >= this.moment.get(mid).time){
				min = mid;
			}else{
				max = mid;
			}
		}
		return min ;
	}
	
	// Returns a moment in time for this entitity(positiob, velocity, acceleration at at a given time)
	this.getMoment = function(time){
		if(this.landed){
			var m_old = this.moment.get(this.getMomentIndex(retrieval_time)).getFuture(time); // Get position
			var new_parent = m_old.parent_moment.entity.getMoment(time);
			var new_moment = new Moment(this, new_parent, time, [new_parent.x[0], new_parent.x[1] - new_parent.entity.radius], new_parent.v, null);
			//this.moment =[new_moment]; // Keeps true positionjup to dateand preventsteleporting into the sun.
			this.moment = new ArrayList(2);
			this.moment.set(0, new_moment);
			return new_moment;
		}else if(this.fixed_orbit){
			var orbits = Math.floor((time - this.moment.get(0).time)/this.period);
			var retrieval_time = time - this.period*orbits;
			var m_old = this.moment.get(this.getMomentIndex(retrieval_time)).getFuture(retrieval_time); // Get position in orbit
			// get relative to parent at old time
			var d_x = subtract(m_old.x, m_old.parent_moment.x);
			var d_v = subtract(m_old.v, m_old.parent_moment.v);
			// get parent in real time
			var new_parent = m_old.parent_moment.entity.getMoment(time);
			var x = add(d_x, new_parent.x); // Make absolute by adding new parent data.
			var v = add(d_v, new_parent.v);
			return new Moment(this, new_parent, time, x, v, this.moment.get(0).swept_area);
		} else{
			var min = this.getMomentIndex(time);
			// If exact match (should happen most of the time actually since we do a lockstep).
			if(this.moment.get(min).time == time){
				return this.moment.get(min);
			}else{
				return this.moment.get(min).getFuture(time);
			}
		}
	}
			
	var print = 1;
	// Draws this object atthe given time and optionally its orbit on the given view
  	this.draw = function(camera, time, navigation_level, thrust_draw=0){
		var m = this.getMoment(time);
		
		if(this.type == ASTEROID){
			camera.drawCircle(m.x[0], m.x[1], this.radius, this.color);
		}else if(this.type == PLANET){
    		camera.drawSphere(m.x[0], m.x[1], this.radius, this.color);
    	}else if(this.type == SHIP){
    		console.log("Error: generic entity draw called on ship!");
    	}
    	var p = m.parent_moment;
		if(this.type != ASTEROID && p!=null && !this.landed){
	    	this.drawOrbit(camera, time, navigation_level);
		}
	}
	
	this.drawOrbit = function(camera, time, navigation_level=1, land_level=0){
		
		var current_moment = this.getMoment(time);
		
		if(current_moment.parent_moment != null){
			var shift_line = false;
			var crash = false;
			var last_good_p = null;
			var cx=null, lcx =null;
			var lastp = null;
			var shifts = 0 ;
			var current_x = current_moment.entity.getMoment(time).x;
			var current_parent_x = current_moment.parent_moment.entity.getMoment(time).x;
			orbit_color = this.color;
			if(this.type == SHIP){
				orbit_color = "#80FF80";
			}
			var in_orbit_shift = false;
			for(var k=0; k < this.moment.length && shifts < SHIFTS_TO_DISPLAY[navigation_level] && !crash;k++){
				var m = this.moment.get(k);
				var p = m.parent_moment;
				if(distanceSquared(m.x,p.x) < p.entity.radius*p.entity.radius){
					crash = true;
					var cx = add(subtract(m.x,p.x),current_parent_x) ;
					var cv = subtract(m.v,p.v) ;
					var s = p.entity.radius * .1 ;
					var m2 = MAX_LAND_SPEED[land_level] * MAX_LAND_SPEED[land_level];
					if(p.entity.has_brakes){
						m2 *= STATION_BREAK_EFFECT*STATION_BREAK_EFFECT;
					}
					if(distanceSquared(m.v,p.v)> m2){
						camera.drawLine(cx[0]+s, cx[1]+s, cx[0]-s, cx[1]-s, "#FF4040",2);
						camera.drawLine(cx[0]+s, cx[1]-s, cx[0]-s, cx[1]+s, "#FF4040",2);
					}else{
						camera.drawCircle(cx[0], cx[1], null, orbit_color, 2);
					}
				}
				if(m.time > current_time || this.fixed_orbit){
					if(p.entity!= lastp){
						current_parent_x = p.entity.getMoment(time).x;
					}
					var cx = add(subtract(m.x,p.x),current_parent_x) ; // Get future positionrelative to future parent and draw relative to current parent.
					if(lcx!=null){
						if(p.entity == lastp){ // If no orbit shift
							if(shift_line){
								if(last_good_p != null){
									shifts++;
									if(shifts >= SHIFTS_TO_DISPLAY[navigation_level]){
										break;
									}
									// Draw yellow line cutting across from last stablish orbit.
									camera.drawLine(lcx[0], lcx[1], last_good_p[0], last_good_p[1], "#FFFF80");
									
								}else{
									in_orbit_shift = true;
									// Draw yellow line from ship because stable ish was too long ago.
									camera.drawLine(lcx[0], lcx[1], current_x[0], current_x[1], "#FFFF80");
								}
								shift_line = false;
							}
							// Draw main orbit line in stable orbit.
							camera.drawLine(lcx[0], lcx[1], cx[0], cx[1], orbit_color ); 
							last_good_p = cx; // keep track of last point on a green line
						}else{// If orbit shift is happening
							shift_line = true;
						}
					}else{
						first_cx = cx;
					}
				}
				lcx = cx ;
				lastp = p.entity;
			}
			
			// Draw line from ship to connect to orbit if necesarry
			if(!this.fixed_orbit && !in_orbit_shift){
				camera.drawLine(first_cx[0], first_cx[1], current_x[0], current_x[1], orbit_color);
			}
		}else{
			// Draw path without a parent
		}
	}
	
	// Removes all moments before time except 1.
	this.cleanOldMoments = function(time){
		if(!this.fixed_orbit && !this.landed){
			var min = Math.max(this.getMomentIndex(time) - 5, 0);
			var keep = this.moment.length -min;
			for(var k=0;k<keep;k++){
				this.moment.set(k, this.moment.get(k+min));
			}
			this.moment.length = keep;	
		}
	}
	
	// Approximately preloads one until there isa full orbit of trajectory.
	this.computeOrbit = function(orbits = 1){
		if(!this.fixed_orbit && !this.landed){
			var target_angle = orbits*2*Math.PI ;
			var angle = 0 ;
			for(var k = 0 ; k < this.moment.length-1;k++){
				angle += this.moment.get(k).delta_angle;
			}
			var last_moment = this.moment.get(this.moment.length-1);
			var steps = 0 ;
			while(angle < target_angle && steps < MAX_ORBIT_STEPS){
				var new_moment = last_moment.getFuture(last_moment.time + last_moment.safe_step_time);
				this.moment.push(new_moment);
				angle += last_moment.delta_angle;
				last_moment = new_moment;
				steps++;
			}
		}
	}
	
	this.computePeriod = function(){
		var last = this.moment.length-1;
		if(this.moment.get(last).parent_moment != null){
			// Calculate the conic section parameters to get exact period.
			var m = this.moment.get(last), p = this.moment.get(last).parent_moment;
			var rx = m.x[0] - p.x[0];
			var ry = m.x[1] - p.x[1];
			var dxdt = m.v[0] - p.v[0];
			var dydt = m.v[1] - p.v[1];
			
			var s = 1/(G*p.entity.mass) ;
			var theta = Math.atan2(ry,rx);
			var r = Math.sqrt(rx*rx+ry*ry);
			var l = rx*dydt - ry*dxdt ; 
			var c = l*l*s;
			var drdtheta = r * (rx * dxdt + ry*dydt) / l;
			var cr1 = (c/r-1);
			var thetaminusa = Math.atan(c * drdtheta / ( r*r * cr1));
			var b = cr1 / Math.cos(thetaminusa);
			
			if(Math.abs(cr1) < .00001){
				thetaminusa = 0;
				b = 0 ;
			}
			this.period = 2*Math.PI*Math.sqrt(Math.pow(c/(1-b*b), 3) / (p.entity.mass*G));	
			
		}
	}
	
	//Calculates the necessary elements to handle a fixed orbit item.
	this.fixOrbit = function(){
		// Remove anything before orbit fixed.
		this.moment.set(0, this.moment.get(this.moment.length-1));
		this.moment.length = 1;
		if(this.moment.get(0).parent_moment != null){
			this.computeOrbit();
			this.computePeriod();
			this.fixed_orbit = true;
		}
	}
	
	
	// Applies an acceleration at the given time.
	this.applyThrust = function(time, a, navigation_level=0){
		var min = this.getMomentIndex(time);
		var t_m = this.moment.get(min).getFuture(time);
		t_m = new Moment(this, t_m.parent_moment, time, t_m.x, [t_m.v[0] + a[0], t_m.v[1] + a[1]] );
		
		//this.moment = [this.moment.get(min), t_m];
		var new_moment = new ArrayList(1000);
		new_moment.set(0, this.moment.get(min));
		new_moment.set(1, t_m);
		this.moment = new_moment;
		if(this.type == SHIP){
			this.computeOrbit(ORBITS_TO_PREDICT[navigation_level]);
		}else{
			this.computeOrbit(1.1);
		}
	}
	
	// Returns the parent entity of this entity
	this.getParent = function(time){
		var p_m = this.getMoment(time).parent_moment;
		if(p_m == null){
			return null;
		}else{
			return p_m.entity;
		}
	}
	
	// Computes the list of every object you could transfer to orbit from this one.
	// must be called after all items have been initialized
	this.prepareTransfers = function(){
		var parent = this.getParent();
		this.possible_transfers = [];
		if(parent !=null){
			this.possible_transfers.push(parent);
		}
		for(var k=0;k<solar_system.length;k++){
			if(solar_system[k].type == PLANET &&(solar_system[k].getParent() == this || solar_system[k].getParent() == parent)){
				this.possible_transfers.push(solar_system[k]);
			}
		}
	}
	
	this.createChildEntity = function(name, radius, color, mass, relative_position, counter_clockwise=false){
		var relative_velocity = getStableVelocity(relative_position, this.mass, counter_clockwise);
		var moment = this.getMoment(current_time);
		return new Entity(name, this, radius, mass, color, add(relative_position, moment.x), add(relative_velocity, moment.v), current_time);
	}
	
	//Returns a stable velocity of an object orbiting at the given position relative to the given mass.
	function getStableVelocity(position, mass, counter_clockwise = false){
		var v = [-position[1], position[0]];
		var r = Math.sqrt(dot(v,v));
		var speed = Math.sqrt(r*mass*G)/r;
		v[0]*=speed/r;
		v[1]*=speed/r;
		if(counter_clockwise){
			v[0]*=-1;
			v[1]*=-1;
		}
		return v ;
	}
		
	
}