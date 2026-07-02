/**
 * @version 0.0.1
 * Root reducer - Combines all reducers
 */
import { combineReducers } from '@reduxjs/toolkit';
import sessionReducer from './sessionReducer';
import selectedOrgReducer from './selectedOrgReducer';

const rootReducer = combineReducers({
  session: sessionReducer,
  selectedOrg: selectedOrgReducer,
});

export default rootReducer;

