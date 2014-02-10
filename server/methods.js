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
			var fut = new Future(), fut2 = new Future();
			var propertyData = {};

			//repository

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

				data.saleType = 'repository';
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

			//judicial

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
							page.open("http://www.co.monroe.pa.us/tax%20claim/judicial.aspx");
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
								fut2.return(propertyData);
							},1000);
						}
					}, 5000);
				});
			});

			result = fut2.wait();

			//console.log(result);

			$ = cheerio.load(result);
			$("#GridView1 tr").each(function() {
				var cells = $(this).find("td");
				var data = {};

				data.saleType = 'judicial';
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
			Properties.find({pin:{$ne:null},detailsLastUpdated:null},{sort:{detailsLastUpdatedTimestamp:1}}).forEach(function(property){
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

									data.acerage = parseFloat($("#gvParcelAddressDetail td:nth-of-type(2)").text().trim());
									if(isNaN(data.acerage))
										delete data.acerage;
									data.landUse = $("#gvParcelAddressDetail td:nth-of-type(4)").text().trim();
									data.class = $("#gvParcelAddressDetail td:nth-of-type(5)").text().trim();

									data.saleDate = $("#gvParcelSaleInformation td:nth-of-type(1)").text().trim();
									data.saleAmount = $("#gvParcelSaleInformation td:nth-of-type(2)").text().trim();
									data.homestead = $("#gvParcelSaleInformation td:nth-of-type(3)").text().trim();
									data.landValue = parseInt($("#gvParcelSaleInformation td:nth-of-type(4)").text().trim().replace(",",""),10);
									if(isNaN(data.landValue))
										delete data.landValue;
									//console.log($("#gvParcelSaleInformation td:nth-of-type(5)").text().trim());
									data.buildingValue = parseInt($("#gvParcelSaleInformation td:nth-of-type(5)").text().trim().replace(",",""),10);
									if(isNaN(data.buildingValue))
										delete data.buildingValue;
									//console.log(data.buildingValue);

									data = _.compactObject(data);




									if(Object.keys(data).length > 0){

										if(!data.buildingValue)
											data.buildingValue = 0;
										if(!data.landValue)
											data.landValue = 0;

										data.sourceDetailsData = {
											version:1,
											htmlFragments:[
												$("#gvSearchResultsRepeat").html(), //todo - rework to object and include selector
												$("#gvParcelAddressDetail").html(),
												$("#gvParcelSaleInformation").html()
											]
										};

										data.lastUpdatedTimestamp = (new Date()).getTime();
										data.lastUpdated = (new moment()).format('M/D/YY h:mm A');

									}else{
										console.log('ERROR - unable to fetch details for pin ' + currentPin);
										data.error = true;
										data.errorMessage = "Unable to fetch details";
										data.errorOccured = (new Date()).getTime();
									}
									fut.return(data);
								},1000);
							}
						}, 500);
					});
				});
				var result = fut.wait();
				result.detailsLastUpdatedTimestamp = (new Date()).getTime();
				result.detailsLastUpdated = (new moment()).format('M/D/YY h:mm A');

				console.log(result);

				Properties.update({"pin":currentPin},{$set: result});
        	});
			return;
		}
   });
});