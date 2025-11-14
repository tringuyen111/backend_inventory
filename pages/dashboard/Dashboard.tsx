
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/Table';
import { Badge } from '../../components/ui/Badge';
import { Skeleton } from '../../components/ui/Skeleton';
import { supabase } from '../../lib/supabaseClient';

// Define types for our data to ensure type safety
interface Kpi {
    title: string;
    value: string;
}

interface Warehouse {
    id: string;
    name: string;
    status: string;
}

interface LowStockProduct {
    sku: string;
    product: string;
    on_hand: number;
    min_level: number;
}


const Dashboard: React.FC = () => {
    const [loading, setLoading] = useState(true);
    const [kpis, setKpis] = useState<Kpi[]>([]);
    const [warehouseStatus, setWarehouseStatus] = useState<Warehouse[]>([]);
    const [lowStockProducts, setLowStockProducts] = useState<LowStockProduct[]>([]);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            setError(null);
            try {
                // FIX: Explicitly pass p_warehouse_id: null to match the function signature.
                const [kpisRes, warehousesRes, productsRes, stockRes] = await Promise.all([
                    supabase.rpc('get_dashboard_kpis', { p_warehouse_id: null }).single(),
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
                    const formattedKpis: Kpi[] = [
                        { title: "Total SKUs", value: kpiData.total_skus.toLocaleString() },
                        { title: "Total On-Hand", value: kpiData.total_on_hand.toLocaleString() },
                        { title: "Total Reserved", value: kpiData.total_reserved.toLocaleString() },
                        { title: "Total Available", value: kpiData.total_available.toLocaleString() },
                        { title: "Low Stock Items", value: kpiData.low_stock_items.toLocaleString() },
                        { title: "Expiring Soon", value: kpiData.expiring_soon.toLocaleString() },
                    ];
                    setKpis(formattedKpis);
                }

                // Set warehouse data
                setWarehouseStatus(warehousesRes.data?.map(w => ({
                    id: w.code,
                    name: w.name,
                    status: w.is_active ? 'Active' : 'Inactive'
                })) || []);
                
                // Process and set Low Stock Products
                if (productsRes.data && stockRes.data) {
                    const stockMap = new Map<number, number>();
                    stockRes.data.forEach(stock => {
                        stockMap.set(stock.product_id, (stockMap.get(stock.product_id) || 0) + stock.quantity_available);
                    });

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

        fetchData();
    }, []);

    if (error) {
      return <div className="text-red-500 p-4 bg-red-100 rounded-md">Error loading dashboard: {error}</div>
    }


  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {loading ? (
             Array.from({ length: 6 }).map((_, index) => (
              <Card key={index}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                     <Skeleton className="h-4 w-2/3" />
                  </CardHeader>
                  <CardContent>
                     <Skeleton className="h-8 w-1/2" />
                  </CardContent>
              </Card>
             ))
        ) : (
            kpis.map((kpi) => (
              <Card key={kpi.title}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{kpi.title}</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{kpi.value}</div>
                </CardContent>
              </Card>
            ))
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Warehouse Status</CardTitle>
          </CardHeader>
          <CardContent>
             {loading ? (
                <div className="space-y-2">
                    <Skeleton className="h-8 w-full" />
                    <Skeleton className="h-8 w-full" />
                    <Skeleton className="h-8 w-full" />
                </div>
            ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {warehouseStatus.map((wh) => (
                  <TableRow key={wh.id}>
                    <TableCell className="font-medium">{wh.id}</TableCell>
                    <TableCell>{wh.name}</TableCell>
                    <TableCell>
                      <Badge variant={wh.status === 'Active' ? 'success' : 'secondary'}>{wh.status}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Low Stock Products</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
                 <div className="space-y-2">
                    <Skeleton className="h-8 w-full" />
                    <Skeleton className="h-8 w-full" />
                    <Skeleton className="h-8 w-full" />
                </div>
            ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>On Hand</TableHead>
                  <TableHead>Alert</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lowStockProducts.map((p) => (
                  <TableRow key={p.sku}>
                    <TableCell>
                        <div className="font-medium">{p.product}</div>
                        <div className="text-xs text-gray-500">{p.sku}</div>
                    </TableCell>
                    <TableCell>{p.on_hand} / {p.min_level}</TableCell>
                    <TableCell>
                      <Badge variant='destructive'>Restock Required</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
