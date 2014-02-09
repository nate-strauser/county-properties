Meteor.startup(function () {
	_.mixin({
	    compactObject : function(o) {
	         _.each(o, function(v, k){
	             if(!v)
	                 delete o[k];
	         });
	         return o;
	    }
	});


	var phantomHelpers = {};
	phantomHelpers.evaluate = function(page, func) {
		var args = [].slice.call(arguments, 2);
		var fn = "function() { return (" + func.toString() + ").apply(this, " + JSON.stringify(args) + ");}";
		return page.evaluate(fn);
	};

	phantomHelpers.onConsoleMessage = function(msg) {
		console.log(msg);
	};

	phantomHelpers.onLoadStarted = function() {
		loadInProgress = true;
		console.log("load started");
	};

	phantomHelpers.onLoadFinished = function() {
		loadInProgress = false;
		console.log("load finished");
	};

	phantomHelpers.onError = function(msg, trace) {

		var msgStack = ['ERROR: ' + msg];

		if (trace && trace.length) {
			msgStack.push('TRACE:');
			trace.forEach(function(t) {
				msgStack.push(' -> ' + t.file + ': ' + t.line + (t.function ? ' (in function "' + t.function +'")' : ''));
			});
		}

		console.error(msgStack.join('\n'));
	};


	var Future = Npm.require('fibers/future');
	var phantom = Meteor.require('node-phantom');
	var cheerio = Meteor.require('cheerio');
	path = Meteor.require('path');
	process.env.PATH += ':' + path.dirname(phantom.path);

	Meteor.methods({
		updatePropertyList: function () {
			var fut = new Future();
			var propertyData = {};
			phantom.create(function(err,ph) {
				return ph.createPage(function(err,page) {
					var testindex = 0, loadInProgress = false;

					page.onAlert = function(msg) {
						propertyData = msg;
					};

					page.onConsoleMessage = phantomHelpers.onConsoleMessage;
					page.onLoadStarted = phantomHelpers.onLoadStarted;
					page.onLoadFinished = phantomHelpers.onLoadFinished;
					page.onError = phantomHelpers.onError;

					var steps = [
						function() {
							page.open("http://www.co.monroe.pa.us/tax%20claim/repository.aspx");
						},
						function() {
							page.evaluate(function() {
								alert(document.querySelectorAll('html')[0].outerHTML);
							});
						}
					];

					var interval;
					interval = setInterval(function() {
						if (!loadInProgress && typeof steps[testindex] == "function") {
							console.log("step " + (testindex + 1));
							steps[testindex]();
							testindex++;
						}
						if (typeof steps[testindex] != "function") {
							console.log("complete!");
							clearInterval(interval);
							ph.exit();

							setTimeout(function(){
								fut.return(propertyData);
							},1000);
						}
					}, 5000);
				});
			});

			var result = fut.wait();

			//console.log(result);

			$ = cheerio.load(result);
			$("#GridView1 tr").each(function() {
				var cells = $(this).find("td");
				var data = {};

				data.parcel = $(cells[0]).text().trim();
				data.billableOwner = $(cells[1]).text().trim();
				data.legalDescription = $(cells[2]).text().trim();
				data.pin = $(cells[3]).text().trim();

				data.lastUpdatedTimestamp = (new Date()).getTime();
				data.lastUpdated = (new moment()).format('M/D/YY h:mm A');;
				data.lastSeenTimestamp = (new Date()).getTime();
				data.lastSeen = (new moment()).format('M/D/YY h:mm A');;

				data = _.compactObject(data);

				var existingProperty = Properties.findOne({"pin":data.pin});
				if(existingProperty){
					console.log('found prop, updating');
					Properties.update({"_id":existingProperty._id},{$set: data});
				}else{
					if(data.pin){
						console.log('found new prop, inserting');
						Properties.insert(data);
					}
				}
			});
			return;
		},
		updatePropertyDetails: function () {
			// console.log('updating property details');

			// console.log(moment().subtract('days', 1).toDate().getTime());

			// console.log(Properties.find({
			// 	pin:{$ne:null},
			// 	"detailsLastUpdatedTimestamp":null
			// }).count());

			// Properties.find({
			// 	pin:{$ne:null}
			// 	,
			// 	$or:[{
			// 		"detailsLastUpdatedTimestamp":null,
			// 		"detailsLastUpdatedTimestamp":{$lte:moment().subtract('days', 1).toDate().getTime()}
			// 	}]
			// })
			Properties.find({
				pin:{$ne:null},
				detailsLastUpdatedTimestamp:null
			}).forEach(function(property){
				var fut = new Future();
				var currentPin = property.pin;
				var propertyData = {};
				console.log('getting details result for ' + currentPin);
				phantom.create(function(err,ph) {
					return ph.createPage(function(err,page) {
						var testindex = 0, loadInProgress = false;

						page.onAlert = function(msg) {
							propertyData = msg;
						};
						page.onConsoleMessage = phantomHelpers.onConsoleMessage;
						page.onLoadStarted = phantomHelpers.onLoadStarted;
						page.onLoadFinished = phantomHelpers.onLoadFinished;
						page.onError = phantomHelpers.onError;

						var steps = [
							function() {
								page.open("http://www.co.monroe.pa.us/tax%20assessment/Default.aspx");
							},
							function() {
								page.evaluate(function() {
									document.getElementById("btnAgree").click();
								});
							},
							function() {
								page.evaluate(function() {
									document.getElementById("rbtnPin").click();
								});
							},
							function() {
								phantomHelpers.evaluate(page, function(currentPin) {
									console.log('set pin to ' + currentPin);
									var textbox = document.getElementById('txtSearchByPin');
									textbox.value = currentPin;
									document.getElementById("frmFindProperties").submit();
								}, currentPin);
							},
							function() {
								page.evaluate(function() {
									window.location = document.getElementById('gvPropertiesFound').querySelectorAll('td a:first-of-type')[0];
								});
							},
							function() {
								page.evaluate(function() {
									alert(document.querySelectorAll('html')[0].outerHTML);
								});
							}
						];

						var interval;
						interval = setInterval(function() {
							if (!loadInProgress && typeof steps[testindex] == "function") {
								console.log("step " + (testindex + 1));
								steps[testindex]();
								testindex++;
							}
							if (typeof steps[testindex] != "function") {
								console.log("complete!");
								clearInterval(interval);
								ph.exit();

								setTimeout(function(){
									//process results
									$ = cheerio.load(propertyData);

									var data = {};
									data.township = $("#gvSearchResultsRepeat td:nth-of-type(4)").text().trim();
									data.location = $("#gvSearchResultsRepeat td:nth-of-type(5)").text().trim();

									data.acerage = $("#gvParcelAddressDetail td:nth-of-type(2)").text().trim();
									data.landUse = $("#gvParcelAddressDetail td:nth-of-type(4)").text().trim();
									data.class = $("#gvParcelAddressDetail td:nth-of-type(5)").text().trim();

									data.saleDate = $("#gvParcelSaleInformation td:nth-of-type(1)").text().trim();
									data.saleAmount = $("#gvParcelSaleInformation td:nth-of-type(2)").text().trim();
									data.homestead = $("#gvParcelSaleInformation td:nth-of-type(3)").text().trim();
									data.landValue = $("#gvParcelSaleInformation td:nth-of-type(4)").text().trim();
									data.buildingValue = $("#gvParcelSaleInformation td:nth-of-type(5)").text().trim();

									data = _.compactObject(data);

									data.lastUpdatedTimestamp = (new Date()).getTime();
									data.lastUpdated = (new moment()).format('M/D/YY h:mm A');
									data.detailsLastUpdatedTimestamp = (new Date()).getTime();
									data.detailsLastUpdated = (new moment()).format('M/D/YY h:mm A');


									fut.return(data);
								},1000);
							}
						}, 500);
					});
				});
				var result = fut.wait();
				Properties.update({"pin":currentPin},{$set: result});
        	});
			return;
		}
   });
});