import React, {Component} from 'react';
import PropTypes from 'prop-types';
import _ from 'lodash';
import Plotly from 'plotly.js/lib/core';

Plotly.register(require('plotly.js/lib/scattergeo'));
import layout from './PlotlyMap.layout.json';
import './PlotlyMap.css'

const suggestionsToMapData = (suggestions) => (
  [{
    type: 'scattergeo',
    mode: 'markers+text',
    text: suggestions.map(s => s.name.split(",")[0]),
    lat: suggestions.map(s => s.latitude),
    lon: suggestions.map(s => s.longitude),
    marker: {
      size: 10,
      color: suggestions.map((s, i) => !i ? "#CC0000" : "#0000FF"),
      line: {width: 1}
    },
    textposition: 'top-right'
  }]
);

class PlotlyMap extends Component {

  constructor(props, context) {
    super(props, context);
    this.id = _.uniqueId("map-");
  }

  componentDidMount() {
    let data = suggestionsToMapData(this.props.suggestions);
    Plotly.newPlot(this.id, data, layout);
  }

  render() {
    let waiting = !this.props.isWaiting ? null : (
      <div className="overlay" />
    );

    return (
      <div className="graphDiv col-xs-8 col-lg-8">
        {waiting}
        <div id={this.id} className="panel panel-default"/>
      </div>);
  }

  componentDidUpdate() {
    if (!this.props.isWaiting) {
      _.defer((id, suggestions, layout) => {
          Plotly.newPlot(id, suggestionsToMapData(suggestions), layout);
        }, this.id, this.props.suggestions, layout);
    }
  }

  componentWillUnmount() {
    Plotly.purge(this.id);
  }
}

PlotlyMap.propTypes = {
  suggestions: PropTypes.array.isRequired,
  isWaiting: PropTypes.bool.isRequired
};

export default PlotlyMap;