import React from 'react';
import {Route} from 'react-router';
import TodosView from './TodosView';

export default (
    <Route path="/">
        <Route path="todos" component={TodosView}/>
    </Route>
)
