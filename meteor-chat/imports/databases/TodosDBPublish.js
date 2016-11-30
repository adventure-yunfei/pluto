import { Meteor } from 'meteor/meteor';
import TodosDB from './TodosDB';

Meteor.publish('todos.filter_by_text', function (text) {
    return TodosDB.find({});
});
