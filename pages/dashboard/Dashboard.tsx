import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/Table';
import { Badge } from '../../components/ui/Badge';
import { Skeleton } from '../../components/ui/Skeleton';
import { supabase } from '../../lib/supabaseClient';
import { Select } from '../../components/ui/Select';
import { Label } from '../../components/ui/Label';
import * as Icons from '../../components/icons';

// Define types for our data to ensure type safety
interface Kpi {
    title: string;
    value: string;
    icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
}

interface Warehouse {
    id: string; // warehouse code
    name: string;
    status: string;
}

interface LowStockProduct {
    sku: string;
    product: string;
    on_hand: number;
    min_level: number;
}

interface AccessibleWarehouse {
    id: number; // actual ID
    code: string;
    name: string;
}

const Dashboard: React.FC = () => {
    const [loading, setLoading] = useState(true);
    const [kpis, setKpis] = useState<Kpi[]>([]);
    const [warehouseStatus, setWarehouseStatus] = useState<Warehouse[]>([]);
    const [lowStockProducts, setLowStockProducts] = useState<LowStockProduct[]>([]);
    const [error, setError] = useState<string | null>(null);

    // State for warehouse selection logic
    const [accessibleWarehouses, setAccessibleWarehouses] = useState<AccessibleWarehouse[]>([]);
    const [selectedWarehouseId, setSelectedWarehouseId] = useState<number | null>(null);
    const [hasNoWarehouseAccess, setHasNoWarehouseAccess] = useState(false);

    // Effect 1: Check for warehouse access on initial mount
    useEffect(() => {
        const checkWarehouseAccess = async () => {
            setLoading(true);
            setError(null);
            setHasNoWarehouseAccess(false);

            const { data, error: whError } = await supabase
                .from('warehouses')
                .select('id, code, name')
                .order('code');

            if (whError) {
                console.error("Failed to fetch accessible warehouses:", whError);
                setError("Could not verify warehouse access. Please try again.");
                setLoading(false);
                return;
            }

            if (!data || data.length === 0) {
                setHasNoWarehouseAccess(true);
                setLoading(false);
            } else {
                setAccessibleWarehouses(data);
                // Set the first warehouse as selected, which will trigger the data fetch effect
                setSelectedWarehouseId(data[0].id); 
            }
        };
        checkWarehouseAccess();
    }, []);

    // Effect 2: Fetch dashboard data when a warehouse is selected
    useEffect(() => {
        const fetchDashboardData = async () => {
            if (!selectedWarehouseId) return;

            setLoading(true);
            setError(null);
            try {
                // Fetch all data for the selected warehouse
                const [kpisRes, warehousesRes, productsRes, stockRes] = await Promise.all([
                    supabase.rpc('get_dashboard_kpis', { p_warehouse_id: selectedWarehouseId }).single(),
                    supabase.from('warehouses').select('code, name, is_active').order('code'),
                    supabase.from('products').select('id, code, name, min_stock_level').gt('min_stock_level', 0),
                    supabase.from('stock_summary').select('product_id, quantity_available')
                ]);

                if (kpisRes.error) throw new Error(`KPIs Error: ${kpisRes.error.message}`);
                if (warehousesRes.error) throw new Error(`Warehouses Error: ${warehousesRes.error.message}`);
                if (productsRes.error) throw new Error(`Products Error: ${productsRes.error.message}`);
                if (stockRes.error) throw new Error(`Stock Error: ${stockRes.error.message}`);
                
                // Process and set KPI data
                if (kpisRes.data) {
                    const kpiData = kpisRes.data;
                    setKpis([
                        { title: "Total SKUs", value: kpiData.total_skus.toLocaleString(), icon: Icons.Package },
                        { title: "Total On-Hand", value: kpiData.total_on_hand.toLocaleString(), icon: Icons.Boxes },
                        { title: "Total Reserved", value: kpiData.total_reserved.toLocaleString(), icon: Icons.PackageSearch },
                        { title: "Total Available", value: kpiData.total_available.toLocaleString(), icon: Icons.PackagePlus },
                        { title: "Low Stock Items", value: kpiData.low_stock_items.toLocaleString(), icon: Icons.PackageMinus },
                        { title: "Expiring Soon", value: kpiData.expiring_soon.toLocaleString(), icon: Icons.Truck },
                    ]);
                }

                setWarehouseStatus(warehousesRes.data?.map(w => ({
                    id: w.code,
                    name: w.name,
                    status: w.is_active ? 'Active' : 'Inactive'
                })) || []);
                
                if (productsRes.data && stockRes.data) {
                    const stockMap = new Map(stockRes.data.map(s => [s.product_id, s.quantity_available]));
                    const lowStock = productsRes.data
                        .filter(p => (stockMap.get(p.id) || 0) < p.min_stock_level)
                        .map(p => ({
                            sku: p.code,
                            product: p.name,
                            on_hand: stockMap.get(p.id) || 0,
                            min_level: p.min_stock_level
                        }));
                    setLowStockProducts(lowStock);
                }

            } catch (err: any) {
                console.error("Failed to fetch dashboard data:", err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, [selectedWarehouseId]);

    if (hasNoWarehouseAccess) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-center bg-white dark:bg-gray-950 rounded-lg shadow p-8">
                <Icons.Warehouse className="h-20 w-20 text-red-500 mb-4" />
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white">No Warehouse Access</h2>
                <p className="text-gray-500 dark:text-gray-400 mt-2 max-w-lg">
                    Your account has not been assigned to any warehouse, so the dashboard cannot display data.
                    Please contact your system administrator to request access.
                </p>
            </div>
        );
    }
    
    if (error) {
      return <div className="text-red-500 p-4 bg-red-100 rounded-md">Error loading dashboard: {error}</div>
    }

    const renderSkeletons = () => (
        <>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
                {Array.from({ length: 6 }).map((_, index) => (
                    <Card key={index}><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><Skeleton className="h-4 w-2/3" /></CardHeader><CardContent><Skeleton className="h-8 w-1/2" /></CardContent></Card>
                ))}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card><CardHeader><CardTitle>Warehouse Status</CardTitle></CardHeader><CardContent><div className="space-y-2"><Skeleton className="h-8 w-full" /><Skeleton className="h-8 w-full" /><Skeleton className="h-8 w-full" /></div></CardContent></Card>
                <Card><CardHeader><CardTitle>Low Stock Products</CardTitle></CardHeader><CardContent><div className="space-y-2"><Skeleton className="h-8 w-full" /><Skeleton className="h-8 w-full" /><Skeleton className="h-8 w-full" /></div></CardContent></Card>
            </div>
        </>
    );

    return (
        <div className="space-y-6">
            {accessibleWarehouses.length > 0 && (
                <div className="flex justify-between items-center bg-white dark:bg-gray-950 p-4 rounded-lg shadow -mb-2">
                    <h2 className="text-lg font-semibold">Dashboard Overview</h2>
                    <div className="flex items-center space-x-2">
                        <Label htmlFor="warehouse-select" className="text-sm font-medium">Viewing Warehouse:</Label>
                        <Select
                            id="warehouse-select"
                            value={selectedWarehouseId ?? ''}
                            onChange={(e) => setSelectedWarehouseId(Number(e.target.value))}
                            className="w-auto min-w-[200px]"
                            disabled={accessibleWarehouses.length <= 1}
                        >
                            {accessibleWarehouses.map(wh => (
                                <option key={wh.id} value={wh.id}>
                                    {wh.name} ({wh.code})
                                </option>
                            ))}
                        </Select>
                    </div>
                </div>
            )}
            
            {loading ? renderSkeletons() : (
                <>
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
                        {kpis.map((kpi) => (
                             <Card key={kpi.title}>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">{kpi.title}</CardTitle>
                                    <kpi.icon className="h-4 w-4 text-muted-foreground text-indigo-600" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">{kpi.value}</div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <Card><CardHeader><CardTitle>Warehouse Status</CardTitle></CardHeader><CardContent><Table><TableHeader><TableRow><TableHead>Code</TableHead><TableHead>Name</TableHead><TableHead>Status</TableHead></TableRow></TableHeader><TableBody>{warehouseStatus.map((wh) => (<TableRow key={wh.id}><TableCell className="font-medium">{wh.id}</TableCell><TableCell>{wh.name}</TableCell><TableCell><Badge variant={wh.status === 'Active' ? 'success' : 'destructive'}>{wh.status}</Badge></TableCell></TableRow>))}</TableBody></Table></CardContent></Card>
                        <Card><CardHeader><CardTitle>Low Stock Products</CardTitle></CardHeader><CardContent><Table><TableHeader><TableRow><TableHead>Product</TableHead><TableHead>On Hand</TableHead><TableHead>Alert</TableHead></TableRow></TableHeader><TableBody>{lowStockProducts.length > 0 ? lowStockProducts.map((p) => (<TableRow key={p.sku}><TableCell><div className="font-medium">{p.product}</div><div className="text-xs text-gray-500">{p.sku}</div></TableCell><TableCell>{p.on_hand} / {p.min_level}</TableCell><TableCell><Badge variant='destructive'>Restock Required</Badge></TableCell></TableRow>)) : <TableRow><TableCell colSpan={3} className="text-center text-gray-500">No low stock items.</TableCell></TableRow>}</TableBody></Table></CardContent></Card>
                    </div>
                </>
            )}
        </div>
    );
};

export default Dashboard;