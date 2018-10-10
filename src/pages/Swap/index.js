import React, { Component } from 'react';
import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';
import PropTypes from 'prop-types';
import Header from '../../components/Header';
import NavigationTabs from '../../components/NavigationTabs';

import "./swap.scss";

class Swap extends Component {
  static propTypes = {
    // Injected by React Router Dom
      push: PropTypes.func.isRequired,
      pathname: PropTypes.string.isRequired,
  };

  render() {
    return (
      <div className="swap">
        <Header />
        <div className="swap__content">
          <NavigationTabs />
        </div>
      </div>
    );
  }
}

export default withRouter(
  connect(
    (state, ownProps) => ({
      push: ownProps.history.push,
      pathname: ownProps.location.pathname,
    }),
  )(Swap)
);
