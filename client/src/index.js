import React from 'react';
import ReactDOM from 'react-dom';
import { Provider } from 'react-redux';
import { createStore, compose, applyMiddleware } from 'redux';
import thunkMiddleware from 'redux-thunk';
import { createLogger } from 'redux-logger';

import globalReducer from './reducers';
import App from './components/App';

const loggerMiddleware = createLogger();

let store = createStore(
  globalReducer,
  compose (
    applyMiddleware(thunkMiddleware, loggerMiddleware)
  )
);

ReactDOM.render(
    <Provider store={store}>
        <App />
    </Provider>,
  document.getElementById('root')
);
