var G = 10; // strength of gravity.
var BASE_SPEED_RATE = 50; // How fast we go at x1
var DEFAULT_TIME_STEP= 100000000; // Used for unparented entities. Really should only be one thing.
var MAX_ZOOM = 100000000; // maximum amount you can zoom out.
var SHIP = 1; // entity type enum for ship.
var PLANET = 0; // entity type enum for planet
var ASTEROID = 2; // entity type for asteroid
var ASTEROIDS = 200; // number of asteroids
var ASTEROID_RADIUS = 2000;
var MAX_DELTA_THETA = .04; // Maximum amount of change in theta allowed by a single integration step
var MAX_DELTA_THETA_ASTEROID = .5;
var MAX_RELATIVE_MOVEMENT = 1;
var ACCEPTABLE_TIME_STEP = 100 ;// Steps of this size will be allowed even if they violate maxes.
var AREA_FOR_SWEEP = .000001; // Required area to perform orbit sweep correction.
//var ERROR_REDUCTION_FOR_ORBIT_SHIFT = .99;
var MAX_ORBIT_STEPS = 200; // Maximum number of moments to calculate in one call when trying to predict a path.
var ORBIT_SHIFT_TIME = 10000000000; // Maximum time to look forward for orbit shifts.
var MAX_ORBIT_SHIFT_STEP = .1; // Make dt allowed when shifting orbits.
var ORBITS_TO_PREDICT = [1.1,1.5,2]; // Orbits to predict ahead for non-fixed items.
var SHIFTS_TO_DISPLAY = [1,2,3]; // Orbit display cuts off after this many shifts.
var SPHERE_OF_INFLUENCE_PER_MASS = 3000; // affects radius where orbit shifts to an object.
var SATELLITE_RANGE_PER_MASS = 150 ; // Affects radius where satellite refuels ship.
var FUEL_BAR = [20,20,400,40]; // UI location of fuel bar.
var MAX_LAND_SPEED = [.3, .35, .4, .45, .5, .6]; // Maximum land speed for unupgraded planets.
var STATION_BREAK_EFFECT = 1.5 ; // speed multiplier for benefit of landing strip upgrade.
var LAUNCHPAD_BONUS_FUEL = [400, 425, 450, 475, 500]; // launch fuel when launchpad is present.
var LAUNCH_VELOCITY = .1; // initial velocity when launching.
var BONUS_ACC = [.0014, .0015, .0016, .0017, .0018]; // acceleration provided by launch boosters.
var BONUS_DRAIN = 1.5; // fuel drain rate of launch boosters.
var THRUST_RATE = [1.2, 1.2, 1.1, 1, 0.95, 0.9]; // thrust fraction increase/frame as button is held in.
var TURN_RATE = 2.5; // turn rate of ship.
var THRUST_POWER = [0.0007, .00075, 0.0008, 0.00085, 0.0009, 0.001]; // force applied by thrust at half power.
var MAX_FUEL = [1500,2000,2500,3000,3500,4000,5000,6000,7000,8000];


// Game states.
var SPACE = 0 ;
var MAIN_MENU = 1;
var BUILD_MENU = 2;
var COLONY_MENU = 3;
var LAB_MENU = 4;
var SCIENCE_MENU = 5;
var TECH_MENU = 6;

var STATION_COST = 5;
var LAUNCHPAD_COST = 3;
var BRAKES_COST = 5;
var COLONY_COST = 7;
var LAB_COST = 10;
var SATELLITE_COST = 20;
var FUEL_COST = 8;
var THRUST_COST = 10;
var LAUNCH_COST = 10;
var LAND_COST = 5;
var NAVIGATION_COST = 2;
var SCIENCE_FLY_BY_REWARD = 1;
var SCIENCE_ORBIT_REWARD = 2;
var SCIENCE_LAND_REWARD = 2;
var SCIENCE_RETURN_REWARD = 2;
var SCIENCE_LAB_REWARD = 3;

// Log action types
var RESET = 0;
var DRIFT = 1;
var MANUEVER = 2;
var LAND = 3;

//Mission types
var GOTO_MISSION = 1;

// A Few globals, don't tell anyone.
var solar_system; // an array of entities for the solar system
var current_time; // current game time
var context; // graphics context for draw functions