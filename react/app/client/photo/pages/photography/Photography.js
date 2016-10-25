import React, {PropTypes} from 'react';
import immutable from 'immutable';
import {connect} from 'react-redux';
import CircularProgress from 'material-ui/lib/circular-progress';

import RouteComponent from '../../../components/RouteComponent';
import * as actions from './actions';
import {keyedReactElems} from '../../../../lib/utils';

import './Photography.scss';

@connect(state => ({
    photography: state.get('photography')
}))
export default class Photography extends RouteComponent {
    static propTypes = {
        photography: PropTypes.instanceOf(immutable.Map)
    };

    static fetchDataActions = [actions.initPhotographyData];

    render() {
        const {photography} = this.props;
        return (
            <div className="Photography">
                {photography ? keyedReactElems([
                    <div className="photography-title" >{photography.get('title')}</div>,
                    <div className="photography-content" dangerouslySetInnerHTML={{__html: photography.get('content') || ''}}></div>
                ]) : <CircularProgress className="loading-tip" size={1.5}/>}
            </div>
        );
    }
}
