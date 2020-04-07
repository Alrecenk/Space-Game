// TODO fold these into a proper object to pass around
var mission = [];
var accomplishments = "New game started!";
var coin = 0;
var science = 0;

// This class keeps track of the compacted history of the ship in a way that is compatible with science and mission objectives.
function ShipLog(save){
	
	this.action=[] ; // Action taken
	this.entity=[]; // Location taken at
	this.angle_moved=[] ; // angle drifted
	this.last_rel_x; // last relative position while drifting.
	this.start_time=[] ;
	
	this.addReset = function(reset_to){
		this.action.push(RESET);
		this.entity.push(reset_to);
		this.angle_moved.push(0);
		this.start_time.push(current_time);
	}
	this.addReset(); // Add reset to start things off.
	
	// Streaming updates from the ship keep the log up to date.
	this.addAction = function(ship, moving){
		var last = this.action.length-1;
		var m = ship.getMoment(current_time);
		if(ship.landed && this.action[last] != LAND){
			this.action.push(LAND);
			this.entity.push(m.parent_moment.entity);
			this.angle_moved.push(0);
			this.start_time.push(current_time);
		}else if(moving){
			if(this.action[last] != MANUEVER || this.entity[last] != ship.getParent()){
				this.action.push(MANUEVER);
				this.entity.push(m.parent_moment.entity);
				this.angle_moved.push(0);
				this.start_time.push(current_time);
				this.last_rel_x = subtract(m.x,  m.parent_moment.x);
			}else{
				var rel_x = subtract(m.x,  m.parent_moment.x);
				var dtheta = Math.acos(dot(rel_x, this.last_rel_x) / Math.sqrt(dot(rel_x, rel_x)*dot(this.last_rel_x, this.last_rel_x)));
				if(!isNaN(dtheta)){
					this.angle_moved[last] += dtheta;
				}
				this.last_rel_x = rel_x;
			}
		}else if(!ship.landed && !moving){
			if(this.action[last] != DRIFT || this.entity[last] != m.parent_moment.entity){
				this.action.push(DRIFT);
				this.entity.push(m.parent_moment.entity);
				this.angle_moved.push(0);
				this.start_time.push(current_time);
				this.last_rel_x = subtract(m.x,  m.parent_moment.x);
			}else{
				var rel_x = subtract(m.x,  m.parent_moment.x);
				var dtheta = Math.acos(dot(rel_x, this.last_rel_x) / Math.sqrt(dot(rel_x, rel_x)*dot(this.last_rel_x, this.last_rel_x)));
				if(!isNaN(dtheta)){
					this.angle_moved[last] += dtheta;
				}
				this.last_rel_x = rel_x;
			}
		}
		this.updateScience();
		this.updateMission();
	}
	
	// Checks for updates to science achievements.
	this.updateScience = function(){
		var last = this.action.length-1;
		var a = this.action[last];
		var e = this.entity[last];
		if(e.type == PLANET && e.name!= "Sun"){
			// Check for flyby
			if((a == DRIFT || a == MANUEVER) && !e.science_fly_by){
				e.science_fly_by = true;
				science += SCIENCE_FLY_BY_REWARD;
				accomplishments += "\nFly by of " + e.name +" achieved!";
				save();
			}
			// check for orbit
			if(a == DRIFT && this.angle_moved[last] > 2*Math.PI && !e.science_orbit){
				e.science_orbit = true;
				science += SCIENCE_ORBIT_REWARD;
				accomplishments += "\nOrbit of " + e.name +" achieved!";
				save();
			}
			
			if(a == LAND && !e.science_land){
				e.science_land = true;
				science += SCIENCE_LAND_REWARD;
				accomplishments += "\nLand on " + e.name +" achieved!";
				save();
			}
			if(a == LAND && e.has_colony){ // If returned to a colonized location.
				for(var k = last-1 ; k>0 && this.action[k] != RESET;k--){
					if(this.action[k] == LAND && !this.entity[k].science_return){
						this.entity[k].science_return = true;
						science += SCIENCE_RETURN_REWARD;
						accomplishments += "\nReturn from " + this.entity[k].name +" achieved!";
						save();
					}
				}
			}
		}
	}
	
	//Checks for completed missions
	this.updateMission = function(){
		var last = this.action.length-1;
		var a = this.action[last];
		var e = this.entity[last];
		if(e.type == PLANET && e.name!="Sun"){
			for(var mi = 0 ; mi < mission.length; mi++){
				var m = mission[mi];
				if(m.type == GOTO_MISSION && e == m.to && a == LAND){ // If on location that gave mission
					coin+=m.coin;
					mission.splice(mi, 1); // Remove mission
					save();
					accomplishments += "\nCompleted mission " + m.getTitle() +".";
				}
			}
		}
	}
		
	
	this.toString = function(){
		var string = "";
		var last_action = RESET;
		for( var k = 0; k < this.action.length; k++){
			var seconds = Math.round(this.start_time[k]/50);
			var minutes = Math.round(seconds/60);
			seconds = seconds%60;
			var hours = Math.round(minutes/60);
			minutes = minutes%60;
			var days = Math.round(hours/24);
			hours = hours%24;
			string +=  days+"d "+hours+"h "+minutes+"m " + seconds+"s: " ;
			
			if(this.action[k] == RESET){
				string += "Respawned\n";
				last_action = RESET;
			}else if(this.action[k] == MANUEVER){
				var angle = (this.angle_moved[k]/(2*Math.PI));
				angle = Math.round(angle*100)/100;
				if(last_action == LAND || last_action == RESET){
					string += "Launched from " + this.entity[k].name +"(" + angle + " revolutions).\n";
				}else{
					string += "Orbital manuever near " + this.entity[k].name +" (" + angle + " revolutions).\n";
				}
				last_action = MANUEVER;
			}else if(this.action[k] == LAND){
				string += "Landed on " + this.entity[k].name +".\n";
				last_action = LAND;
			}else if(this.action[k] == DRIFT){
				var angle = (this.angle_moved[k]/(2*Math.PI));
				angle = Math.round(angle*100)/100;
				if(last_action == DRIFT){
					string += "Orbital transfer to " + this.entity[k].name + ", drifted for " + angle  + " revolutions.\n";
				}else{
					string += "Drifted near " + this.entity[k].name + " for " + angle + " revolutions.\n";
				}
				last_action = DRIFT;
			}else{
				string += " Logged In \n"
			}
		}
		return string ;
	}
			
}

// May return null if no good mission available.
//TODO make better missions
function generateMission(ship){
	var giver = ship.getParent();
	var steps = Math.round(Math.random()*100);
	var target = null;
	var k = 0 ;
	while(target == null){
		if(k >= solar_system.length){
			k = 0 ;
		}
		var p = solar_system[k];
		if(p.name == "Sun" || p.type != PLANET){ // pass unlandables.
			k++;
		}else{
			steps--;
			// Far more likely to get places you've scienced for missions.
			if(p.science_fly_by){
				steps-=2;
			}
			if(p.science_orbit){
				steps--;
			}
			if(p.science_land){
				steps-=2;
			}
			if(steps <=0){
				target = p;
			}
			k++;
		}
	}
	// Make mars and the moon more likely until you've landed on them.
	// Counter to normal logic but having these pop up in missions at the beginning of the game is good.
	if(!solar_system[2].science_land && Math.random()<.6){
		target = solar_system[2];// Moon
	}else if(solar_system[2].science_land && !solar_system[3].science_land && Math.random()<.5){
		target = solar_system[3];// Mars
	}
	
	if(target == giver){
		return null;
	}else{
		reward = 10;
		// If far away + 20 coins.
		if(giver.getParent() != target && target.getParent() != giver &&
				(giver.getParent() != target.getParent() || giver.getParent().name  == "Sun")){
			reward += 20;
		}
		//If You've never landed + 30
		if(!target.science_land){
			reward += 30;
		}
		
		reward+= Math.round(Math.random()*10);
		return new Mission(giver, target, reward);
	}
	
}


function Mission(giver, target, reward){
	this.start_time = current_time;
	this.from = giver;
	this.to = target;
	this.coin = reward;
	this.type = GOTO_MISSION;
	
	this.getTitle = function(){
		return "Visit " + this.to.name +"("+this.coin+")";
	}
	this.toString = function(){
		return "Visit " + this.to.name +" for " + this.coin +" coins.";
	}
	
}



	 