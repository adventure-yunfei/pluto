import { Meteor } from 'meteor/meteor';

import '../imports/databases/server/AccountsValidate';
// Imports all databases that client uses.
import '../imports/databases/RoomsDB';
import '../imports/databases/server/RoomsPublish';
import '../imports/databases/server/AccountsPublish';

// Imports all methods that client uses.
import '../imports/methods/AdminM';
import '../imports/methods/roomsMethods';

Meteor.startup(() => {
  // code to run on server at startup
});
