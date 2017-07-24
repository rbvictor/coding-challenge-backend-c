import React, { Component } from 'react';
import PropTypes from 'prop-types';
import './QueryBox.css';

/**
 * @description Renders query text box and triggers automatic update as user types in
 */
class QueryBox extends Component {

  constructor(props, context) {
    super(props, context);
    this.handleKeyPress = this.handleKeyPress.bind(this);
  }

  handleKeyPress(e) {
    if(e.key === 'Enter'){
      this.props.onClick(e);
    }
  }

  render() {
    return (
      <div className="input-group input-group-margin-bottom">
        <input type="text" className="form-control" placeholder="Enter city name and its coordinates..."
               aria-describedby="basic-addon1" value={this.props.value} onChange={this.props.onChange}
               onKeyPress={this.handleKeyPress} />
        <span className="input-group-btn">
          <button className="btn btn-secondary" type="button" onClick={this.props.onClick} >
            &raquo;
          </button>
        </span>
      </div>
    );
  }
}

QueryBox.propTypes = {
  value: PropTypes.string,
  onChange: PropTypes.func,
  onClick: PropTypes.func
};

export default QueryBox;