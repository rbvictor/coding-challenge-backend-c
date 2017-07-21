import React, { Component } from 'react';
import PropTypes from 'prop-types';
import Suggestion from './Suggestion';
import './Suggestions.css'

class Suggestions extends Component {
  render() {
    return (
      <div className="row col-xs-4 col-lg-4 scrollable">
        {this.props.suggestions.map((suggestion, i) =>
          <Suggestion
            key={i}
            name={suggestion.name}
            latitude={suggestion.latitude}
            longitude={suggestion.longitude}
            score={suggestion.score}
          />)}
      </div>
    );
  }
}

Suggestions.propTypes = {
  suggestions: PropTypes.array.isRequired
};

export default Suggestions;