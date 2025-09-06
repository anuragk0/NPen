import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Organization, CreateOrganizationData } from '@/types';
import { organizationAPI } from '@/lib/api';

interface OrganizationsState {
  organizations: Organization[];
  currentOrganization: Organization | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: OrganizationsState = {
  organizations: [],
  currentOrganization: null,
  isLoading: false,
  error: null,
};

export const fetchOrganizationsAsync = createAsyncThunk(
  'organizations/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      const response = await organizationAPI.list();
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch organizations');
    }
  }
);

export const createOrganizationAsync = createAsyncThunk(
  'organizations/create',
  async (organizationData: CreateOrganizationData, { rejectWithValue }) => {
    try {
      const response = await organizationAPI.create(organizationData);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create organization');
    }
  }
);

export const updateOrganizationAsync = createAsyncThunk(
  'organizations/update',
  async ({ id, data }: { id: string; data: CreateOrganizationData }, { rejectWithValue }) => {
    try {
      const response = await organizationAPI.update(id, data);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update organization');
    }
  }
);

export const deleteOrganizationAsync = createAsyncThunk(
  'organizations/delete',
  async (id: string, { rejectWithValue }) => {
    try {
      await organizationAPI.delete(id);
      return id;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete organization');
    }
  }
);

const organizationsSlice = createSlice({
  name: 'organizations',
  initialState,
  reducers: {
    setCurrentOrganization: (state, action: PayloadAction<Organization | null>) => {
      state.currentOrganization = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch organizations
      .addCase(fetchOrganizationsAsync.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchOrganizationsAsync.fulfilled, (state, action) => {
        state.isLoading = false;
        state.organizations = action.payload;
      })
      .addCase(fetchOrganizationsAsync.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Create organization
      .addCase(createOrganizationAsync.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createOrganizationAsync.fulfilled, (state, action) => {
        state.isLoading = false;
        state.organizations.push(action.payload);
      })
      .addCase(createOrganizationAsync.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Update organization
      .addCase(updateOrganizationAsync.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateOrganizationAsync.fulfilled, (state, action) => {
        state.isLoading = false;
        const index = state.organizations.findIndex(org => org.id === action.payload.id);
        if (index !== -1) {
          state.organizations[index] = action.payload;
        }
        if (state.currentOrganization?.id === action.payload.id) {
          state.currentOrganization = action.payload;
        }
      })
      .addCase(updateOrganizationAsync.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Delete organization
      .addCase(deleteOrganizationAsync.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(deleteOrganizationAsync.fulfilled, (state, action) => {
        state.isLoading = false;
        state.organizations = state.organizations.filter(org => org.id !== action.payload);
        if (state.currentOrganization?.id === action.payload) {
          state.currentOrganization = null;
        }
      })
      .addCase(deleteOrganizationAsync.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const { setCurrentOrganization, clearError } = organizationsSlice.actions;
export default organizationsSlice.reducer;


