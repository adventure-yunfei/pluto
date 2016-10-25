import {PropTypes} from 'react';
import Component from 'react-pure-render/component';
import {request} from '../../lib/request';

export default class RouteComponent extends Component {
    /**定义Route组件的初始化数据actions
     * 每一个actionCreator都接收.request函数, server端传入定制的request函数以包含cookie和域名
     *@type Array.<Function({request})> */
    static fetchDataActions = [];

    static propTypes = {
        dispatch: PropTypes.func.isRequired,
        location: PropTypes.object.isRequired,
        params: PropTypes.object.isRequired
    };

    checkDataFetched() {
        return false;
    }

    componentDidMount() {
        if (!this.checkDataFetched()) {
            const {dispatch, location, params} = this.props;
            this.constructor.fetchDataActions.forEach(actionCreator => {
                dispatch(actionCreator({
                    request,
                    location,
                    params
                }));
            });
        }
    }
}
