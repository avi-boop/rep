// pages/Dashboard.jsx
// Main Dashboard Overview Page

import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Box,
  Button,
  CircularProgress,
  Alert
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import {
  LineChart,
  Line,
  PieChart,
  Pie,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell
} from 'recharts';

import MetricCard from '../components/MetricCard';
import RepairOrderCard from '../components/RepairOrderCard';
import { dashboardAPI, repairOrderAPI } from '../services/api';

const STATUS_COLORS = {
  pending: '#2563eb',
  in_progress: '#f59e0b',
  awaiting_parts: '#7c3aed',
  completed: '#10b981',
  ready_for_pickup: '#06b6d4'
};

const Dashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState({
    metrics: {
      today: { repairs: 0, revenue: 0, pending: 0, completed: 0 },
      thisWeek: { repairs: 0, revenue: 0 },
      thisMonth: { repairs: 0, revenue: 0 }
    },
    statusBreakdown: [],
    revenueChart: [],
    popularRepairs: [],
    deviceBreakdown: [],
    recentOrders: []
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [metricsRes, recentOrdersRes] = await Promise.all([
        dashboardAPI.getMetrics(),
        repairOrderAPI.getAll({ limit: 10, sort: 'createdAt', order: 'DESC' })
      ]);

      // Transform status breakdown for pie chart
      const statusBreakdown = Object.entries(metricsRes.data.statusBreakdown || {})
        .map(([status, count]) => ({
          name: status.replace('_', ' ').toUpperCase(),
          value: count,
          color: STATUS_COLORS[status] || '#6b7280'
        }));

      setData({
        metrics: metricsRes.data,
        statusBreakdown,
        revenueChart: metricsRes.data.revenueChart || [],
        popularRepairs: metricsRes.data.popularRepairs || [],
        deviceBreakdown: metricsRes.data.deviceBreakdown || [],
        recentOrders: recentOrdersRes.data || []
      });
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Failed to load dashboard data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleViewOrder = (orderId) => {
    navigate(`/repairs/${orderId}`);
  };

  const handleEditOrder = (orderId) => {
    navigate(`/repairs/${orderId}/edit`);
  };

  const handleNotifyCustomer = async (orderId) => {
    try {
      await repairOrderAPI.sendNotification(orderId);
      alert('Notification sent successfully!');
    } catch (err) {
      console.error('Error sending notification:', err);
      alert('Failed to send notification');
    }
  };

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      await repairOrderAPI.updateStatus(orderId, newStatus);
      fetchDashboardData(); // Refresh data
    } catch (err) {
      console.error('Error updating status:', err);
      alert('Failed to update status');
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Alert severity="error" action={
          <Button color="inherit" size="small" onClick={fetchDashboardData}>
            Retry
          </Button>
        }>
          {error}
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Typography variant="h4" component="h1" fontWeight="bold">
          📊 Dashboard
        </Typography>
        <Box>
          <Button
            variant="outlined"
            startIcon={<SearchIcon />}
            sx={{ mr: 2 }}
            onClick={() => navigate('/pricing/lookup')}
          >
            Quick Price Lookup
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => navigate('/repairs/new')}
          >
            New Repair Order
          </Button>
        </Box>
      </Box>

      {/* Metrics Cards */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Today's Repairs"
            value={data.metrics.today.repairs}
            icon="📱"
            color="#2563eb"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Pending Repairs"
            value={data.metrics.today.pending}
            icon="⏳"
            color="#f59e0b"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Revenue Today"
            value={`$${data.metrics.today.revenue.toLocaleString()}`}
            icon="💰"
            color="#10b981"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Revenue This Month"
            value={`$${data.metrics.thisMonth.revenue.toLocaleString()}`}
            icon="📈"
            color="#7c3aed"
          />
        </Grid>
      </Grid>

      {/* Charts Row */}
      <Grid container spacing={3} mb={4}>
        {/* Status Breakdown Pie Chart */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" mb={2}>
              Repairs by Status
            </Typography>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={data.statusBreakdown}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry) => `${entry.name}: ${entry.value}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {data.statusBreakdown.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* Revenue Trend Line Chart */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6">
                Revenue Trend (Last 30 Days)
              </Typography>
              <Button
                size="small"
                startIcon={<RefreshIcon />}
                onClick={fetchDashboardData}
              >
                Refresh
              </Button>
            </Box>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={data.revenueChart}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="#2563eb" 
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
      </Grid>

      {/* Popular Repairs Bar Chart */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" mb={2}>
              🔥 Popular Repairs
            </Typography>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={data.popularRepairs}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="repairType" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="count" fill="#10b981" name="Number of Repairs" />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
      </Grid>

      {/* Recent Activity */}
      <Paper sx={{ p: 3 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h6">
            📱 Recent Activity
          </Typography>
          <Button
            size="small"
            onClick={() => navigate('/repairs')}
          >
            View All
          </Button>
        </Box>

        {data.recentOrders.length === 0 ? (
          <Alert severity="info">No recent repair orders</Alert>
        ) : (
          data.recentOrders.map((order) => (
            <RepairOrderCard
              key={order.id}
              order={order}
              onView={handleViewOrder}
              onEdit={handleEditOrder}
              onNotify={handleNotifyCustomer}
              onStatusChange={handleStatusChange}
            />
          ))
        )}
      </Paper>
    </Container>
  );
};

export default Dashboard;
