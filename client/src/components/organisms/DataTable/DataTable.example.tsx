/**
 * DataTable Example Usage
 * 
 * Example implementation showing how to use the DataTable component
 * with all its features.
 */

import React from 'react';
import {
  DataTable,
  createTextColumn,
  createNumberColumn,
  createDateColumn,
  createCustomColumn,
  DataTableColumnDef,
} from './index';
import { Button } from '@/components/atoms/Button';

// Example data type
interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  status: 'active' | 'inactive';
  createdAt: Date;
  loginCount: number;
}

// Example data
const sampleUsers: User[] = [
  {
    id: '1',
    name: 'John Doe',
    email: 'john@example.com',
    role: 'Admin',
    status: 'active',
    createdAt: new Date('2023-01-15'),
    loginCount: 42,
  },
  {
    id: '2',
    name: 'Jane Smith',
    email: 'jane@example.com',
    role: 'User',
    status: 'active',
    createdAt: new Date('2023-02-20'),
    loginCount: 18,
  },
  {
    id: '3',
    name: 'Bob Johnson',
    email: 'bob@example.com',
    role: 'Moderator',
    status: 'inactive',
    createdAt: new Date('2023-03-10'),
    loginCount: 7,
  },
];

export const DataTableExample: React.FC = () => {
  const [data, setData] = React.useState<User[]>(sampleUsers);
  const [loading, setLoading] = React.useState(false);
  const [selectedRows, setSelectedRows] = React.useState<User[]>([]);
  const [page, setPage] = React.useState(0);
  const [pageSize, setPageSize] = React.useState(10);
  const [sortField, setSortField] = React.useState<keyof User | null>('name');
  const [sortDirection, setSortDirection] = React.useState<'asc' | 'desc' | null>('asc');
  const [searchValue, setSearchValue] = React.useState('');

  // Define columns
  const columns: DataTableColumnDef<User>[] = [
    createTextColumn('name', 'Name', 'name'),
    createTextColumn('email', 'Email', 'email'),
    createTextColumn('role', 'Role', 'role'),
    createNumberColumn('loginCount', 'Logins', 'loginCount'),
    createDateColumn('createdAt', 'Created', 'createdAt'),
    createCustomColumn(
      'status',
      'Status',
      ({ value }) => (
        <span
          className={`px-2 py-1 rounded-full text-xs font-medium ${
            value === 'active'
              ? 'bg-green-100 text-green-800'
              : 'bg-red-100 text-red-800'
          }`}
        >
          {value}
        </span>
      )
    ),
    createCustomColumn(
      'actions',
      'Actions',
      ({ row }) => (
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => console.log('Edit user:', row.id)}
          >
            Edit
          </Button>
          <Button
            size="sm"
            variant="destructive"
            onClick={() => console.log('Delete user:', row.id)}
          >
            Delete
          </Button>
        </div>
      ),
      { sortable: false, filterable: false }
    ),
  ];

  // Handle sorting
  const handleSort = React.useCallback(
    (field: keyof User, direction: 'asc' | 'desc' | null) => {
      setSortField(field);
      setSortDirection(direction);
      
      if (!direction) {
        setData(sampleUsers);
        return;
      }

      const sortedData = [...data].sort((a, b) => {
        const aValue = a[field];
        const bValue = b[field];
        
        if (aValue < bValue) return direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return direction === 'asc' ? 1 : -1;
        return 0;
      });
      
      setData(sortedData);
    },
    [data]
  );

  // Handle search
  const handleSearch = React.useCallback((value: string) => {
    setSearchValue(value);
    
    if (!value) {
      setData(sampleUsers);
      return;
    }

    const filteredData = sampleUsers.filter(user =>
      user.name.toLowerCase().includes(value.toLowerCase()) ||
      user.email.toLowerCase().includes(value.toLowerCase()) ||
      user.role.toLowerCase().includes(value.toLowerCase())
    );
    
    setData(filteredData);
  }, []);

  // Bulk actions
  const bulkActions = [
    {
      id: 'activate',
      label: 'Activate',
      icon: 'fa-solid fa-check',
      onClick: () => {
        console.log('Activate users:', selectedRows.map(u => u.id));
        setSelectedRows([]);
      },
    },
    {
      id: 'deactivate',
      label: 'Deactivate',
      icon: 'fa-solid fa-ban',
      variant: 'destructive' as const,
      onClick: () => {
        console.log('Deactivate users:', selectedRows.map(u => u.id));
        setSelectedRows([]);
      },
    },
  ];

  // Toolbar actions
  const toolbarActions = [
    {
      id: 'add',
      label: 'Add User',
      icon: 'fa-solid fa-plus',
      variant: 'primary' as const,
      onClick: () => console.log('Add new user'),
    },
    {
      id: 'export',
      label: 'Export',
      icon: 'fa-solid fa-download',
      onClick: () => console.log('Export data'),
    },
  ];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h2 className="text-2xl font-bold">DataTable Example</h2>
        <p className="text-muted-foreground">
          Comprehensive data table with sorting, pagination, selection, and search.
        </p>
      </div>

      <DataTable
        data={data}
        columns={columns}
        loading={loading}
        pagination={{
          page,
          pageSize,
          total: data.length,
          onPageChange: setPage,
          onPageSizeChange: setPageSize,
        }}
        sorting={{
          field: sortField,
          direction: sortDirection,
          onSort: handleSort,
        }}
        selection={{
          selectedRows,
          onSelectionChange: setSelectedRows,
          getRowId: (row) => row.id,
        }}
        search={{
          value: searchValue,
          placeholder: 'Search users...',
          onChange: handleSearch,
        }}
        toolbarActions={toolbarActions}
        bulkActions={bulkActions}
        onRowClick={(row) => console.log('Row clicked:', row)}
        onRowDoubleClick={(row) => console.log('Row double-clicked:', row)}
      />

      {/* Test loading state */}
      <div className="flex gap-2">
        <Button
          onClick={() => setLoading(!loading)}
          variant="outline"
        >
          Toggle Loading
        </Button>
        <Button
          onClick={() => setData([])}
          variant="outline"
        >
          Clear Data
        </Button>
        <Button
          onClick={() => setData(sampleUsers)}
          variant="outline"
        >
          Reset Data
        </Button>
      </div>
    </div>
  );
};

export default DataTableExample;