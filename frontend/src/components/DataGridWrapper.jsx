import React, { useState } from 'react';
import { DataGrid, GridToolbarContainer, GridToolbarExport } from '@mui/x-data-grid';
import { Box, TextField, InputAdornment, Button } from '@mui/material';
import { Search as SearchIcon, Add as AddIcon, FileUpload as ImportIcon } from '@mui/icons-material';

const CustomToolbar = ({ onAddClick, onImportClick, importLabel, addLabel }) => {
  return (
    <GridToolbarContainer sx={{ p: 1, display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #e2e8f0' }}>
      <Box sx={{ display: 'flex', gap: 1 }}>
        <GridToolbarExport sx={{ color: 'primary.main' }} />
        {onImportClick && (
          <Button startIcon={<ImportIcon />} size="small" onClick={onImportClick} sx={{ color: 'secondary.main' }}>
            {importLabel || 'Import Excel'}
          </Button>
        )}
      </Box>
      {onAddClick && (
        <Button startIcon={<AddIcon />} variant="contained" size="small" onClick={onAddClick}>
          {addLabel || 'Add New'}
        </Button>
      )}
    </GridToolbarContainer>
  );
};

const DataGridWrapper = ({
  rows,
  columns,
  loading,
  searchField = 'name',
  addLabel,
  onAddClick,
  importLabel,
  onImportClick,
  pageSize = 10,
  ...props
}) => {
  const [searchText, setSearchText] = useState('');

  // Client-side search implementation matching values globally
  const filteredRows = rows.filter((row) => {
    return Object.values(row).some((val) =>
      String(val).toLowerCase().includes(searchText.toLowerCase())
    );
  });

  return (
    <Box sx={{ width: '100%', height: 600, backgroundColor: 'background.paper', border: '1px solid', borderColor: 'divider', borderRadius: 2, overflow: 'hidden' }}>
      <Box sx={{ p: 2, display: 'flex', justifyContent: 'flex-start' }}>
        <TextField
          placeholder="Global Search..."
          size="small"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          sx={{ width: 300 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ color: 'text.secondary' }} />
              </InputAdornment>
            ),
          }}
        />
      </Box>
      
      <DataGrid
        rows={filteredRows}
        columns={columns}
        loading={loading}
        pageSizeOptions={[5, 10, 20, 50]}
        initialState={{
          pagination: {
            paginationModel: { pageSize: pageSize, page: 0 },
          },
        }}
        showToolbar
        slots={{
          toolbar: CustomToolbar,
        }}
        slotProps={{
          toolbar: {
            onAddClick,
            onImportClick,
            importLabel,
            addLabel,
          },
        }}
        sx={{
          border: 'none',
          color: 'text.primary',
          fontFamily: 'Inter, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
          '& .MuiDataGrid-cell': {
            borderBottom: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            fontSize: '0.9rem',
            color: '#0f172a',
          },
          '& .MuiDataGrid-columnHeaders': {
            backgroundColor: '#f8fafc !important',
            borderBottom: '1px solid #e2e8f0',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            fontSize: '0.72rem',
            fontWeight: 800,
            color: '#475569',
          },
          '& .MuiDataGrid-columnHeaderTitle': {
            fontWeight: 800,
          },
          '& .MuiDataGrid-row': {
            transition: 'all 0.2s ease',
            borderBottom: '1px solid #e2e8f0',
            '&:hover': {
              backgroundColor: '#f1f5f9 !important',
            },
          },
          '& .MuiDataGrid-footerContainer': {
            backgroundColor: '#ffffff',
            borderTop: '1px solid #e2e8f0',
          },
          '& .MuiDataGrid-virtualScroller': {
            '&::-webkit-scrollbar': {
              width: '6px',
              height: '6px',
            },
            '&::-webkit-scrollbar-track': {
              background: '#f1f5f9',
            },
            '&::-webkit-scrollbar-thumb': {
              background: '#cbd5e1',
              borderRadius: '3px',
            },
            '&::-webkit-scrollbar-thumb:hover': {
              background: '#94a3b8',
            },
          },
        }}
        {...props}
      />
    </Box>
  );
};

export default DataGridWrapper;
