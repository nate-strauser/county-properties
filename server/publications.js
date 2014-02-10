Meteor.publish("properties", function () {
  return Properties.find({}, {fields: {sourceDetailsData: 0}});
});