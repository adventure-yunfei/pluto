import React, {PropTypes} from 'react';
import Component from 'react-pure-render/component';
import hoistNonReactStatics from 'hoist-non-react-statics';

import * as actions from './actions';

/**在组件离开时清除state数据
 * @param {Array.<string>} statePaths 示例: ['home.sections', 'photography'] */
export default function clearState(statePaths) {
    return BaseComponent => {
        class ClearReducerWrapper extends Component {
            static propTypes = {
                dispatch: PropTypes.func.isRequired
            };
            componentWillUnmount() {
                this.props.dispatch(actions.clearState(statePaths));
            }
            render() {
                return <BaseComponent {...this.props}/>;
            }
        }

        return hoistNonReactStatics(ClearReducerWrapper, BaseComponent);
    };
}
