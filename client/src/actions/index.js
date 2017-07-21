import 'whatwg-fetch';

export const UPDATE_QUERY = 'UPDATE_QUERY';
export const RECEIVE_SUGGESTIONS = 'RECEIVE_SUGGESTIONS';
export const TOGGLE_WAITING = 'TOGGLE_WAITING';

const updateQuery = (query) => (
  {
    type: UPDATE_QUERY,
    query
  });

const receiveSuggestions = (json) => (
  {
    type: RECEIVE_SUGGESTIONS,
    suggestions: json.suggestions
  });

const toggleWaiting = (isWaiting) => (
  {
    type: TOGGLE_WAITING,
    isWaiting
  }
);

const shouldKeepWaiting = (json) => {
  return (dispatch, getState) => {
    dispatch(toggleWaiting(getState().suggestions !== json.suggestions));
  }
};

const homeUrl = 'api/suggestions?';

export const fetchSuggestions = (query) => {
  return (dispatch, getState) => {

    dispatch(updateQuery(query));
    dispatch(toggleWaiting(true));

    let newState = getState();
    let params = [];

    if (newState.queryDetails.q)
      params.push('q=' + newState.queryDetails.q);

    if (newState.queryDetails.latitude)
      params.push('latitude=' + newState.queryDetails.latitude);

    if (newState.queryDetails.longitude)
      params.push('longitude=' + newState.queryDetails.longitude);

    return fetch(homeUrl + params.join('&'), {
      method: 'GET',
      mode: 'cors',
      header: new Headers({
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'multipart/form-data'
      })
    }).then((response) => { return (getState().query.trim()) ? response.json() : { suggestions: [] };
    }).then((json) => {
      dispatch(receiveSuggestions(json));
      setTimeout(() => { dispatch(shouldKeepWaiting(json)); }, 500);
    });
  };
};