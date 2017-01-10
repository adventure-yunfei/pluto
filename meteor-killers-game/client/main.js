import { Meteor } from 'meteor/meteor';
import 'normalize.css';
import 'purecss';
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider';
import React from 'react';
import { render } from 'react-dom';
import { Router, browserHistory } from 'react-router';
import routes from '../imports/client/views/routes';

import '../imports/client/views/common.less';

Meteor.startup(() => {
  render(
      <MuiThemeProvider><Router history={browserHistory} routes={routes}/></MuiThemeProvider>,
      document.getElementById('app')
  );
});
