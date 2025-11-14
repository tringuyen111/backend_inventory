
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
import { Badge } from '../../../components/ui/Badge';

// Define the type for an organization with joined user data
type Organization = Database['public']['Tables']['organizations']['Row'] & {
    created_by: { full_name: string | null } | null;
    updated_by: { full_name: string | null } | null;
};

const OrganizationsList: React.FC = () => {
    const [organizations, setOrganizations] = useState<Organization[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isUpdating, setIsUpdating] = useState<number | null>(null);
    
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

    const handleToggleStatus = async (orgId: number, currentStatus: boolean) => {
        setIsUpdating(orgId);
        const { error: updateError } = await supabase
            .from('organizations')
            .update({ is_active: !currentStatus })
            .eq('id', orgId);

        if (updateError) {
            setError(`Failed to update status: ${updateError.message}`);
        } else {
            await fetchOrganizations(); // Refetch
        }
        setIsUpdating(null);
    };

    const handleExport = () => {
        const headers = columnConfig
            .filter(col => col.id !== 'actions' && columnVisibility[col.id])
            .map(col => `"${col.label}"`);

        const rows = organizations.map(org => {
            return columnConfig
                .filter(col => col.id !== 'actions' && columnVisibility[col.id])
                .map(col => {
                    let value: any;
                    switch (col.id) {
                        case 'code': value = org.code; break;
                        case 'name': value = org.name; break;
                        case 'phone': value = org.phone; break;
                        case 'email': value = org.email; break;
                        case 'status': value = org.is_active ? 'Active' : 'Inactive'; break;
                        case 'updated_at': value = org.updated_at ? new Date(org.updated_at).toLocaleString('en-GB', { hour12: false }).replace(',', '') : ''; break;
                        case 'updated_by_name': value = org.updated_by?.full_name; break;
                        case 'created_at': value = new Date(org.created_at).toLocaleString('en-GB', { hour12: false }).replace(',', ''); break;
                        case 'created_by_name': value = org.created_by?.full_name; break;
                        default: value = '';
                    }
                    return `"${String(value || '').replace(/"/g, '""')}"`;
                });
        });

        const csvContent = "data:text/csv;charset=utf-8," 
            + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "organizations_export.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const columnConfig = useMemo(() => [
        { id: 'code', label: 'Code', widthClass: 'w-48' },
        { id: 'name', label: 'Name', widthClass: 'w-64' },
        { id: 'phone', label: 'Phone', widthClass: 'w-40' },
        { id: 'email', label: 'Email', widthClass: 'w-64' },
        { id: 'status', label: 'Status', widthClass: 'w-32' },
        { id: 'updated_at', label: 'Updated At', widthClass: 'w-48' },
        { id: 'updated_by_name', label: 'Updated By', widthClass: 'w-48' },
        { id: 'created_at', label: 'Created At', widthClass: 'w-48' },
        { id: 'created_by_name', label: 'Created By', widthClass: 'w-48' },
        { id: 'actions', label: 'Actions', widthClass: 'w-28' },
    ], []);
    
    const renderCellContent = (org: Organization, columnId: string) => {
        switch (columnId) {
            case 'code': return <span className="font-medium">{org.code}</span>;
            case 'name': return org.name;
            case 'phone': return org.phone || 'N/A';
            case 'email': return org.email || 'N/A';
            case 'status': return <Badge variant={org.is_active ? 'success' : 'destructive'}>{org.is_active ? 'Active' : 'Inactive'}</Badge>;
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
                         <Button onClick={handleExport} disabled={loading || organizations.length === 0} variant="outline" className="text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-700">
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

            <div className="flex-grow overflow-hidden min-w-0">
                 {error && <div className="text-red-500 p-4 bg-red-100 rounded-md m-4">Error: {error}</div>}
                <div className="h-full overflow-auto">
                    <Table>
                        <TableHeader className="z-10">
                            <TableRow>
                                {columnConfig.map(col => columnVisibility[col.id] && (
                                    <TableHead 
                                        key={col.id}
                                        className={
                                          (col.id === 'code' ? 'sticky left-0 z-20 ' : '') +
                                          (col.id === 'name' ? 'sticky left-[12rem] z-20 ' : '') +
                                          (col.id === 'actions' ? 'sticky right-0 z-20 text-right pr-6 ' : '') +
                                          (col.widthClass || '')
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
                                                    (col.id === 'code' ? 'sticky left-0 z-10' : '') +
                                                    (col.id === 'name' ? 'sticky left-[12rem] z-10' : '') +
                                                    (col.id === 'actions' ? 'sticky right-0 z-10' : '')
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
                                                    (col.id === 'code' ? 'sticky left-0 z-10' : '') +
                                                    (col.id === 'name' ? 'sticky left-[12rem] z-10' : '') +
                                                    (col.id === 'actions' ? 'sticky right-0 z-10' : '')
                                                }
                                            >
                                                {col.id === 'actions' ? (
                                                     <div className="flex items-center justify-end">
                                                        <Button variant="ghost" size="icon" aria-label="Edit" className="text-slate-500 hover:text-indigo-600"><Icons.Pencil className="h-4 w-4" /></Button>
                                                        <Button 
                                                            variant="ghost" 
                                                            size="icon" 
                                                            aria-label={org.is_active ? 'Lock' : 'Unlock'} 
                                                            className={`text-slate-500 ${org.is_active ? 'hover:text-red-600' : 'hover:text-emerald-600'}`}
                                                            onClick={() => handleToggleStatus(org.id, org.is_active)}
                                                            disabled={isUpdating === org.id}
                                                        >
                                                            {isUpdating === org.id ? 
                                                                <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" /> :
                                                                (org.is_active ? <Icons.Lock className="h-4 w-4" /> : <Icons.Unlock className="h-4 w-4" />)
                                                            }
                                                        </Button>
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