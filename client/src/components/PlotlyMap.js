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
    text: suggestions.map(s => s.name),
    lat: suggestions.map(s => s.latitude),
    lon: suggestions.map(s => s.longitude),
    marker: {
      size: 12,
      color: suggestions.map(s => s.score),
      colorscale: [[0.000, '#FFFF00'], [0.125, '#FFFF00'], [0.250, '#FFFF00'], [0.375, '#FFFF00'],
                    [0.500, '#FFBF00'], [0.625, '#FFBF00'], [0.750, '#FF7F00'], [0.875, '#FF3800'], [1.000, '#FF0000']],
      cmax : 1,
      cmin: 0,
      line: { width: 0.5 },
      colorbar: {
        thickness: 15,
        titleside: 'right'
      }
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
      _.defer((_this, layout) => {
        if (!_this.props.isWaiting)
          Plotly.newPlot(_this.id, suggestionsToMapData(_this.props.suggestions), layout);
        }, this, layout);
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