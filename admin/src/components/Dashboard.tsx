import { useEffect, useState } from 'react';
import { Card, CardContent, Grid, Typography, Box, Paper } from '@mui/material';
import { useDataProvider, Title } from 'react-admin';
import { PieChart, Pie, Cell, ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

// Dashboard component
const Dashboard = () => {
    const dataProvider = useDataProvider();
    const [stats, setStats] = useState({
        usersCount: 0,
        warrantiesCount: 0,
        pendingCount: 0,
        approvedCount: 0,
        rejectedCount: 0,
        manualReviewCount: 0
    });
    
    const [loading, setLoading] = useState(true);

    // Fetch dashboard data
    useEffect(() => {
        console.log('Fetching dashboard data');
        const fetchData = async () => {
            try {
                // Get users count
                const { total: usersCount } = await dataProvider.getList('users', {
                    pagination: { page: 1, perPage: 1 },
                    sort: { field: 'id', order: 'ASC' },
                    filter: {}
                });
                
                // Get warranties count
                const { data: warranties, total: warrantiesCount } = await dataProvider.getList('warranties', {
                    pagination: { page: 1, perPage: 1000 },  // Get all warranties for stats
                    sort: { field: 'id', order: 'ASC' },
                    filter: {}
                });
                
                // Calculate status counts
                const pendingCount = warranties.filter(w => w.status === 'pending').length;
                const approvedCount = warranties.filter(w => w.status === 'approved').length;
                const rejectedCount = warranties.filter(w => w.status === 'rejected').length;
                const manualReviewCount = warranties.filter(w => w.status === 'manual_review').length;
                
                console.log('Dashboard data loaded:', { 
                    usersCount, 
                    warrantiesCount,
                    pendingCount,
                    approvedCount,
                    rejectedCount,
                    manualReviewCount
                });
                
                setStats({
                    usersCount: usersCount || 0,
                    warrantiesCount: warrantiesCount || 0,
                    pendingCount,
                    approvedCount,
                    rejectedCount,
                    manualReviewCount
                });
            } catch (error) {
                console.error('Error loading dashboard data:', error);
            } finally {
                setLoading(false);
            }
        };
        
        fetchData();
    }, [dataProvider]);
    
    // Prepare status data for pie chart
    const statusData = [
        { name: 'Pending', value: stats.pendingCount, color: '#FFD700' },
        { name: 'Approved', value: stats.approvedCount, color: '#4CAF50' },
        { name: 'Rejected', value: stats.rejectedCount, color: '#F44336' },
        { name: 'Manual Review', value: stats.manualReviewCount, color: '#2196F3' },
    ];
    
    // Random data for trend chart (would be replaced with real data in a production app)
    // todo: replace with real data or remove
    const trendData = [
        { name: 'Jan', pending: 4, approved: 3, rejected: 1 },
        { name: 'Feb', pending: 7, approved: 5, rejected: 2 },
        { name: 'Mar', pending: 5, approved: 10, rejected: 3 },
        { name: 'Apr', pending: 8, approved: 12, rejected: 2 },
        { name: 'May', pending: 9, approved: 8, rejected: 4 },
        { name: 'Jun', pending: 6, approved: 15, rejected: 1 },
    ];
    
    return (
        <Box p={3}>
            <Title title="Dashboard" />
            
            <Typography variant="h4" gutterBottom>
                Warranty Management Overview
            </Typography>
            
            {loading ? (
                <Typography>Loading dashboard data...</Typography>
            ) : (
                <>
                    {/* Stats Cards */}
                    <Grid container spacing={3} sx={{ mb: 4 }}>
                        <Grid size={{xs: 12, sm: 6, md: 3}}>
                            <Card>
                                <CardContent>
                                    <Typography color="textSecondary" gutterBottom>
                                        Total Users
                                    </Typography>
                                    <Typography variant="h4" component="div">
                                        {stats.usersCount}
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                        
                        <Grid size={{xs: 12, sm: 6, md: 3}}>
                            <Card>
                                <CardContent>
                                    <Typography color="textSecondary" gutterBottom>
                                        Total Warranties
                                    </Typography>
                                    <Typography variant="h4" component="div">
                                        {stats.warrantiesCount}
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                        
                        <Grid size={{xs: 12, sm: 6, md: 3}}>
                            <Card>
                                <CardContent>
                                    <Typography color="textSecondary" gutterBottom>
                                        Pending Warranties
                                    </Typography>
                                    <Typography variant="h4" component="div" style={{ color: '#FFD700' }}>
                                        {stats.pendingCount}
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                        
                        <Grid size={{xs: 12, sm: 6, md: 3}}>
                            <Card>
                                <CardContent>
                                    <Typography color="textSecondary" gutterBottom>
                                        Approved Warranties
                                    </Typography>
                                    <Typography variant="h4" component="div" style={{ color: '#4CAF50' }}>
                                        {stats.approvedCount}
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                    </Grid>
                    
                    {/* Charts */}
                    <Grid container spacing={3}>
                        <Grid size={{xs: 12, md: 6}}>
                            <Paper sx={{ p: 2 }}>
                                <Typography variant="h6" gutterBottom>
                                    Warranty Status Distribution
                                </Typography>
                                <ResponsiveContainer width="100%" height={300}>
                                    <PieChart>
                                        <Pie
                                            data={statusData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={60}
                                            outerRadius={100}
                                            fill="#8884d8"
                                            paddingAngle={2}
                                            dataKey="value"
                                            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                        >
                                            {statusData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))}
                                        </Pie>
                                        <Tooltip />
                                    </PieChart>
                                </ResponsiveContainer>
                            </Paper>
                        </Grid>
                        
                        <Grid size={{xs: 12, md: 6}}>
                            <Paper sx={{ p: 2 }}>
                                <Typography variant="h6" gutterBottom>
                                    Warranty Trends
                                </Typography>
                                <ResponsiveContainer width="100%" height={300}>
                                    <LineChart
                                        data={trendData}
                                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                                    >
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="name" />
                                        <YAxis />
                                        <Tooltip />
                                        <Legend />
                                        <Line type="monotone" dataKey="pending" stroke="#FFD700" activeDot={{ r: 8 }} />
                                        <Line type="monotone" dataKey="approved" stroke="#4CAF50" />
                                        <Line type="monotone" dataKey="rejected" stroke="#F44336" />
                                    </LineChart>
                                </ResponsiveContainer>
                            </Paper>
                        </Grid>
                    </Grid>
                </>
            )}
        </Box>
    );
};

export default Dashboard; 