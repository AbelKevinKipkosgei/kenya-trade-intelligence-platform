import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

/**
 * Shared filter context for the Trade Intelligence Dashboard, Market &
 * Product Explorer, and related views — so switching sector/country/date
 * range in one place is reflected everywhere that reads it.
 */
export type FlowType = "all" | "export" | "import";

export interface FiltersState {
  sectorId: number | null;
  countryId: number | null;
  hsCode: string | null;
  flowType: FlowType;
  dateFrom: string | null; // ISO date, e.g. "2023-01-01"
  dateTo: string | null;
}

const initialState: FiltersState = {
  sectorId: null,
  countryId: null,
  hsCode: null,
  flowType: "all",
  dateFrom: null,
  dateTo: null,
};

const filtersSlice = createSlice({
  name: "filters",
  initialState,
  reducers: {
    setSector(state, action: PayloadAction<number | null>) {
      state.sectorId = action.payload;
    },
    setCountry(state, action: PayloadAction<number | null>) {
      state.countryId = action.payload;
    },
    setHsCode(state, action: PayloadAction<string | null>) {
      state.hsCode = action.payload;
    },
    setFlowType(state, action: PayloadAction<FlowType>) {
      state.flowType = action.payload;
    },
    setDateRange(state, action: PayloadAction<{ from: string | null; to: string | null }>) {
      state.dateFrom = action.payload.from;
      state.dateTo = action.payload.to;
    },
    resetFilters() {
      return initialState;
    },
  },
});

export const { setSector, setCountry, setHsCode, setFlowType, setDateRange, resetFilters } =
  filtersSlice.actions;
export default filtersSlice.reducer;
