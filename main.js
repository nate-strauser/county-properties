Properties = new Meteor.Collection("properties");


if (Meteor.isClient) {
    Template.display.helpers({
        properties: function () {
            return Properties.find({});
        }
    });

    Template.fetch.events({
        'click #updateRepoList' : function () {
            Meteor.call('updateRepoList',function(error, result){
                if(error)
                    console.log(error);
            });
        },
        'click #fetchSearchResults' : function () {
            console.log('fetching search results');
            Properties.find({pin:{$ne:null}}).forEach(function(property){
                console.log(property);
                console.log('looking for ' + property.pin);
                Meteor.call('getSearchResult', property.pin, function(error, result){
                    console.log(result.content);
                    $("#searchResult").html(result.content);
                });
            });

        }
    });
}

if (Meteor.isServer) {
    Meteor.startup(function () {
        var Future = Npm.require('fibers/future');
        var phantom = Meteor.require('node-phantom');
        var cheerio = Meteor.require('cheerio');
        path = Meteor.require('path');
        process.env.PATH += ':' + path.dirname(phantom.path);

        var cookie = "cache=dsfdef; ASP.NET_SessionId=fl0m0p45x1r3d3qrcev0yd2f; DS2416=; cvyq8kiKs1n1xJFB1ZHoRQECdmWuiDL3ySMeRCn3Dvc%3d=15CPBkXhSKlSZBN2OSXmmhwx8PuvqAAfd9oqJpozuaA%3d";


        

        Meteor.methods({
            updateRepoList: function () {
                options = {};
                options.headers = {"Cookie":cookie};
                var result = HTTP.get('http://www.co.monroe.pa.us/tax%20claim/repository.aspx',options);
                $ = cheerio.load(result.content);
                $("#GridView1 tr").each(function() {
                    var cells = $(this).find("td");
                    var data = {};
                    data.parcel = $(cells[0]).text().trim();
                    data.billableOwner = $(cells[1]).text().trim();
                    data.legalDescription = $(cells[2]).text().trim();
                    data.pin = $(cells[3]).text().trim();
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
            },
            getSearchResult: function (pin) {
                var fut = new Future();
                var currentPin = pin;
                var propertyData = {};
                console.log('getting search result for ' + currentPin);
                phantom.create(function(err,ph) {
                    return ph.createPage(function(err,page) {
                        var testindex = 0, loadInProgress = false;

                        page.onAlert = function(msg) {
                         //   console.log('setting propertyData');
                           // console.log(msg);
                          propertyData = msg;
                        };

                        page.onConsoleMessage = function(msg) {
                          console.log(msg);
                        };

                        page.onLoadStarted = function() {
                          loadInProgress = true;
                          console.log("load started");
                        };

                        page.onLoadFinished = function() {
                          loadInProgress = false;
                          console.log("load finished");
                        };

                        /*
                         * This function wraps WebPage.evaluate, and offers the possibility to pass
                         * parameters into the webpage function. The PhantomJS issue is here:
                         * 
                         *   http://code.google.com/p/phantomjs/issues/detail?id=132
                         * 
                         * This is from comment #43.
                         */
                        function evaluate(page, func) {
                            var args = [].slice.call(arguments, 2);
                            var fn = "function() { return (" + func.toString() + ").apply(this, " + JSON.stringify(args) + ");}";
                            return page.evaluate(fn);
                        }

                        page.onError = function(msg, trace) {

                          var msgStack = ['ERROR: ' + msg];

                          if (trace && trace.length) {
                            msgStack.push('TRACE:');
                            trace.forEach(function(t) {
                              msgStack.push(' -> ' + t.file + ': ' + t.line + (t.function ? ' (in function "' + t.function +'")' : ''));
                            });
                          }

                          console.error(msgStack.join('\n'));

                        };

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
                            evaluate(page, function(currentPin) {
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
                            console.log("test complete!");
                            clearInterval(interval);
                            ph.exit();

                            setTimeout(function(){
                                //process results
                                $ = cheerio.load(propertyData);

                                var data = {};
                                data.location = $("#gvSearchResultsRepeat td:nth-of-type(5)").text();
                                data.acerage = $("#gvParcelAddressDetail td:nth-of-type(2)").text();
                                data.landUse = $("#gvParcelAddressDetail td:nth-of-type(3)").text();
                                data.saleDate = $("#gvParcelSaleInformation td:nth-of-type(1)").text();
                                data.saleAmount = $("#gvParcelSaleInformation td:nth-of-type(2)").text();
                                data.landValue = $("#gvParcelSaleInformation td:nth-of-type(3)").text();
                                data.BuildingValue = $("#gvParcelSaleInformation td:nth-of-type(4)").text();


                                // console.log(.html());
                                // console.log($("#gvParcelAddressDetail").html());
                                // console.log($("#gvParcelSaleInformation").html());

                                // .map



                                fut.return(data);
                            },1000);
                            



                          }
                        }, 500);




















                        // return page.open("http://www.co.monroe.pa.us/tax%20assessment/Default.aspx", function(err,status) {
                        //     return page.evaluate(function(){
                        //         var baseTime = 5000;

                        //         setTimeout(function(){
                        //             document.getElementById("btnAgree").click();
                        //         },baseTime);
                        //         setTimeout(function(){
                        //             document.getElementById("rbtnPin").click();
                        //         },baseTime + 1000);

                        //         setTimeout(function(){
                        //             var textbox = document.getElementById('txtSearchByPin');
                        //             textbox.value = pin;
                        //             document.getElementById("frmFindProperties").submit();
                        //         },baseTime + 2000);
                                
                        //         setTimeout(function(){
                        //             return document.querySelectorAll('html')[0].outerHTML;
                        //         },baseTime + 3000);
                        //     },function(err, result){
                        //         console.log(result);
                        //         ph.exit();
                        //     });
                        // });
                        
                    });
                });
                var result = fut.wait();
                Properties.update({"pin":currentPin},{$set: result});
                console.log(result);
            }
        });
    });
}




//HTTP.get('http://www.co.monroe.pa.us/tax%20claim/repository.aspx',
// HTTP.get('http://www.co.monroe.pa.us/tax%20assessment/detail.aspx?pid=13129',
//   {},
//   function (error, result) {
//       if (!error) {
//         console.log(result);
//       }
//   });

//       //page.includeJs('//ajax.googleapis.com/ajax/libs/jquery/1.10.2/jquery.min.js', function(err) {
//         //jQuery Loaded.
//         //Wait for a bit for AJAX content to load on the page. Here, we are waiting 5 seconds.
//         setTimeout(function() {
//           return page.evaluate(function() {
//              document.getElementById("btnAgree").click();
//           }, function(err,result) {
//             //page.includeJs('//ajax.googleapis.com/ajax/libs/jquery/1.10.2/jquery.min.js', function(err) {
//               setTimeout(function() {
//                 return page.evaluate(function() {


//                   //return document.querySelectorAll('html')[0].outerHTML;

//                  }, function(err,result) {
//                     setTimeout(function() {
//                       return page.evaluate(function() {


//                        }, function(err,result) {
//                           setTimeout(function() {
//                             return page.evaluate(function() {


//                              }, function(err,result) {

//                             });
//                           }, 1000);
//                       });
//                     }, 500);
//                 });
//               }, 500);
//           });
//         }, 500);
//     });
//   });
// });


// options = {};
// options.headers = {
//   "Cookie":cookie,
//   "Referer":"http://www.co.monroe.pa.us/tax%20assessment/Default.aspx"};
// options.data = {
//   "__EVENTTARGET":"",
//   "__EVENTARGUMENT":"",
//   "__LASTFOCUS":"",
//   "__VIEWSTATE":"/wEPDwUKMTA0Njg5Mzc1NA8WBh4OU29ydEV4cHJlc3Npb24FDkRUTF9PV05FUl9OQU1FHg1Tb3J0RGlyZWN0aW9uBQRERVNDHhBkc1Nlc3Npb25QYXJjZWxzMtIPAAEAAAD/////AQAAAAAAAAAMAgAAAE5TeXN0ZW0uRGF0YSwgVmVyc2lvbj0yLjAuMC4wLCBDdWx0dXJlPW5ldXRyYWwsIFB1YmxpY0tleVRva2VuPWI3N2E1YzU2MTkzNGUwODkFAQAAABNTeXN0ZW0uRGF0YS5EYXRhU2V0AwAAABdEYXRhU2V0LlJlbW90aW5nVmVyc2lvbglYbWxTY2hlbWELWG1sRGlmZkdyYW0DAQEOU3lzdGVtLlZlcnNpb24CAAAACQMAAAAGBAAAAMkJPD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0idXRmLTE2Ij8+DQo8eHM6c2NoZW1hIGlkPSJOZXdEYXRhU2V0IiB4bWxucz0iIiB4bWxuczp4cz0iaHR0cDovL3d3dy53My5vcmcvMjAwMS9YTUxTY2hlbWEiIHhtbG5zOm1zZGF0YT0idXJuOnNjaGVtYXMtbWljcm9zb2Z0LWNvbTp4bWwtbXNkYXRhIj4NCiAgPHhzOmVsZW1lbnQgbmFtZT0iTmV3RGF0YVNldCIgbXNkYXRhOklzRGF0YVNldD0idHJ1ZSIgbXNkYXRhOlVzZUN1cnJlbnRMb2NhbGU9InRydWUiPg0KICAgIDx4czpjb21wbGV4VHlwZT4NCiAgICAgIDx4czpjaG9pY2UgbWluT2NjdXJzPSIwIiBtYXhPY2N1cnM9InVuYm91bmRlZCI+DQogICAgICAgIDx4czplbGVtZW50IG5hbWU9IlRhYmxlIj4NCiAgICAgICAgICA8eHM6Y29tcGxleFR5cGU+DQogICAgICAgICAgICA8eHM6c2VxdWVuY2U+DQogICAgICAgICAgICAgIDx4czplbGVtZW50IG5hbWU9IkRUTF9PV05FUl9OQU1FIiB0eXBlPSJ4czpzdHJpbmciIG1zZGF0YTp0YXJnZXROYW1lc3BhY2U9IiIgbWluT2NjdXJzPSIwIiAvPg0KICAgICAgICAgICAgICA8eHM6ZWxlbWVudCBuYW1lPSJEVExfUEFSQ0VMIiB0eXBlPSJ4czpzdHJpbmciIG1zZGF0YTp0YXJnZXROYW1lc3BhY2U9IiIgbWluT2NjdXJzPSIwIiAvPg0KICAgICAgICAgICAgICA8eHM6ZWxlbWVudCBuYW1lPSJEVExfUEFSQ0VMX1NFUUlEIiB0eXBlPSJ4czppbnQiIG1zZGF0YTp0YXJnZXROYW1lc3BhY2U9IiIgbWluT2NjdXJzPSIwIiAvPg0KICAgICAgICAgICAgICA8eHM6ZWxlbWVudCBuYW1lPSJEVExfUElOIiB0eXBlPSJ4czpzdHJpbmciIG1zZGF0YTp0YXJnZXROYW1lc3BhY2U9IiIgbWluT2NjdXJzPSIwIiAvPg0KICAgICAgICAgICAgICA8eHM6ZWxlbWVudCBuYW1lPSJEVExfVE9XTlNISVAiIHR5cGU9InhzOnN0cmluZyIgbXNkYXRhOnRhcmdldE5hbWVzcGFjZT0iIiBtaW5PY2N1cnM9IjAiIC8+DQogICAgICAgICAgICAgIDx4czplbGVtZW50IG5hbWU9IkRUTF9QUk9QRVJUWURFU0MiIHR5cGU9InhzOnN0cmluZyIgbXNkYXRhOnRhcmdldE5hbWVzcGFjZT0iIiBtaW5PY2N1cnM9IjAiIC8+DQogICAgICAgICAgICA8L3hzOnNlcXVlbmNlPg0KICAgICAgICAgIDwveHM6Y29tcGxleFR5cGU+DQogICAgICAgIDwveHM6ZWxlbWVudD4NCiAgICAgIDwveHM6Y2hvaWNlPg0KICAgIDwveHM6Y29tcGxleFR5cGU+DQogIDwveHM6ZWxlbWVudD4NCjwveHM6c2NoZW1hPgYFAAAA4AM8ZGlmZmdyOmRpZmZncmFtIHhtbG5zOm1zZGF0YT0idXJuOnNjaGVtYXMtbWljcm9zb2Z0LWNvbTp4bWwtbXNkYXRhIiB4bWxuczpkaWZmZ3I9InVybjpzY2hlbWFzLW1pY3Jvc29mdC1jb206eG1sLWRpZmZncmFtLXYxIj48TmV3RGF0YVNldD48VGFibGUgZGlmZmdyOmlkPSJUYWJsZTEiIG1zZGF0YTpyb3dPcmRlcj0iMCI+PERUTF9PV05FUl9OQU1FPkNIQVJMRVMgTSBCQU5LTyBJTkMgPC9EVExfT1dORVJfTkFNRT48RFRMX1BBUkNFTD4wMS83QS8yLzExPC9EVExfUEFSQ0VMPjxEVExfUEFSQ0VMX1NFUUlEPjI3ODc8L0RUTF9QQVJDRUxfU0VRSUQ+PERUTF9QSU4+MDE3MzA3MDEwODUzODM8L0RUTF9QSU4+PERUTF9UT1dOU0hJUD5CYXJyZXR0IFRvd25zaGlwPC9EVExfVE9XTlNISVA+PERUTF9QUk9QRVJUWURFU0M+SVJPUVVPSVMgTE9PUDwvRFRMX1BST1BFUlRZREVTQz48L1RhYmxlPjwvTmV3RGF0YVNldD48L2RpZmZncjpkaWZmZ3JhbT4EAwAAAA5TeXN0ZW0uVmVyc2lvbgQAAAAGX01ham9yBl9NaW5vcgZfQnVpbGQJX1JldmlzaW9uAAAAAAgICAgCAAAAAAAAAP//////////CxYCAgcPZBYWAgEPEA8WAh4HQ2hlY2tlZGhkZGRkAgMPEA8WAh8DaGRkZGQCBQ8QDxYCHwNnZGRkZAIHDxAPFgIfA2hkZGRkAgkPDxYCHgdWaXNpYmxlaGQWAgIBDw8WAh4EVGV4dGVkZAILD2QWCgIBDw8WAh8FZWRkAgMPDxYCHwVlZGQCBQ8PFgIfBWVkZAIHDw8WAh8FZWRkAgkPDxYCHwVlZGQCDQ8PFgIfBGdkFgICAQ8PFgIfBWVkZAIPD2QWAgIBDw8WAh8FZWRkAhEPDxYCHwRoZGQCEw8PFgQfBQU3Q2xpY2sgb24gYSBjb2x1bW4gdGl0bGUgdG8gc29ydCBieSB0aGF0IHZhbHVlDQogICAgICAgIB8EaGRkAhUPPCsADQEADxYIHgxEYXRhU291cmNlSURlHgtfIURhdGFCb3VuZGceC18hSXRlbUNvdW50AgEfBGhkFgJmD2QWBgIBD2QWCmYPZBYCZg8PFgQfBQUUQ0hBUkxFUyBNIEJBTktPIElOQyAeC05hdmlnYXRlVXJsBRRkZXRhaWwuYXNweD9waWQ9Mjc4N2RkAgEPDxYCHwUFCjAxLzdBLzIvMTFkZAIDDw8WAh8FBQ4wMTczMDcwMTA4NTM4M2RkAgQPDxYCHwUFEEJhcnJldHQgVG93bnNoaXBkZAIFDw8WAh8FBQ1JUk9RVU9JUyBMT09QZGQCAg8PFgIfBGhkZAIDDw8WAh8EaGRkGAIFHl9fQ29udHJvbHNSZXF1aXJlUG9zdEJhY2tLZXlfXxYHBQhyYnRuTmFtZQUIcmJ0bk5hbWUFCnJidG5QYXJjZWwFCnJidG5QYXJjZWwFB3JidG5QaW4FC3JidG5BZGRyZXNzBQtyYnRuQWRkcmVzcwURZ3ZQcm9wZXJ0aWVzRm91bmQPPCsACgEIAgFk3PNbSwNWUTuFZ62smbVHJGVOUJA=",
//   "__EVENTVALIDATION":"/wEWBwLR4fzcC2ZmZmYC/pfAsAkChbTNowOpD3X8enDUSDk3HLvuxVZqEhjo6g==",
//   "rbtnPin":"rbtnPin",
//   "txtSearchByPin":pin,
//   "btnSearchByPin":"Search"};
// console.log('looking for prop ' + pin);
// return HTTP.post('http://www.co.monroe.pa.us/tax%20assessment/Default.aspx',options);


//             Meteor.call('getRepoList',function(error, result){
// //console.log(result);
// $("#repoResult").html(result.content);
// // $("#repoTable").html($("#repoResult #GridView1").html());
// $("#repoResult #GridView1 tr").each(function() {
//     var cells = $(this).find("td");
//     var data = {};
//     data.parcel = $(cells[0]).text().trim();
//     data.billableOwner = $(cells[1]).text().trim();
//     data.legalDescription = $(cells[2]).text().trim();
//     data.pin = $(cells[3]).text().trim();
//     var existingProperty = Properties.findOne({"pin":data.pin});
//     if(existingProperty){
//         console.log('found prop, updating');
//         Properties.update({"_id":existingProperty._id},{$set: data});
//     }else{
//         console.log('found new prop, inserting');
//         Properties.insert(data);
//     }
// });
// $("#repoResult").empty();

