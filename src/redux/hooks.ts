/**
 * @version 0.0.1
 * Typed Redux hooks
 */
import { useDispatch, useSelector, type TypedUseSelectorHook } from 'react-redux';
import type rootReducer from './reducer';

type RootState = ReturnType<typeof rootReducer>;

/**
 *  Use throughout your app instead of plain `useDispatch` and `useSelector`
 * */

export const useAppDispatch = () => useDispatch();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

