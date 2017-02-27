import React, { PropTypes } from 'react';
import ReactDOM from 'react-dom';
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider';
import MaterialUIDialog from 'material-ui/Dialog';
import FlatButton from 'material-ui/FlatButton';

class Dialog extends React.Component {
    static propTypes = {
        actions: PropTypes.array.isRequired,
        children: PropTypes.node,
        onClose: PropTypes.func
    }
    state = {
        open: true
    }
    close = () => this.setState({open: false})
    handleRequestClose = () => {
        this.close();
        this.props.onClose && this.props.onClose();
    }
    render() {
        const {actions} = this.props,
            btns = actions.map(({component = FlatButton, onClick, ...moreProps}, idx) => {
                const BtnComp = component;
                return <BtnComp key={idx} onClick={() => onClick(this)} {...moreProps}/>;
            });
        return <MuiThemeProvider><MaterialUIDialog {...this.props} open={this.state.open} actions={btns} onRequestClose={this.handleRequestClose}/></MuiThemeProvider>;
    }
}

export function openDialog(props) {
    const _onClose = props.onClose;
    let placeholder = document.createElement('span');
    props = {
        ...props,
        onClose(...args) {
            _onClose && _onClose(...args);
            setTimeout(() => {
                ReactDOM.unmountComponentAtNode(placeholder);
                placeholder = null;
            }, 2000);
        }
    }
    ReactDOM.render(<Dialog {...props}/>, placeholder);
}

export function alertDlg(content, {onOK = null} = {}) {
    return new Promise((resolve, reject) => {
        openDialog({
            modal: true,
            children: content,
            actions: [{
                label: '确定',
                onClick(dialog) {
                    dialog.close();
                    onOK && onOK();
                    resolve();
                }
            }]
        });
    });
}

export function confirmDlg(content, {onOK = null, onCancel = null} = {}) {
    return new Promise((resolve, reject) => {
        openDialog({
            modal: true,
            children: content,
            actions: [{
                label: '取消',
                onClick(dialog) {
                    dialog.close();
                    onCancel && onCancel();
                    reject();
                }
            }, {
                label: '确定',
                onClick(dialog) {
                    dialog.close();
                    onOK && onOK();
                    resolve();
                }
            }]
        });
    });
}
