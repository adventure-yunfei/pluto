import { Meteor } from 'meteor/meteor';

// Imports all databases that client uses.
import '../imports/databases/RoomsDB';
import '../imports/databases/server/RoomsPublish';
import '../imports/databases/server/AccountsPublish';

Meteor.startup(() => {
  // code to run on server at startup
});
