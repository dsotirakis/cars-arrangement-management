var express = require("express");
var app = express();
var bodyParser = require('body-parser');
const TreeMap = require("treemap-js");
const MultiMap = require('multimap');
const sortMap = require('sort-map');
const arraySort = require('array-sort');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.set('view engine', 'pug');
app.set('views', './views');

//app.use(express.static("public"));
app.use(express.static("node_modules"));

var mongoose = require("mongoose");
mongoose.Promise = global.Promise;
mongoose.connect("mongodb://localhost:27017/node-demo2");

// Define User Model
var nameSchema = new mongoose.Schema({
    firstName: String,
    lastName: String
}, {versionKey: false});

var User = mongoose.model("User", nameSchema);

// Define Category Model
var categorySchema = new mongoose.Schema({
	categoryName: String
});

var Category = mongoose.model("Category", categorySchema);

var carSchema = new mongoose.Schema({
    carName: String,
    categoryName: String,
    weight: {type: Number, min: 1}
});

var Car = mongoose.model("Car", carSchema);
// Define index page
app.get("/", (req, res) => {
    res.render("index");
    var users = getUsers();
    console.log("lelos");
    console.log(users.length);
});

var eventSchema = new mongoose.Schema({
	startDate : Date,
	endDate : Date,
	categoryName : String,
	carName: String
});

var Event = mongoose.model("Event", eventSchema);

app.get("/", (req, res) => {
	db.users.find({}, function(err, docs){
	res.render("index", {users:docs});
	});
});


function getUsers(){
	User.find({}, function(err, users) {
  		if (err) throw err;
		
  		// object of all the users
  		return users;
	});
};

// Define category page
app.get("/category", (req, res) => {
    res.render("category");
});

app.get("/car", (req, res) => {
	mongoose.model("Car").find(function(err, cars) {
		mongoose.model("Category").find(function (err, categories) {
   			res.render('car', {
				categories : categories,
				cars : cars
			});
		});
	});
});

app.get("/event", (req, res) => {
	mongoose.model("Event").find(function(err, events) {
		mongoose.model("Category").find(function (err, categories) {
   			res.render('event', {
				categories : categories,
				events : events
			});
		});
	});
});

app.post("/addname", (req, res) => {
    var myData = new User(req.body);
    myData.save()
        .then(item => {
            res.send("Name saved to database");
        })
        .catch(err => {
            res.status(400).send("Unable to save to database");
        });
});

app.post("/addCategory", (req, res) => {
	var myData = new Category(req.body);
	myData.save().then(item => {
		res.send("Category saved to database!");
	})
	.catch(err => {
		res.status(400).send("Unable to save to database");
	});
});

app.post("/addCar", (req, res) => {
	var myData = new Car(req.body);
	myData.save().then(item => {
		res.send("Car saved to database!");
		console.log(req.body.categoryName);
	})
	.catch(err => {
		res.status(400).send("Unable to save to database");
	});
});

app.post("/addEvent", (req, res) => {
	var myData = new Event(req.body);
	var start = new Date(myData.startDate);
	start = start.getTime() / 1000;
	var stop = new Date(myData.endDate);
	stop = stop.getTime() / 1000;
	if (start != stop){
		myData.save().then(item => {
			
			Event.find({categoryName:req.body.categoryName}, function(err, events) {
		  		if (err) throw err;

				Car.find({categoryName:req.body.categoryName}, function(err, cars) {
		  			if (err) throw err;
					

					console.log("events length: " + events.length);
					// Initialize auxiliary variables.
					var eventsArr = [];
					// Fill eventsMap. The map key is the total event duration in minutes,
					// while the values are the start and stop seconds as a unix timestamp.
					for (var i = 0; i < events.length; i++){
						
						// Initialize auxiliary variables.
						var criticalSeconds = [];
						var startDate_toDate = new Date(events[i].startDate);
						var endDate_toDate = new Date(events[i].endDate);
						
						// Fill critical seconds array.
						var criticalSeconds = [startDate_toDate.getTime() / 1000,
											   endDate_toDate.getTime() / 1000];

						// Calculate the total duration of the event.
						var totalTime = (endDate_toDate.getTime() - startDate_toDate.getTime()) / (3600*1000);
						
						// Fill the events map.
						eventsArr.push({eventId: events[i].id, totalTime: totalTime, criticalSeconds: criticalSeconds});
					}

					arraySort(eventsArr, 'totalTime', {reverse: true});
					// Sort the multimap, based on the event's total time.
					var maxDuration     = -1;
					var count		    =  0;
					var index 		    = -1;
					var durationsToSort = [];
					var breakFlag 		= false;

					for (var i = 0; i < durationsToSort.length; i++){
						console.log(eventsArr[i].totalTime);
					}

					var bookedCarsArr = [];
					var bookedCarsArrToAdd = [];
			
					for (var i = 0; i < eventsArr.length; i++){
						if (bookedCarsArr.length > 0){

							bookedCarsArrToAdd = [];
							
								for (var k = 0; k < cars.length; k++) {

									var tempBookedArr = bookedCarsArr.filter(function (element){
										return element.carName == cars[k].carName;
									});

									if (tempBookedArr.length == 0){
										bookedCarsArrToAdd.push({eventId: eventsArr[i].eventId, carName: cars[k].carName, criticalSeconds: eventsArr[i].criticalSeconds});
										break;
									}
									
									var toAdd = false;
									var overlapFlag = false;
									for (var j = 0; j < tempBookedArr.length; j++){
										if (cars[k].carName == tempBookedArr[j].carName) {
											if (((eventsArr[i].criticalSeconds[0] >= tempBookedArr[j].criticalSeconds[0]) && (eventsArr[i].criticalSeconds[0] <= tempBookedArr[j].criticalSeconds[1])) ||
										    	((eventsArr[i].criticalSeconds[1] >= tempBookedArr[j].criticalSeconds[0]) && (eventsArr[i].criticalSeconds[1] <= tempBookedArr[j].criticalSeconds[1]))){
										    	overlapFlag = true;
										    	console.log("overlapping: " + i + " " + k);
										    	
										    	continue;
											}
											else{
												if (!toAdd){
													console.log("not: " + i + " " + k);
													var tempBookedElement = [];
													tempBookedElement.push({eventId: eventsArr[i].eventId, carName: cars[k].carName, criticalSeconds: eventsArr[i].criticalSeconds});
													
													console.log(tempBookedElement);
													toAdd = true;
												}
											}
										}
									
									}
									
									if (toAdd && !overlapFlag){
										bookedCarsArrToAdd = bookedCarsArrToAdd.concat(tempBookedElement);
										breakFlag = true;
										console.log(bookedCarsArr);
									}
									else
										continue;

									if (breakFlag){
										breakFlag = false;
										break;
									}
										
								}

								if (bookedCarsArrToAdd.length == 0){
									console.log("Not availiable date!");
									break;
								}
								console.log("pwsGinetai");
								bookedCarsArr = bookedCarsArr.concat(bookedCarsArrToAdd);
						}
						else{
							bookedCarsArr.push({eventId: eventsArr[i].eventId, carName: cars[0].carName, criticalSeconds: eventsArr[i].criticalSeconds});
						}
					}

					for (var i = 0; i < bookedCarsArr.length; i++){
						Event.update({ _id: bookedCarsArr[i].eventId}, { $set: { carName: bookedCarsArr[i].carName }}, function(err, res) {
							if (err) {
								console.log("Something went wrong!");
							}
						});
					}
				});
			});

			redirectFunction(app, req.body.categoryName);
			res.redirect(301, '/groups' + req.body.categoryName);
			res.send("Event saved to database!");

			})
			.catch(err => {
				res.status(400).send("Unable to save to database");
			});
	}
	else{
		return res.status(400).send("You provided same date-time values. Please repeat the procedure.");
	}
});

// This function is used in order to redirect in the specific car category groups page.
function redirectFunction(app, catName) {
	app.get('/groups' + catName, function(req, res){
		mongoose.model("Car").find({categoryName: catName}, function(err, cars) {
			mongoose.model("Event").find(function (err, events) {
   				res.render('view', {
	   				cars : cars,
	   				events : events
				});
   			});
		});
	});
};


Event.find({}, function(err, events) {
  	if (err) throw err;
  	console.log("len: " + events.length);
});

app.get('/test', function(req, res){
	mongoose.model("Category").find(function(err, categories) {
   	res.render('first_view', {
	   categories : categories
   });
});
});


app.get('/groups', function(req, res){
	mongoose.model("Car").find({categoryName: "Sedan"}, function(err, cars) {
		mongoose.model("Event").find(function (err, events) {
   			res.render('view', {
	   			cars : cars,
	   			events : events
			});
   		});
	});
});

app.get('/show_events', function(req, res){
	mongoose.model("Event").find(function(err, events) {
   	res.render('showEvents', {
	   events : events
   });
});
});

app.listen(8080, function() {
	console.log("Open server.");
});
