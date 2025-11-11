import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import axiosInstance from '../services/axiosConfig';
import { getAllCategories } from '../services/categoryService';
import {
  Box,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Card,
  CardContent,
} from '@mui/material';
import { Line, Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

const fetchDashboardStats = async ({ queryKey }) => {
  const [, { period, category }] = queryKey; // _key is omitted to avoid unused variable warning
  const params = new URLSearchParams({ period, category });
  const response = await axiosInstance.get(`dashboard/?${params.toString()}`);
  return response.data;
};

const Dashboard = () => {
  const [period, setPeriod] = useState('month');
  const [category, setCategory] = useState('');
  const { t } = useTranslation();

  // Fetch dashboard statistics
  const { data, isLoading, isError } = useQuery({
    queryKey: ['dashboardStats', { period, category }],
    queryFn: fetchDashboardStats,
    refetchOnWindowFocus: false,
  });

  // Fetch all categories for the drop-down
  const { data: categoriesData } = useQuery({
    queryKey: ['categories'],
    queryFn: getAllCategories,
    refetchOnWindowFocus: false,
  });

  if (isLoading) return <Typography>Loading dashboard...</Typography>;
  if (isError) return <Typography>Error loading dashboard stats.</Typography>;

  // Prepare data for the line chart
  const lineChartData = {
    labels: data.line_chart_data.map((item) => item.period),
    datasets: [
      {
        label: 'Total Revenue',
        data: data.line_chart_data.map((item) => item.total),
        fill: false,
        borderColor: '#3f51b5',
      },
    ],
  };

  // Prepare data for the pie chart
  const pieChartData = {
    labels: data.pie_chart_data.map((item) => item.category),
    datasets: [
      {
        label: 'Expenses by Category',
        data: data.pie_chart_data.map((item) => item.total),
        backgroundColor: [
          '#FF6384',
          '#36A2EB',
          '#FFCE56',
          '#4BC0C0',
          '#9966FF',
          '#FF9F40',
        ],
      },
    ],
  };

  const lineChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
  };

  const pieChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
  };

  return (
    <Box
      sx={{
        maxWidth: 1200,
        mx: "auto",
        p: { xs: 1, sm: 2 },
        mt: { xs: '64px', sm: '72px' },
        pt: { xs: 2, sm: 3 },
        background: 'linear-gradient(135deg, #f0f4f8, #d9e2ec)',
        borderRadius: 2,
        boxShadow: 3,
        mb: 4,
      }}
    >
      <Typography
        variant="h4"
        sx={{
          mb: 3,
          fontWeight: "bold",
          color: "primary.main",
        }}
      >
        Dashboard
      </Typography>

      {/* Summary Cards */}
      <Grid container spacing={2}>
  {[
    { label: 'Published Auctions', value: data.total_published },
    { label: 'Active Auctions', value: data.active_auctions },
    { label: 'Total Revenue', value: `$${(data.total_revenue || 0).toFixed(2)}` },
    { label: 'Average Bid', value: `$${(data.average_bid || 0).toFixed(2)}` },
    { label: 'Average Sale', value: `$${(data.average_sale || 0).toFixed(2)}` },
  ].map((item, index) => (
    <Grid item xs={12} sm={6} md={4} key={index}>
      <Card
        variant="outlined"
        sx={{
          textAlign: 'center',
          backgroundColor: '#fff',
          borderRadius: 2,
          boxShadow: 2,
          transition: 'transform 0.3s',
          '&:hover': { transform: 'scale(1.02)' },
        }}
      >
        <CardContent>
          <Typography variant="subtitle2" color="textSecondary">
            {item.label}
          </Typography>
          <Typography variant="h5" sx={{ color: '#3f51b5' }}>
            {item.value}
          </Typography>
        </CardContent>
      </Card>
    </Grid>
  ))}
</Grid>

      {/* Filters */}
      <Box
        sx={{
          mt: 3,
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          alignItems: 'center',
          gap: 2,
        }}
      >
        <FormControl sx={{ minWidth: 150 }}>
          <InputLabel id="period-label">Period</InputLabel>
          <Select
            labelId="period-label"
            value={period}
            label={t("dashboardPage.filters.period")} onChange={(e) => setPeriod(e.target.value)}
          >
            <MenuItem value="week">Week</MenuItem>
            <MenuItem value="month">Month</MenuItem>
            <MenuItem value="year">Year</MenuItem>
          </Select>
        </FormControl>
        <FormControl sx={{ minWidth: 150 }}>
          <InputLabel id="category-label">Category</InputLabel>
          <Select
            labelId="category-label"
            value={category}
            label={t("dashboardPage.filters.category")} onChange={(e) => setCategory(e.target.value)}
          >
            <MenuItem value="">All</MenuItem>
            {categoriesData &&
              categoriesData.map((cat) => (
                <MenuItem key={cat.id} value={cat.name}>
                  {cat.name}
                </MenuItem>
              ))}
          </Select>
        </FormControl>
      </Box>

      {/* Charts */}
      <Grid container spacing={2} sx={{ mt: 2 }}>
        <Grid item xs={12} md={6}>
          <Card variant="outlined" sx={{ height: 300, backgroundColor: '#fff', borderRadius: 2 }}>
            <CardContent sx={{ height: '100%', p: 1 }}>
              <Typography variant="h6" gutterBottom>
                Revenue Over Time
              </Typography>
              <Box sx={{ height: 'calc(100% - 40px)' }}>
                <Line data={lineChartData} options={lineChartOptions} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={6}>
          <Card variant="outlined" sx={{ height: 300, backgroundColor: '#fff', borderRadius: 2 }}>
            <CardContent sx={{ height: '100%', p: 1 }}>
              <Typography variant="h6" gutterBottom>
                Expenses by Category
              </Typography>
              <Box sx={{ height: 'calc(100% - 40px)' }}>
                <Pie data={pieChartData} options={pieChartOptions} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;
