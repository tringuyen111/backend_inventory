import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../../../lib/supabaseClient';
import { Database } from '../../../types/supabase';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { Button } from '../../../components/ui/Button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../components/ui/Table';
import { Skeleton } from '../../../components/ui/Skeleton';
import * as Icons from '../../../components/icons';
import { useDebounce } from '../../../hooks/useDebounce';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuCheckboxItem, DropdownMenuLabel, DropdownMenuSeparator } from '../../../components/ui/DropdownMenu';

// Define the type for an organization with joined user data
type Organization = Database['public']['Tables']['organizations']['Row'] & {
    created_by: { full_name: string | null } | null;
    updated_by: { full_name: string | null } | null;
};

const StatusBadge: React.FC<{ isActive: boolean }> = ({ isActive }) => {
    const baseClasses = "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium";
    if (isActive) {
        return <span className={`${baseClasses} bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400`}>ACTIVE</span>;
    }
    return <span className={`${baseClasses} bg-gray-100 text-gray-800 dark:bg-gray-800/30 dark:text-gray-300`}>INACTIVE</span>;
};


const OrganizationsList: React.FC = () => {
    const [organizations, setOrganizations] = useState<Organization[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    
    // Filtering and Searching State
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const debouncedSearchTerm = useDebounce(searchTerm, 500);

    // Pagination State
    const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });
    const [totalRows, setTotalRows] = useState(0);

    // Column Visibility State
    const [columnVisibility, setColumnVisibility] = useState<Record<string, boolean>>({
        code: true,
        name: true,
        phone: true,
        email: false,
        status: true,
        updated_at: true,
        updated_by_name: true,
        created_at: false,
        created_by_name: false,
        actions: true,
    });

    const pageCount = useMemo(() => Math.ceil(totalRows / pagination.pageSize), [totalRows, pagination.pageSize]);
    const canPreviousPage = pagination.pageIndex > 0;
    const canNextPage = pagination.pageIndex < pageCount - 1;

    const fetchOrganizations = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            const from = pagination.pageIndex * pagination.pageSize;
            const to = from + pagination.pageSize - 1;

            let query = supabase
                .from('organizations')
                .select('*, created_by(full_name), updated_by(full_name)', { count: 'exact' });

            if (debouncedSearchTerm) {
                query = query.or(`name.ilike.%${debouncedSearchTerm}%,code.ilike.%${debouncedSearchTerm}%`);
            }

            if (statusFilter !== 'all') {
                query = query.eq('is_active', statusFilter === 'active');
            }
            
            query = query.order('created_at', { ascending: false }).range(from, to);

            const { data, error: queryError, count } = await query;

            if (queryError) throw queryError;

            setOrganizations(data as Organization[] || []);
            setTotalRows(count || 0);
        } catch (err: any) {
            console.error('Error fetching organizations:', err);
            let errorMessage = 'An unexpected error occurred. Please try again.';
            if (typeof err?.message === 'string') {
                errorMessage = err.message;
            }
            setError(`Failed to fetch organizations: ${errorMessage}`);
        } finally {
            setLoading(false);
        }
    }, [debouncedSearchTerm, statusFilter, pagination]);

    useEffect(() => {
        fetchOrganizations();
    }, [fetchOrganizations]);

    const columnConfig = useMemo(() => [
        { id: 'code', label: 'Code' },
        { id: 'name', label: 'Name' },
        { id: 'phone', label: 'Phone' },
        { id: 'email', label: 'Email' },
        { id: 'status', label: 'Status' },
        { id: 'updated_at', label: 'Updated At' },
        { id: 'updated_by_name', label: 'Updated By' },
        { id: 'created_at', label: 'Created At' },
        { id: 'created_by_name', label: 'Created By' },
        { id: 'actions', label: 'Actions' },
    ], []);
    
    const renderCellContent = (org: Organization, columnId: string) => {
        switch (columnId) {
            case 'code': return <span className="font-medium">{org.code}</span>;
            case 'name': return org.name;
            case 'phone': return org.phone || 'N/A';
            case 'email': return org.email || 'N/A';
            case 'status': return <StatusBadge isActive={org.is_active} />;
            case 'updated_at': return org.updated_at ? new Date(org.updated_at).toLocaleString('en-GB', { hour12: false }).replace(',', '') : 'N/A';
            case 'updated_by_name': return org.updated_by?.full_name || 'N/A';
            case 'created_at': return new Date(org.created_at).toLocaleString('en-GB', { hour12: false }).replace(',', '');
            case 'created_by_name': return org.created_by?.full_name || 'N/A';
            default: return null;
        }
    };
    
    return (
        <div className="bg-white dark:bg-gray-950 rounded-lg shadow-sm overflow-hidden h-full flex flex-col">
            <div className="p-4 border-b border-gray-200 dark:border-gray-800">
                <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                        <Input
                            placeholder="Search by code or name..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-64"
                        />
                        <Select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                             className="w-40"
                        >
                            <option value="all">All Statuses</option>
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                        </Select>
                    </div>
                    <div className="flex items-center gap-2">
                         <Button disabled variant="outline" className="text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-700 cursor-not-allowed">
                            <Icons.FileDown className="mr-2 h-4 w-4" /> Export
                        </Button>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" className="text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-700">
                                    <Icons.Columns className="mr-2 h-4 w-4" /> Columns
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                                <DropdownMenuLabel>Toggle Columns</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                {columnConfig.filter(c => c.id !== 'actions').map(column => (
                                    <DropdownMenuCheckboxItem
                                        key={column.id}
                                        checked={columnVisibility[column.id]}
                                        onCheckedChange={(value) => setColumnVisibility(prev => ({ ...prev, [column.id]: !!value }))}
                                    >
                                        {column.label}
                                    </DropdownMenuCheckboxItem>
                                ))}
                            </DropdownMenuContent>
                        </DropdownMenu>
                        <Button>
                           <Icons.Plus className="mr-2 h-4 w-4" /> Create new
                        </Button>
                    </div>
                </div>
            </div>

            <div className="flex-grow overflow-hidden">
                 {error && <div className="text-red-500 p-4 bg-red-100 rounded-md m-4">Error: {error}</div>}
                <div className="h-full overflow-auto">
                    <Table>
                        <TableHeader className="z-10 bg-gray-50 dark:bg-gray-900">
                            <TableRow>
                                {columnConfig.map(col => columnVisibility[col.id] && (
                                    <TableHead 
                                        key={col.id}
                                        className={
                                            (col.id === 'code' ? 'sticky left-0 z-20 bg-gray-50 dark:bg-gray-900' : '') +
                                            (col.id === 'actions' ? 'sticky right-0 z-20 bg-gray-50 dark:bg-gray-900 text-right pr-6' : '')
                                        }
                                    >
                                        {col.label}
                                    </TableHead>
                                ))}
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                Array.from({ length: pagination.pageSize }).map((_, i) => (
                                    <TableRow key={`skeleton-${i}`}>
                                        {columnConfig.map(col => columnVisibility[col.id] && (
                                            <TableCell 
                                                key={`cell-skeleton-${col.id}`}
                                                className={
                                                    (col.id === 'code' ? 'sticky left-0 bg-white dark:bg-gray-950' : '') +
                                                    (col.id === 'actions' ? 'sticky right-0 bg-white dark:bg-gray-950' : '')
                                                }
                                            >
                                                <Skeleton className="h-5 w-full" />
                                            </TableCell>
                                        ))}
                                    </TableRow>
                                ))
                            ) : organizations.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={Object.values(columnVisibility).filter(Boolean).length}>
                                        <div className="flex flex-col items-center justify-center text-center p-8 space-y-4">
                                            <Icons.Landmark className="h-16 w-16 text-gray-400" />
                                            <h3 className="text-xl font-semibold">No Organizations Found</h3>
                                            <p className="text-gray-500">Try adjusting your filters or create a new organization.</p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                organizations.map((org) => (
                                    <TableRow key={org.id}>
                                        {columnConfig.map(col => columnVisibility[col.id] && (
                                            <TableCell
                                                key={col.id}
                                                className={
                                                    (col.id === 'code' ? 'sticky left-0 bg-white dark:bg-gray-950' : '') +
                                                    (col.id === 'actions' ? 'sticky right-0 bg-white dark:bg-gray-950' : '')
                                                }
                                            >
                                                {col.id === 'actions' ? (
                                                     <div className="flex items-center justify-end space-x-1">
                                                        <Button variant="ghost" size="icon" aria-label="Edit"><Icons.Pencil className="h-4 w-4" /></Button>
                                                        <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-600" aria-label="Delete"><Icons.Trash2 className="h-4 w-4" /></Button>
                                                    </div>
                                                ) : renderCellContent(org, col.id) }
                                            </TableCell>
                                        ))}
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>
            <div className="flex-shrink-0 flex items-center justify-between p-4 border-t border-gray-200 dark:border-gray-800">
                <div className="text-sm text-gray-600 dark:text-gray-400">
                    Total: <span className="font-semibold text-gray-800 dark:text-gray-200">{totalRows}</span>
                </div>
                 <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setPagination(p=>({...p, pageIndex: p.pageIndex - 1}))} disabled={!canPreviousPage}>
                            <Icons.ChevronLeft className="h-4 w-4"/>
                        </Button>
                        <span className="text-sm font-medium border rounded-md px-3 py-1.5">
                            {pagination.pageIndex + 1}
                        </span>
                        <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setPagination(p=>({...p, pageIndex: p.pageIndex + 1}))} disabled={!canNextPage}>
                            <Icons.ChevronRight className="h-4 w-4"/>
                        </Button>
                    </div>
                    <Select
                        value={pagination.pageSize}
                        onChange={e => setPagination(p => ({ ...p, pageSize: Number(e.target.value), pageIndex: 0 }))}
                        className="h-9"
                    >
                        {[10, 20, 30, 50].map(size => <option key={size} value={size}>{size} / page</option>)}
                    </Select>
                </div>
             </div>
        </div>
    );
};

export default OrganizationsList;