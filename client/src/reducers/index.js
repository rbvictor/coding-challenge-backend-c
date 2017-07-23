import {combineReducers} from 'redux';
import {UPDATE_QUERY, RECEIVE_SUGGESTIONS, TOGGLE_WAITING} from '../actions'

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

const queryDetails = (state = {q: '', latitude: NaN, longitude: NaN}, action) => {
  switch (action.type) {
    case UPDATE_QUERY:
      return _extractDetails(action.query);
    default:
      return state;
  }
};

const suggestions = (state = [], action) => {
  switch (action.type) {
    case RECEIVE_SUGGESTIONS:
      return action.suggestions;
    default:
      return state;
  }
};

const isWaiting = (state = false, action)=> {
  switch (action.type) {
    case TOGGLE_WAITING:
      return action.isWaiting;
    default:
      return state;
  }
};

const globalReducer = combineReducers({
  query,
  queryDetails,
  suggestions,
  isWaiting
});

export default globalReducer;