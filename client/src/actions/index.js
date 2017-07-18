import 'whatwg-fetch';

export const UPDATE_QUERY = 'UPDATE_QUERY';
export const REQUEST_SUGGESTIONS = 'REQUEST_SUGGESTIONS';
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

const homeUrl = 'api/suggestions?q=';

export const fetchSuggestions = (query) => {
  return (dispatch) => {
    dispatch(updateQuery(query));

    return fetch(homeUrl + query, {
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