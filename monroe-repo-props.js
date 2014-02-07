Properties = new Meteor.Collection("properties");


if (Meteor.isClient) {
  Template.display.helpers({
  properties: function () {
    return Properties.find({});
  }
});

  Template.fetch.events({
    'click #fetchRepoList' : function () {
      Meteor.call('getRepoList',function(error, result){
              //console.log(result);
              $("#repoResult").html(result.content);
             // $("#repoTable").html($("#repoResult #GridView1").html());
              $("#repoResult #GridView1 tr").each(function() {
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
                  console.log('found new prop, inserting');
                  Properties.insert(data);
                }
              });
               $("#repoResult").empty();

            });

      //HTTP.get('http://www.co.monroe.pa.us/tax%20claim/repository.aspx',
      // HTTP.get('http://www.co.monroe.pa.us/tax%20assessment/detail.aspx?pid=13129',
      //   {},
      //   function (error, result) {
      //       if (!error) {
      //         console.log(result);
      //       }
      //   });
    },
    'click #fetchSearchResults' : function () {
      console.log('fetching search results');
      Properties.find({},{limit:5}).forEach(function(property){
        //console.log('looking for ' + property.pin);
        Meteor.call('getSearchResult', property.pin, function(error, result){
          console.log(result.content);
          $("#searchResult").html(result.content);
        });
      });

      Meteor.call('getRepoList',function(error, result){
              //console.log(result);
              $("#repoResult").html(result.content);
             // $("#repoTable").html($("#repoResult #GridView1").html());
              $("#repoResult #GridView1 tr").each(function() {
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
                  console.log('found new prop, inserting');
                  Properties.insert(data);
                }
              });
               $("#repoResult").empty();

            });

      //HTTP.get('http://www.co.monroe.pa.us/tax%20claim/repository.aspx',
      // HTTP.get('http://www.co.monroe.pa.us/tax%20assessment/detail.aspx?pid=13129',
      //   {},
      //   function (error, result) {
      //       if (!error) {
      //         console.log(result);
      //       }
      //   });
    }
  });
}

if (Meteor.isServer) {
  Meteor.startup(function () {
    var Browser = Meteor.require('zombie');
    var cookie = "cache=dsfdef; ASP.NET_SessionId=fl0m0p45x1r3d3qrcev0yd2f; DS2416=; cvyq8kiKs1n1xJFB1ZHoRQECdmWuiDL3ySMeRCn3Dvc%3d=15CPBkXhSKlSZBN2OSXmmhwx8PuvqAAfd9oqJpozuaA%3d";
    Meteor.methods({
      getRepoList: function () {
        options = {};
        options.headers = {"Cookie":cookie};
        return HTTP.get('http://www.co.monroe.pa.us/tax%20claim/repository.aspx',options);
      },
      getSearchResult: function (pin) {
        var browser = new Browser();
        browser.visit("http://www.co.monroe.pa.us/tax%20assessment/Default.aspx",
          function(e, browser, status){
            console.log(browser.body);
          });

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
      }
    });
  });
}
