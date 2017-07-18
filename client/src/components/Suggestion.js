import React, { Component } from 'react';
import PropTypes from 'prop-types';

class Suggestion extends Component {
  render() {
    return (
      <div className="col-xs-12 col-lg-12">
        <h2>{this.props.name}</h2>
        <p>Latitude: {this.props.latitude}</p>
        <p>Longitude: {this.props.longitude}</p>
        <p>Score: {this.props.score}</p>
      </div> /*<!--/ .col-xs-6.col-lg-4--> */
    );
  }
}

Suggestion.propTypes = {
  name: PropTypes.string.isRequired,
  latitude: PropTypes.number.isRequired,
  longitude: PropTypes.number.isRequired,
  score: PropTypes.number.isRequired
};

export default Suggestion;