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

type OrganizationForFilter = Database['public']['Views']['v_organizations']['Row'];
// FIX: Switched from using the 'v_branches' view to querying the 'branches' table directly,
// and defined a type that includes the joined data objects, aligning with the 'OrganizationsList' pattern.
type BranchWithDetails = Database['public']['Tables']['branches']['Row'] & {
  organizations: { name: string | null } | null;
  created_by: { full_name: string | null } | null;
  updated_by: { full_name: string | null } | null;
  manager_id: { full_name: string | null } | null;
};


const BranchesList: React.FC = () => {
    const [branches, setBranches] = useState<BranchWithDetails[]>([]);
    const [organizations, setOrganizations] = useState<OrganizationForFilter[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    
    // Filtering and Searching State
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [organizationFilter, setOrganizationFilter] = useState('all');
    const debouncedSearchTerm = useDebounce(searchTerm, 500);

    // Pagination State
    const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });
    const [totalRows, setTotalRows] = useState(0);

    // Column Visibility State
    const [columnVisibility, setColumnVisibility] = useState<Record<string, boolean>>({
        code: true,
        name: true,
        organization_name: true,
        phone: true,
        is_active: true,
        updated_at: true,
        updated_by_name: true,
        address: false,
        manager_name: false,
        created_at: false,
        created_by_name: false,
        notes: false,
        actions: true,
    });

    const pageCount = useMemo(() => Math.ceil(totalRows / pagination.pageSize), [totalRows, pagination.pageSize]);
    const canPreviousPage = pagination.pageIndex > 0;
    const canNextPage = pagination.pageIndex < pageCount - 1;
    
    useEffect(() => {
        // Fetch organizations for the filter dropdown
        const fetchOrganizationsForFilter = async () => {
            const { data, error } = await supabase
                .from('v_organizations')
                .select('id, name')
                .order('name');

            if (error) {
                console.error('Error fetching organizations for filter:', error);
            } else {
                setOrganizations(data || []);
            }
        };
        fetchOrganizationsForFilter();
    }, []);

    const fetchBranches = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            const from = pagination.pageIndex * pagination.pageSize;
            const to = from + pagination.pageSize - 1;

            // FIX: Changed query from 'v_branches' view to 'branches' table and added explicit joins
            // for related data, following the pattern of OrganizationsList.tsx as hinted by the user.
            let query = supabase
                .from('branches')
                .select('*, organizations(name), created_by(full_name), updated_by(full_name), manager_id(full_name)', { count: 'exact' });

            if (debouncedSearchTerm) {
                query = query.or(`name.ilike.%${debouncedSearchTerm}%,code.ilike.%${debouncedSearchTerm}%`);
            }
            if (statusFilter !== 'all') {
                query = query.eq('is_active', statusFilter === 'true');
            }
            if (organizationFilter !== 'all') {
                query = query.eq('organization_id', organizationFilter);
            }
            
            query = query.order('created_at', { ascending: false }).range(from, to);

            const { data, error: queryError, count } = await query;

            if (queryError) throw queryError;

            setBranches(data as BranchWithDetails[] || []);
            setTotalRows(count || 0);
        } catch (err: any) {
            console.error('Error fetching branches:', err);
            setError(`Failed to fetch branches: ${err.message}`);
        } finally {
            setLoading(false);
        }
    }, [debouncedSearchTerm, statusFilter, organizationFilter, pagination]);

    useEffect(() => {
        fetchBranches();
    }, [fetchBranches]);

    const columnConfig = useMemo(() => [
        { id: 'code', label: 'Mã chi nhánh' },
        { id: 'name', label: 'Tên chi nhánh' },
        { id: 'organization_name', label: 'Tổ chức' },
        { id: 'phone', label: 'Số điện thoại' },
        { id: 'is_active', label: 'Trạng thái' },
        { id: 'updated_at', label: 'Cập nhật lúc' },
        { id: 'updated_by_name', label: 'Cập nhật bởi' },
        { id: 'address', label: 'Địa chỉ' },
        { id: 'manager_name', label: 'Quản lý' },
        { id: 'created_at', label: 'Ngày tạo' },
        { id: 'created_by_name', label: 'Người tạo' },
        { id: 'notes', label: 'Ghi chú' },
        { id: 'actions', label: 'Thao tác' },
    ], []);
    
    // FIX: Updated to access nested data from the joined objects.
    const renderCellContent = (branch: BranchWithDetails, columnId: string) => {
        switch (columnId) {
            case 'code': return <span className="font-medium">{branch.code}</span>;
            case 'name': return branch.name;
            case 'organization_name': return branch.organizations?.name || 'N/A';
            case 'phone': return branch.phone || 'N/A';
            case 'is_active': return <Badge variant={branch.is_active ? 'success' : 'secondary'}>{branch.is_active ? 'ACTIVE' : 'INACTIVE'}</Badge>;
            case 'updated_at': return branch.updated_at ? new Date(branch.updated_at).toLocaleString('en-GB', { hour12: false }).replace(',', '') : 'N/A';
            case 'updated_by_name': return branch.updated_by?.full_name || 'N/A';
            case 'address': return branch.address || 'N/A';
            case 'manager_name': return branch.manager_id?.full_name || 'N/A';
            case 'created_at': return new Date(branch.created_at).toLocaleString('en-GB', { hour12: false }).replace(',', '');
            case 'created_by_name': return branch.created_by?.full_name || 'N/A';
            case 'notes': return branch.notes || 'N/A';
            default: return null;
        }
    };
    
    return (
        <div className="bg-white dark:bg-gray-950 rounded-lg shadow-sm overflow-hidden h-full flex flex-col">
            <div className="p-4 border-b border-gray-200 dark:border-gray-800">
                <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                        <Input
                            placeholder="Tìm theo mã hoặc tên chi nhánh..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-64"
                        />
                         <Select
                            value={organizationFilter}
                            onChange={(e) => setOrganizationFilter(e.target.value)}
                            className="w-48"
                        >
                            <option value="all">Tất cả tổ chức</option>
                            {organizations.map(org => (
                                <option key={org.id} value={org.id}>{org.name}</option>
                            ))}
                        </Select>
                        <Select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                             className="w-40"
                        >
                            <option value="all">Tất cả trạng thái</option>
                            <option value="true">Active</option>
                            <option value="false">Inactive</option>
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
                           <Icons.Plus className="mr-2 h-4 w-4" /> Thêm mới
                        </Button>
                    </div>
                </div>
            </div>

            <div className="flex-grow overflow-hidden">
                 {error && <div className="text-red-500 p-4 bg-red-100 rounded-md m-4">Error: {error}</div>}
                <div className="h-full overflow-auto">
                    <Table>
                        <TableHeader className="z-10">
                            <TableRow>
                                {columnConfig.map(col => columnVisibility[col.id] && (
                                    <TableHead 
                                        key={col.id}
                                        className={
                                            (col.id === 'code' ? 'sticky left-0 z-20 bg-slate-50 dark:bg-gray-950' : '') +
                                            (col.id === 'actions' ? 'sticky right-0 z-20 bg-slate-50 dark:bg-gray-950 text-right pr-6' : '')
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
                                    <TableRow key={`skeleton-${i}`} className="bg-white dark:bg-gray-950">
                                        {columnConfig.map(col => columnVisibility[col.id] && (
                                            <TableCell 
                                                key={`cell-skeleton-${col.id}`}
                                                className={ (col.id === 'code' ? 'sticky left-0 bg-inherit z-10' : '') + (col.id === 'actions' ? 'sticky right-0 bg-inherit z-10' : '')}
                                            >
                                                <Skeleton className="h-5 w-full" />
                                            </TableCell>
                                        ))}
                                    </TableRow>
                                ))
                            ) : branches.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={Object.values(columnVisibility).filter(Boolean).length}>
                                        <div className="flex flex-col items-center justify-center text-center p-8 space-y-4">
                                            <Icons.Building className="h-16 w-16 text-gray-400" />
                                            <h3 className="text-xl font-semibold">No Branches Found</h3>
                                            <p className="text-gray-500">Try adjusting your filters or create a new branch.</p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                branches.map((branch) => (
                                    <TableRow key={branch.id}>
                                        {columnConfig.map(col => columnVisibility[col.id] && (
                                            <TableCell
                                                key={col.id}
                                                className={ (col.id === 'code' ? 'sticky left-0 bg-inherit z-10' : '') + (col.id === 'actions' ? 'sticky right-0 bg-inherit z-10' : '') }
                                            >
                                                {col.id === 'actions' ? (
                                                     <div className="flex items-center justify-end">
                                                        <Button variant="ghost" size="icon" aria-label="Edit" className="text-slate-500 hover:text-indigo-600"><Icons.Pencil className="h-4 w-4" /></Button>
                                                        <Button variant="ghost" size="icon" aria-label="Delete" className="text-slate-500 hover:text-red-600"><Icons.Trash2 className="h-4 w-4" /></Button>
                                                    </div>
                                                ) : renderCellContent(branch, col.id) }
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

export default BranchesList;