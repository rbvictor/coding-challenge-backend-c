import React, { Component } from 'react';
import PropTypes from 'prop-types';
import Suggestion from './Suggestion';

class Suggestions extends Component {
  render() {
    return (
      <div className="row">
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