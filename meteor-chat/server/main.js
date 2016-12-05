import { Meteor } from 'meteor/meteor';

// Load all databases that client use
import '../imports/databases/server/AccountsDBPublish';
import '../imports/databases/server/AccountsDBConfigure';

Meteor.startup(() => {
  // code to run on server at startup
});
