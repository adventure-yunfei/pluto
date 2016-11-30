import React, { PropTypes } from 'react';
import { Meteor } from 'meteor/meteor';
import { createContainer } from 'meteor/react-meteor-data';
import TodosDB from '../../databases/TodosDB';

class TodosView extends React.Component {
    handleBtnClick() {
        this._input.value && TodosDB.insert({text: this._input.value});
    }

    render() {
        return (
            <div>
                <p>
                    <input ref={node => this._input = node}/>
                    <button onClick={this.handleBtnClick.bind(this)}>新增列表</button>
                </p>
                <ul>
                    {this.props.todos.map(({text}, idx) => (
                        <li key={idx}>{text}</li>
                    ))}
                </ul>
            </div>
        );
    }
}

TodosView.propTypes = {
    todos: PropTypes.arrayOf(PropTypes.shape({text: PropTypes.string.isRequired})).isRequired
};

export default createContainer(() => {
    Meteor.subscribe('todos.filter_by_text');
    return {
        todos: TodosDB.find({}).fetch()
    };
}, TodosView);
