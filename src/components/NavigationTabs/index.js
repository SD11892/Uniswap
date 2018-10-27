import React, { Component } from 'react';
import { withRouter } from 'react-router-dom';
import PropTypes from 'prop-types';
import {Tab, Tabs} from "../Tab";

class NavigationTabs extends Component {
  static propTypes = {
    history: PropTypes.shape({
      push: PropTypes.func.isRequired,
    }),
    className: PropTypes.string,
  };

  constructor(props) {
    super(props);
    this.state = {
      selectedPath: this.props.location.pathname,
      className: '',
    };
  }

  renderTab(name, path, regex) {
    const { push } = this.props.history;
    return (
      <Tab
        text={name}
        onClick={() => push(path)}
        isSelected={regex.test(this.props.location.pathname)}
      />
    )
  }

  render() {
    return (
      <Tabs className={this.props.className}>
        { this.renderTab('Swap', '/swap', /swap/) }
        { this.renderTab('Send', '/send', /send/) }
        { this.renderTab('Pool', '/add-liquidity', /add-liquidity|remove-liquidity|create-exchange/) }
      </Tabs>
    );
  }
}

export default withRouter(NavigationTabs);
