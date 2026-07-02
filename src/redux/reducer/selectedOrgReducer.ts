import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { OrgBrief } from '@/services/organizations/organizations';

type SelectedOrgState = {
  selectedOrg: OrgBrief | null;
};

const initialState: SelectedOrgState = {
  selectedOrg: null,
};

const selectedOrgSlice = createSlice({
  name: 'selectedOrg',
  initialState,
  reducers: {
    setSelectedOrg(state, action: PayloadAction<OrgBrief>) {
      state.selectedOrg = action.payload;
    },
    clearSelectedOrg(state) {
      state.selectedOrg = null;
    },
  },
});

export const { setSelectedOrg, clearSelectedOrg } = selectedOrgSlice.actions;
export default selectedOrgSlice.reducer;
