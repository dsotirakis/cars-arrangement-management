var express = require("express");
var app = express();
var bodyParser = require('body-parser');
var autoIncrement = require('mongoose-auto-increment');
var stringify = require('json-stringify');
var yesno = require('yesno');
const TreeMap = require("treemap-js");
const MultiMap = require('multimap');
const sortMap = require('sort-map');
const arraySort = require('array-sort');
const prompt = require('node-ask').prompt;
const confirm = require('node-ask').confirm;
const multiline = require('node-ask').multiline;
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.set('view engine', 'pug');
app.set('views', './views');

//app.use(express.static("public"));
app.use(express.static("node_modules"));

var mongoose = require("mongoose");
mongoose.Promise = global.Promise;
mongoose.connect("mongodb://localhost:27017/node-demo2");
//autoIncrement.initialize(mongoose.createConnection("mongodb://localhost:27017/node-demo2"));

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
    weight: Number,
    brand : String,
});

var Car = mongoose.model("Car", carSchema);
// Define index page
app.get("/", (req, res) => {
    res.render("index");
    var users = getUsers();
});

var eventSchema = new mongoose.Schema({
	startDate : Date,
	endDate : Date,
	categoryName : String,
	carName: String,
	person: String
});

var Event = mongoose.model("Event", eventSchema);

app.get("/home", (req, res) => {
	mongoose.model("Category").find(function(err, categories) {
		res,render('home', {
			categories: categories,
		});
	});
});

app.get("/", (req, res) => {
	alert(";ee;");
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
	mongoose.model("Category").find(function (err, categories) {
 		res.render('category', {
			categories : categories,
		});
	});
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
	var today = new Date();
	var ran = new Date (2018,5,5);
	if (today < ran)
		console.log("today" + today);
	mongoose.model("Event").find(function(err, events) {
		mongoose.model("Category").find(function (err, categories) {
   			res.render('event', {
				categories : categories,
				events : events
			});
		});
	});
});

app.get("/view_group", (req, res) => {
	mongoose.model("Category").find(function (err, categories) {
		res.render('chooseGroups', {
			categories: categories
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

app.post("/updateCar", (req, res) => {
	console.log("body:: " + req.body.weight);
	console.log("lelos: " + req.body.new.length);
	var temp = [];
	var today = new Date();
	for (var i = 0; i < req.body.new.length; i++)
		temp.push(JSON.parse(req.body.new[i]));

	for (var i = 0; i < temp.length; i++)
		console.log("sa;a: " + temp[i].categoryName);
	
      // After succ
	for (var i = 0; i < req.body.weight.length; i++){

		console.log(temp[i].carName + " '' " + req.body.weight[i]);
		
		Car.update( {"carName" : temp[i].carName}, {"weight":req.body.weight[i]}).then(item => {
			console.log("Done");
		});
	}


	Event.find({categoryName:temp[0].categoryName}, function(err, events) {
		if (err) throw err;

		Car.find({categoryName:temp[0].categoryName}, null, {sort:{'weight':1}}, function(err, cars) {
		  	if (err) throw err;

		  	for (var i = 0; i < cars.length; i++)
		  		console.log("car: " + cars[i].carName + " " + cars[i].weight);
					
				// Initialize auxiliary variables.
				var eventsArr = [];
				// Fill eventsMap. The map key is the total event duration in minutes,
				// while the values are the start and stop seconds as a unix timestamp.
				for (var i = 0; i < events.length; i++){
					console.log("real: " + events[i].startDate);	
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
					if (today < startDate_toDate)
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

			redirectFunction(app, temp[0].categoryName);
			res.redirect(301, '/groups' + temp[0].categoryName);
			res.send("Event saved to database!");
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
	var today  = new Date();
	myData.save().then(item => {

			Event.find({categoryName:req.body.categoryName}, function(err, events) {
		  		if (err) throw err;

				Car.find({categoryName:req.body.categoryName}, null, {sort:{'weight':1}}, function(err, cars) {
		  			if (err) throw err;

		  			for (var i = 0; i < cars.length; i++)
		  				console.log("car: " + cars[i].carName + " " + cars[i].weight);
					
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
					if (today < startDate_toDate)
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
});

app.post("/deleteEvent", (req, res) => {

	console.log(req.body.event);
	var today = new Date();
	var temp = JSON.parse(req.body.event);
	Event.remove({ _id : temp.id }).then(item => {
		
		
			Event.find({categoryName:temp.categoryName}, function(err, events) {
		  		if (err) throw err;

				Car.find({categoryName:temp.categoryName}, null, {sort:{'weight':1}}, function(err, cars) {
		  			if (err) throw err;
					
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
					if (today < startDate_toDate)
						eventsArr.push({eventId: events[i].id, totalTime: totalTime, criticalSeconds: criticalSeconds});
					}
					for (var i = 0; i < events.length; i ++){
						if (events[i]._id === req.body.event)
							console.log("found");
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

			redirectFunction(app, temp.categoryName);
			res.redirect(301, '/groups' + temp.categoryName);
			res.send("Event saved to database!");

			})
			.catch(err => {
				res.status(400).send("Unable to save to database");
			});
});

app.post("/deleteCategory", (req, res) => {
	Category.remove({categoryName : req.body.categoryName}).then(item => {
		Event.deleteMany( {"categoryName" : req.body.categoryName}).then(item => {
			console.log("Done");
			
			Car.deleteMany( {"categoryName" : req.body.categoryName}).then(item => {
				console.log("Done");
			});
		
		});

		
	}).catch(res.redirect(301, '/groups' + req.body.categoryName));
});

app.post("/deleteCar", (req, res) => {
	
	var temp = JSON.parse(req.body.carName);
	var today = new Date();
	console.log("here: " + temp.categoryName)
	Car.remove({ carName: temp.carName }).then(item => {

		Event.deleteMany( {"carName" : temp.carName}).then(item => {
			console.log("Done");
		})

			console.log(item);	
			Event.find({categoryName:temp.categoryName}, function(err, events) {
		  		if (err) throw err;

				Car.find({categoryName:temp.categoryName}, null, {sort:{'weight':1}}, function(err, cars) {
		  			if (err) throw err;
					
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
					if (today < startDate_toDate)
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

			redirectFunction(app, temp.categoryName);
			res.redirect(301, '/groups' + temp.categoryName);
			res.send("Event saved to database!");

			})
			.catch(err => {
				res.status(400).send("Unable to save to database");
			});


	});

function filterEvents(eventData, categoryName) {

	var start = new Date(eventData.startDate);
	var stop  = new Date(eventData.endDate);	
	var today = new Date();


	if (today > stop || today > start){
		var string = "You can't provide dates before the current date-time. Please provide valid dates.";
		return string;
	}
	start = start.getTime() / 1000;
	stop = stop.getTime() / 1000;
	console.log(start + " " + stop);

	if (start == stop){
		var string = "Start and Stop date are the same, please change";
		return string;
	}

	if (start > stop){
		var string = "Start date is greater than the stop date. Repeat the procedure.";
		return string;
	}

	

	return "";
}

function getMessage(start, stop, categoryName) {
	return new Promise(function(resolve, reject) {
		Event.find({categoryName:categoryName}, function(err, events) {
		  	if (err) throw err;
			

			Car.find({categoryName:categoryName}, function(err, cars) {
			  	if (err) throw err;

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
	
				var carCountBef = 0, carCountAft = 0;
				for (var i = 0; i < eventsArr.length; i ++){
					if ((start >= eventsArr[i].criticalSeconds[0] - 10800 && start <= (eventsArr[i].criticalSeconds[1] + 10800))){
						carCountBef += 1;
						continue;
					}
				 	if ((stop >= eventsArr[i].criticalSeconds[0] - 10800 && stop <= (eventsArr[i].criticalSeconds[1] + 10800))){
						carCountAft += 1;
						console.log("in!");
					}
				}
	
				if (carCountBef >= cars.length){
					return resolve("Unavaliable dates. All cars are booked.");
				}
				else if (carCountAft >= cars.length){
					return resolve("Unavailable dates. All cars are booked.");
				}
				else
					return resolve("");
			});

		});
	});
}

app.post("/addEvent", (req, res) => {

	var myData = new Event(req.body);
	console.log("sasa: " + new Date(req.body.startDate));	
	console.log(req.body.categoryName)	
	var start = new Date(myData.startDate);
	var stop  = new Date(myData.endDate);	
	console.log("start: " + start);

	console.log("start: " + req.body.stopDate);
	var today = new Date();
	start = start.getTime() / 1000;
	stop = stop.getTime() / 1000;
	var message1 = filterEvents(myData, req.body.categoryName);
	console.log(message1);
	getMessage(start, stop, req.body.categoryName).then(message2 => {
	if (message1 === "" && message2 === ""){
		myData.save().then(item => {
			
			Event.find({categoryName:req.body.categoryName}, function(err, events) {
		  		if (err) throw err;

				Car.find({categoryName:req.body.categoryName}, null, {sort:{'weight':1}}, function(err, cars) {
		  			if (err) throw err;
					
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
					if (today < startDate_toDate)
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
													toAdd = true;
												}
											}
										}
									
									}
									
									if (toAdd && !overlapFlag){
										bookedCarsArrToAdd = bookedCarsArrToAdd.concat(tempBookedElement);
										breakFlag = true;
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


					var tempSum = [];
					for (var i = 0; i < cars.length; i++){
						var sum = 0;
						for (var j = 0; j < bookedCarsArr.length; j++){
							if (bookedCarsArr[j].carName === cars[i].carName){
								sum = sum + bookedCarsArr[j].criticalSeconds[1] - bookedCarsArr[j].criticalSeconds[0];
							}
						}
						console.log(cars[i].carName);
						tempSum.push({sum: sum, newCarNo: i});
					}

					for (var i = 0; i < tempSum.length; i++){
						console.log(tempSum[i]);
					}
					
      				tempSum.sort(function(a,b){return b.sum - a.sum});
      				console.log(tempSum);


					for (var j = 0; j < cars.length; j++){
						for (var i = 0; i < bookedCarsArr.length; i++){		
							if (bookedCarsArr[i].carName === cars[j].carName){
								Event.update({ _id: bookedCarsArr[i].eventId}, { $set: { carName: cars[tempSum[j].newCarNo].carName }}, function(err, res) {
									if (err) {
										console.log("Something went wrong!");
									}
								});
							}
						}
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
		res.status(400).send("Reasons: " + message1 + " - " +message2);
	}
});

});
// This function is used in order to redirect in the specific car category groups page.
function redirectFunction(app, catName) {
	app.get('/groups' + catName, function(req, res){
		mongoose.model("Car").find({categoryName: catName}, function(err, cars) {
			mongoose.model("Event").find(function (err, events) {
				mongoose.model("Category").find({categoryName: catName}, function(err, categories) {
   					res.render('view', {
						curCategory : catName,
	   					cars : cars,
	  	 				events : events,
	 	  				categories : categories
					});
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


app.post('/groups', function(req, res){
	var curCategory = req.body.categoryName;
	mongoose.model("Car").find({categoryName: req.body.categoryName}, function(err, cars) {
		mongoose.model("Event").find({categoryName: curCategory}, function (err, events) {
			mongoose.model("Category").find({categoryName: req.body.categoryName}, function(err, categories) {
   				res.render('view', {
					curCategory : curCategory,
	   				cars : cars,
	   				events : events,
	   				categories : categories
				});
   			});
		});
	});
});

app.post('/updateCarForm', function(req, res){
	var curCategory = req.body.categoryName;
	mongoose.model("Car").find({categoryName: req.body.categoryName}, function(err, cars) {
   				res.render('updateCar', {
					curCategory : curCategory,
	   				cars : cars
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
