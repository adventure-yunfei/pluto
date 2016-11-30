import { Mongo } from 'meteor/mongo';
import { SimpleSchema } from 'meteor/aldeed:simple-schema';

const TodosDB = new Mongo.Collection('todos');

TodosDB.attachSchema(new SimpleSchema({
    text: {type: String}
}));

export default TodosDB;
