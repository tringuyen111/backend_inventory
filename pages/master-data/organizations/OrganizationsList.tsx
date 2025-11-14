import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../../lib/supabaseClient';
import { Database } from '../../../types/supabase';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { Button } from '../../../components/ui/Button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../components/ui/Table';
import { Badge } from '../../../components/ui/Badge';
import { Skeleton } from '../../../components/ui/Skeleton';
import * as Icons from '../../../components/icons';
import { useDebounce } from '../../../hooks/useDebounce';

type Organization = Database['public']['Views']['v_organizations']['Row'];

const OrganizationsList: React.FC = () => {
    const [organizations, setOrganizations] = useState<Organization[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    
    const debouncedSearchTerm = useDebounce(searchTerm, 500);

    const fetchOrganizations = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            let query = supabase.from('v_organizations').select('*');

            if (debouncedSearchTerm) {
                query = query.or(`name.ilike.%${debouncedSearchTerm}%,code.ilike.%${debouncedSearchTerm}%`);
            }

            if (statusFilter !== 'all') {
                query = query.eq('is_active', statusFilter === 'active');
            }
            
            query = query.order('created_at', { ascending: false });

            const { data, error: queryError } = await query;

            if (queryError) {
                throw queryError;
            }

            setOrganizations(data || []);
        } catch (err: any) {
            console.error('Error fetching organizations:', err);
            setError('Failed to fetch organizations. Please try again.');
        } finally {
            setLoading(false);
        }
    }, [debouncedSearchTerm, statusFilter]);

    useEffect(() => {
        fetchOrganizations();
    }, [fetchOrganizations]);
    
    const renderSkeleton = () => (
        Array.from({ length: 8 }).map((_, index) => (
            <TableRow key={`skeleton-${index}`}>
                <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                <TableCell><Skeleton className="h-5 w-40" /></TableCell>
                <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                <TableCell><Skeleton className="h-5 w-48" /></TableCell>
                <TableCell><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
                <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                <TableCell><Skeleton className="h-5 w-28" /></TableCell>
                <TableCell><Skeleton className="h-8 w-20" /></TableCell>
            </TableRow>
        ))
    );

    return (
        <div className="h-full flex flex-col space-y-4">
             {/* FiltersBar */}
            <div className="flex-shrink-0 bg-white dark:bg-gray-950 p-4 rounded-lg shadow">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
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
                    <Button>
                        Add New
                    </Button>
                </div>
            </div>

            {/* CustomTable */}
            <div className="flex-grow bg-white dark:bg-gray-950 p-4 rounded-lg shadow overflow-hidden">
                 {error && <div className="text-red-500 p-4 bg-red-100 rounded-md mb-4">Error: {error}</div>}
                <div className="h-full overflow-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Code</TableHead>
                                <TableHead>Name</TableHead>
                                <TableHead>Phone</TableHead>
                                <TableHead>Email</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Created At</TableHead>
                                <TableHead>Created By</TableHead>
                                <TableHead>Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                renderSkeleton()
                            ) : organizations.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={8} className="text-center h-24">
                                        No organizations found.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                organizations.map((org) => (
                                    <TableRow key={org.id}>
                                        <TableCell className="font-medium">{org.code}</TableCell>
                                        <TableCell>{org.name}</TableCell>
                                        <TableCell>{org.phone || 'N/A'}</TableCell>
                                        <TableCell>{org.email || 'N/A'}</TableCell>
                                        <TableCell>
                                            <Badge variant={org.is_active ? 'success' : 'secondary'}>
                                                {org.is_active ? 'ACTIVE' : 'INACTIVE'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>{new Date(org.created_at).toLocaleDateString()}</TableCell>
                                        <TableCell>{org.created_by_name || 'System'}</TableCell>
                                        <TableCell>
                                            <div className="flex items-center space-x-2">
                                                <Button variant="ghost" size="icon">
                                                    <Icons.Pencil className="h-4 w-4" />
                                                </Button>
                                                <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-600">
                                                    <Icons.Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>
        </div>
    );
};

export default OrganizationsList;
