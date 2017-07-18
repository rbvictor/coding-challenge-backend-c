import React, { Component } from 'react';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';
import { fetchSuggestions } from '../actions';
import QueryBox from "./QueryBox";
import Suggestions from "./Suggestions";

class App extends Component {

  constructor(props, context) {
    super(props, context);
    this.handleClick = this.handleClick.bind(this);
    this.handleChange = this.handleChange.bind(this);
  }

  componentDidMount() {
    // ***
  }

  componentDidUpdate() {

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
      </div>
    );
  }
}

App.propTypes = {
  query: PropTypes.string,
  suggestions: PropTypes.array,
  dispatch: PropTypes.func
};

const mapStateToProps = (state) => (state);

export default connect(mapStateToProps)(App);
