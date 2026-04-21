/**
 * @version 0.0.1
 * Updated On : 
 * Create session reducer of Redux
 */
import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  userSession: null as Record<string, unknown> | null,
  role: null as 'admin' | 'user' | null,
  permissions: [] as string[],
  isLoading: true
};

const sessionSlice = createSlice({
  name: 'session',
  initialState,
  reducers: {
    loadingStart: (state, action) => {
      state.isLoading = action.payload || 'screen';
    },
    loadingStop: (state) => {
      state.isLoading = false;
    },
    login: (state, action) => {
      state.userSession = action.payload;
      state.role = action.payload?.role ?? null;
      state.permissions = action.payload?.permissions ?? [];
    },
    logout: (state) => {
      state.userSession = null;
      state.role = null;
      state.permissions = [];
      state.isLoading = false;
    },
    setRole: (state, action) => {
      state.role = action.payload;
    },
    setPermissions: (state, action) => {
      state.permissions = action.payload;
    },
    updateProfile: (state, action) => {
      if (state.userSession) {
        state.userSession = {
          ...state.userSession,
          profile: { ...(state.userSession.profile as object || {}), ...action.payload },
          is_profile_completed: true,
        };
      }
    },
  }
});

export const { loadingStart, loadingStop, login, logout, setRole, setPermissions, updateProfile } =
  sessionSlice.actions;
export default sessionSlice.reducer;
