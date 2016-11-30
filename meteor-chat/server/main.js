import { Meteor } from 'meteor/meteor';

// Load all databases that client use
import '../imports/databases/TodosDB';
import '../imports/databases/TodosDBPublish';

Meteor.startup(() => {
  // code to run on server at startup
});
