/**
 * @file Contains reducers that transform a previous state into a new one, after receiving a dispatch from an action
 */

import {combineReducers} from 'redux';
import {UPDATE_QUERY, RECEIVE_SUGGESTIONS, TOGGLE_WAITING} from '../actions'

/**
 * @desc Text entered by user in the query box
 */
const query = (state = '', action) => {
  switch (action.type) {
    case UPDATE_QUERY:
      return action.query;
    default:
      return state;
  }
};

const _extractDetails = (query) => {
  const regex = /^((?:(?!(-?\d)).)*)(-?\d+(?:\.\d*)?)?(?:(?!(-?\d)).)*(-?\d+(?:\.\d*)?)?.*$/g;
  let match = regex.exec(query);
  return {
    q: match[1].trim(),
    latitude: parseFloat(match[3]),
    longitude: parseFloat(match[5])
  };
};

/**
 * @desc Fetches text entered by user into the query box and divides it into q, latitude and longitude
 */
const queryDetails = (state = {q: '', latitude: NaN, longitude: NaN}, action) => {
  switch (action.type) {
    case UPDATE_QUERY:
      return _extractDetails(action.query);
    default:
      return state;
  }
};

/**
 * @desc List of suggestions returned by the API.
 */
const suggestions = (state = [], action) => {
  switch (action.type) {
    case RECEIVE_SUGGESTIONS:
      return action.suggestions;
    default:
      return state;
  }
};

/**
 * @desc When true, map does not update. When false, map starts updating.
 */
const isWaiting = (state = false, action)=> {
  switch (action.type) {
    case TOGGLE_WAITING:
      return action.isWaiting;
    default:
      return state;
  }
};


/**
 * @description Determines the global state of the app, which changes every time an action's result is dispatched
 * @type {Reducer<any>}
 */
const globalReducer = combineReducers({
  query,
  queryDetails,
  suggestions,
  isWaiting
});

export default globalReducer;