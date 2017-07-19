import 'whatwg-fetch';

export const UPDATE_QUERY = 'UPDATE_QUERY';
export const RECEIVE_SUGGESTIONS = 'RECEIVE_SUGGESTIONS';

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

const homeUrl = 'api/suggestions?';

export const fetchSuggestions = (query) => {
  return (dispatch, getState) => {
    dispatch(updateQuery(query));

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
    }).then((response) => { return response.json();
    }).then((json) => {
      console.log(json);
      dispatch(receiveSuggestions(json))
    });
  };
};