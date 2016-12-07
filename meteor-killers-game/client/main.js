import { Meteor } from 'meteor/meteor';
import React from 'react';
import { render } from 'react-dom';
import { Router, browserHistory } from 'react-router';
import routes from '../imports/client/views/routes';

Meteor.startup(() => {
  render(
      <Router history={browserHistory} routes={routes}/>,
      document.getElementById('app')
  );
});
