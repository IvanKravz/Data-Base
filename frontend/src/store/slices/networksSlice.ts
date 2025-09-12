import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
// import { Network } from '../types';
import { networksApi } from '../../api/networksApi';
import { Network } from '../../types';

interface NetworksState {
  networks: Network[];
  currentNetwork: Network | null;
  loading: boolean;
  error: string | null;
}

const initialState: NetworksState = {
  networks: [],
  currentNetwork: null,
  loading: false,
  error: null,
};

// Асинхронные действия
export const fetchNetworks = createAsyncThunk(
  'networks/fetchNetworks',
  async (token: string, { rejectWithValue }) => {
    try {
      const response = await networksApi.getNetworks(token);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data || 'Ошибка загрузки сетей');
    }
  }
);

export const fetchNetwork = createAsyncThunk(
  'networks/fetchNetwork',
  async ({ token, id }: { token: string; id: string }, { rejectWithValue }) => {
    try {
      const response = await networksApi.getNetwork(token, id);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data || 'Ошибка загрузки сети');
    }
  }
);

export const updateNetwork = createAsyncThunk(
  'networks/updateNetwork',
  async (
    { token, id, networkData }: { token: string; id: string; networkData: Partial<Network> },
    { rejectWithValue }
  ) => {
    try {
      const response = await networksApi.updateNetwork(token, id, networkData);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data || 'Ошибка обновления сети');
    }
  }
);

const networksSlice = createSlice({
  name: 'networks',
  initialState,
  reducers: {
    clearCurrentNetwork: (state) => {
      state.currentNetwork = null;
    },
    setNetworks: (state, action: PayloadAction<Network[]>) => {
      state.networks = action.payload;
    },
    setCurrentNetwork: (state, action: PayloadAction<Network>) => {
      state.currentNetwork = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Networks
      .addCase(fetchNetworks.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchNetworks.fulfilled, (state, action: PayloadAction<Network[]>) => {
        state.loading = false;
        state.networks = action.payload;
      })
      .addCase(fetchNetworks.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Fetch Network
      .addCase(fetchNetwork.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchNetwork.fulfilled, (state, action: PayloadAction<Network>) => {
        state.loading = false;
        state.currentNetwork = action.payload;
      })
      .addCase(fetchNetwork.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Update Network
      .addCase(updateNetwork.fulfilled, (state, action: PayloadAction<Network>) => {
        state.currentNetwork = action.payload;
        // Update the network in the networks list
        const index = state.networks.findIndex(network => network.id === action.payload.id);
        if (index !== -1) {
          state.networks[index] = action.payload;
        }
      })
      .addCase(updateNetwork.rejected, (state, action) => {
        state.error = action.payload as string;
      });
  },
});

export const { clearCurrentNetwork, setNetworks, setCurrentNetwork } = networksSlice.actions;
export default networksSlice.reducer;