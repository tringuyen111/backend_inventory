import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../../../lib/supabaseClient';
import { Database } from '../../../types/supabase';
import { Input } from '../../../components/ui/Input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/Select';
import { Button } from '../../../components/ui/Button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../components/ui/Table';
import { Skeleton } from '../../../components/ui/Skeleton';
import * as Icons from '../../../components/icons';
import { useDebounce } from '../../../hooks/useDebounce';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuCheckboxItem, DropdownMenuLabel, DropdownMenuSeparator } from '../../../components/ui/DropdownMenu';
import { Badge } from '../../../components/ui/Badge';

type OrganizationForFilter = Database['public']['Tables']['organizations']['Row'];
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
    const [isUpdating, setIsUpdating] = useState<number | null>(null);
    
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
        const fetchOrganizationsForFilter = async () => {
            const { data, error } = await supabase
                .from('organizations')
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
            
            let query = supabase
                .from('branches')
                .select('*, organizations(name), created_by(full_name), updated_by(full_name), manager_id(full_name)', { count: 'exact' });

            if (debouncedSearchTerm) {
                query = query.or(`name.ilike.%${debouncedSearchTerm}%,code.ilike.%${debouncedSearchTerm}%`);
            }
            if (statusFilter !== 'all') {
                query = query.eq('is_active', statusFilter === 'active');
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
    
    const handleToggleStatus = async (branchId: number, currentStatus: boolean) => {
        setIsUpdating(branchId);
        const { error: updateError } = await supabase
            .from('branches')
            .update({ is_active: !currentStatus })
            .eq('id', branchId);

        if (updateError) {
            setError(`Failed to update status: ${updateError.message}`);
        } else {
            await fetchBranches();
        }
        setIsUpdating(null);
    };

    const handleExport = () => {
        const headers = columnConfig
            .filter(col => col.id !== 'actions' && columnVisibility[col.id])
            .map(col => `"${col.label}"`);

        const rows = branches.map(branch => {
            return columnConfig
                .filter(col => col.id !== 'actions' && columnVisibility[col.id])
                .map(col => {
                    let value: any;
                    switch (col.id) {
                        case 'code': value = branch.code; break;
                        case 'name': value = branch.name; break;
                        case 'organization_name': value = branch.organizations?.name; break;
                        case 'phone': value = branch.phone; break;
                        case 'is_active': value = branch.is_active ? 'Active' : 'Inactive'; break;
                        case 'updated_at': value = branch.updated_at ? new Date(branch.updated_at).toLocaleString('en-GB', { hour12: false }).replace(',', '') : ''; break;
                        case 'updated_by_name': value = branch.updated_by?.full_name; break;
                        case 'address': value = branch.address; break;
                        case 'manager_name': value = branch.manager_id?.full_name; break;
                        case 'created_at': value = new Date(branch.created_at).toLocaleString('en-GB', { hour12: false }).replace(',', ''); break;
                        case 'created_by_name': value = branch.created_by?.full_name; break;
                        case 'notes': value = branch.notes; break;
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
        link.setAttribute("download", "branches_export.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const columnConfig = useMemo(() => [
        { id: 'code', label: 'Branch Code', widthClass: 'w-48' },
        { id: 'name', label: 'Branch Name', widthClass: 'w-64' },
        { id: 'organization_name', label: 'Organization', widthClass: 'w-64' },
        { id: 'phone', label: 'Phone', widthClass: 'w-40' },
        { id: 'is_active', label: 'Status', widthClass: 'w-32' },
        { id: 'updated_at', label: 'Updated At', widthClass: 'w-48' },
        { id: 'updated_by_name', label: 'Updated By', widthClass: 'w-48' },
        { id: 'address', label: 'Address', widthClass: 'w-80' },
        { id: 'manager_name', label: 'Manager', widthClass: 'w-48' },
        { id: 'created_at', label: 'Created At', widthClass: 'w-48' },
        { id: 'created_by_name', label: 'Created By', widthClass: 'w-48' },
        { id: 'notes', label: 'Notes', widthClass: 'w-64' },
        { id: 'actions', label: 'Actions', widthClass: 'w-28' },
    ], []);
    
    const renderCellContent = (branch: BranchWithDetails, columnId: string) => {
        switch (columnId) {
            case 'code': return <span className="font-medium">{branch.code}</span>;
            case 'name': return branch.name;
            case 'organization_name': return branch.organizations?.name || 'N/A';
            case 'phone': return branch.phone || 'N/A';
            case 'is_active': return <Badge variant={branch.is_active ? 'success' : 'destructive'}>{branch.is_active ? 'Active' : 'Inactive'}</Badge>;
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
        <div className="bg-card rounded-lg shadow-sm overflow-hidden h-full flex flex-col">
            <div className="p-4 border-b">
                <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                        <Input
                            placeholder="Search by code or name..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-64"
                        />
                         <Select value={organizationFilter} onValueChange={setOrganizationFilter}>
                            <SelectTrigger className="w-48">
                                <SelectValue placeholder="Filter by organization" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Organizations</SelectItem>
                                {organizations.map(org => (
                                    <SelectItem key={org.id} value={org.id.toString()}>{org.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger className="w-40">
                                <SelectValue placeholder="Filter by status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Statuses</SelectItem>
                                <SelectItem value="active">Active</SelectItem>
                                <SelectItem value="inactive">Inactive</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="flex items-center gap-2">
                         <Button onClick={handleExport} disabled={loading || branches.length === 0} variant="outline">
                            <Icons.FileDown className="mr-2 h-4 w-4" /> Export
                        </Button>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline">
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
                           <Icons.Plus className="mr-2 h-4 w-4" /> Create New
                        </Button>
                    </div>
                </div>
            </div>

            <div className="flex-grow overflow-hidden min-w-0">
                 {error && <div className="text-red-500 p-4 bg-red-100 rounded-md m-4">Error: {error}</div>}
                <div className="h-full overflow-auto">
                    <Table>
                        <TableHeader className="z-10 bg-card">
                            <TableRow>
                                {columnConfig.map(col => columnVisibility[col.id] && (
                                    <TableHead 
                                        key={col.id}
                                        className={
                                          (col.id === 'code' ? 'sticky left-0 z-20 bg-card' : '') +
                                          (col.id === 'name' ? 'sticky left-[12rem] z-20 bg-card' : '') +
                                          (col.id === 'actions' ? 'sticky right-0 z-20 bg-card text-right pr-6 ' : '') +
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
                                                    (col.id === 'code' ? 'sticky left-0 z-10 bg-card group-hover:bg-muted/50' : '') +
                                                    (col.id === 'name' ? 'sticky left-[12rem] z-10 bg-card group-hover:bg-muted/50' : '') +
                                                    (col.id === 'actions' ? 'sticky right-0 z-10 bg-card group-hover:bg-muted/50' : '')
                                                }
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
                                            <Icons.Building className="h-16 w-16 text-muted-foreground" />
                                            <h3 className="text-xl font-semibold">No Branches Found</h3>
                                            <p className="text-muted-foreground">Try adjusting your filters or create a new branch.</p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                branches.map((branch) => (
                                    <TableRow key={branch.id} className="group">
                                        {columnConfig.map(col => columnVisibility[col.id] && (
                                            <TableCell
                                                key={col.id}
                                                className={
                                                    (col.id === 'code' ? 'sticky left-0 z-10 bg-card group-hover:bg-muted/50' : '') +
                                                    (col.id === 'name' ? 'sticky left-[12rem] z-10 bg-card group-hover:bg-muted/50' : '') +
                                                    (col.id === 'actions' ? 'sticky right-0 z-10 bg-card group-hover:bg-muted/50' : '')
                                                }
                                            >
                                                {col.id === 'actions' ? (
                                                     <div className="flex items-center justify-end">
                                                        <Button variant="ghost" size="icon" aria-label="Edit" className="text-slate-500 hover:text-indigo-600"><Icons.Pencil className="h-4 w-4" /></Button>
                                                        <Button 
                                                            variant="ghost" 
                                                            size="icon" 
                                                            aria-label={branch.is_active ? 'Lock' : 'Unlock'} 
                                                            className={`text-slate-500 ${branch.is_active ? 'hover:text-red-600' : 'hover:text-emerald-600'}`}
                                                            onClick={() => handleToggleStatus(branch.id, branch.is_active)}
                                                            disabled={isUpdating === branch.id}
                                                        >
                                                            {isUpdating === branch.id ? 
                                                                <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" /> :
                                                                (branch.is_active ? <Icons.Lock className="h-4 w-4" /> : <Icons.Unlock className="h-4 w-4" />)
                                                            }
                                                        </Button>
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
            <div className="flex-shrink-0 flex items-center justify-between p-4 border-t bg-card relative z-30">
                <div className="text-sm text-muted-foreground">
                    Total: <span className="font-semibold text-foreground">{totalRows}</span>
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
                        value={pagination.pageSize.toString()}
                        onValueChange={value => setPagination(p => ({ ...p, pageSize: Number(value), pageIndex: 0 }))}
                    >
                        <SelectTrigger className="h-9 w-[120px]">
                            <SelectValue placeholder="Page size" />
                        </SelectTrigger>
                        <SelectContent>
                            {[10, 20, 30, 50].map(size => <SelectItem key={size} value={size.toString()}>{size} / page</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
             </div>
        </div>
    );
};

export default BranchesList;