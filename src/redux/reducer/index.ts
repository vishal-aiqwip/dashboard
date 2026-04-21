/**
 * @version 0.0.1
 * Root reducer - Combines all reducers
 */
import { combineReducers } from '@reduxjs/toolkit';
import sessionReducer from './sessionReducer';

const rootReducer = combineReducers({
  session: sessionReducer,
  // user: userReducer,
});

export default rootReducer;

