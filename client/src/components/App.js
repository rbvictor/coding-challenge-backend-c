import React, { Component } from 'react';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';
import { fetchSuggestions } from '../actions';
import QueryBox from "./QueryBox";
import Suggestions from "./Suggestions";
import PlotlyMap from "./PlotlyMap";

class App extends Component {

  constructor(props, context) {
    super(props, context);
    this.handleClick = this.handleClick.bind(this);
    this.handleChange = this.handleChange.bind(this);
  }

  handleClick(e) {
    e.preventDefault();
    this.props.dispatch(fetchSuggestions(this.props.query));
  };

  handleChange(e) {
    e.preventDefault();
    this.props.dispatch(fetchSuggestions(e.target.value));
  }

  render() {
    return (
      <div>
        <QueryBox value={this.props.query} onChange={this.handleChange} onClick={this.handleClick} />
        <Suggestions suggestions={this.props.suggestions} />
        <PlotlyMap suggestions={this.props.suggestions} isWaiting={this.props.isWaiting}/>
      </div>
    );
  }
}

App.propTypes = {
  query: PropTypes.string.isRequired,
  suggestions: PropTypes.array.isRequired,
  dispatch: PropTypes.func.isRequired,
  isWaiting: PropTypes.bool.isRequired
};

const mapStateToProps = (state) => (state);

export default connect(mapStateToProps)(App);
