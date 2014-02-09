Template.display.helpers({
    properties: function () {
        return Properties.find({},{sort:{lastUpdatedTimestamp:-1}});
    },
    settings: function () {
        return { fields: [
            { key: 'lastUpdated', label: 'Last Updated'},
            { key: 'billableOwner', label: 'Owner' },
            { key: 'legalDescription', label: 'Legal Description' },
            { key: 'parcel', label: 'Parcel' },
            { key: 'pin', label: 'PIN' },
            { key: 'buildingValue', label: 'Building Value' },
            { key: 'acerage', label: 'Acerage' },
            { key: 'landUse', label: 'Land Use' },
            { key: 'landValue', label: 'Land Value' },
            { key: 'location', label: 'Location' },
            { key: 'saleAmount', label: 'Sale Amount' },
            { key: 'saleDate', label: 'Sale Date' }
        ] };


        /*

        Object {_id: "odzs6SdaR7iwF5rEm", parcel: "01/20/1/32", billableOwner: "HIDELL TIMOTHY B", legalDescription: "LOT 104", pin: "01638803329190"…}
_id: "odzs6SdaR7iwF5rEm"
billableOwner: "HIDELL TIMOTHY B"
lastUpdated: 1391973223105
legalDescription: "LOT 104"
parcel: "01/20/1/32"
pin: "01638803329190"



BuildingValue: ""
_id: "YAajnTjtEeDB2ooHk"
acerage: ""
billableOwner: "KHATOON ASHIA"
detailsLastUpdated: 1391974153470
landUse: ""
landValue: ""
lastSeen: 1391973576323
lastUpdated: 1391974153470
legalDescription: "LOT A 7"
location: ""
parcel: "02/15/1/1-82"
pin: "02632002764698"
saleAmount: ""
saleDate: ""
__proto__: Object
        */
    }
});

Template.fetch.helpers({
    propertiesCount: function () {
        return Properties.find({}).count();
    },
    propertiesNeedingDetailsCount: function () {
        return Properties.find({detailsLastUpdated:null}).count();
    },
    propertyListNeedsUpdate: function () {
        return Properties.find({}).count() === 0 ||
        Properties.find({
            lastSeenTimestamp:{
                $lte:moment().subtract('days', 1).toDate().getTime()
            }
        }).count() > 0;
    },
    propertyDetailsNeedsUpdate: function () {
        return Properties.find({}).count() > 0 &&
        (
            Properties.find({detailsLastUpdated:null}).count() > 0 ||
            Properties.find({
                detailsLastUpdatedTimestamp:{
                    $lte:moment().subtract('days', 1).toDate().getTime()
                }
            }).count() > 0
        );
    }
});

Template.fetch.events({
    'click #updatePropertyList' : function () {
        Session.set('updatingPropertyList', true);
        Meteor.call('updatePropertyList',function(error, result){
            if(error)
                console.error(error);
            Session.set('updatingPropertyList', false);
        });
    },
    'click #updatePropertyDetails' : function () {
        Session.set('updatingPropertyDetails', true);
        Meteor.call('updatePropertyDetails', function(error, result){
            if(error)
                console.error(error);
            Session.set('updatingPropertyDetails', false);
        });





        //console.log('fetching search results');
        // Session.set('updatingPropertyDetails', true);
        // Properties.find({pin:{$ne:null}},{limit:50,sort:{detailsLastUpdated:1}}).forEach(function(property){
        //     //console.log(property);
        //     //console.log('looking for ' + property.pin);
        //     Meteor.call('getSearchResult', property.pin, function(error, result){
        //         if(error)
        //             console.error(error);
        //     });
        // });
        // Session.set('updatingPropertyDetails', false);

    }
});