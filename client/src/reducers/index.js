import { combineReducers } from 'redux';
import { UPDATE_QUERY, RECEIVE_SUGGESTIONS } from '../actions'

const query = (state = '', action) => {
  switch (action.type) {
    case UPDATE_QUERY: return action.query;
    default: return state;
  }
};

const suggestions  = (state = [], action) => {
  switch(action.type) {
    case RECEIVE_SUGGESTIONS: return action.suggestions;
    default: return state;
  }
};

const globalReducer = combineReducers({
  query,
  suggestions
});

export default globalReducer;