import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import {
    Area,
    AreaChart,
    Bar,
    BarChart,
    CartesianGrid,
    Cell,
    Legend,
    Pie,
    PieChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';

// Colors for pie chart
const COLORS = ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444'];

export function StatsGrid() {
    const [responseTimeData, setResponseTimeData] = useState([]);
    const [statusData, setStatusData] = useState([]);
    const [requestsData, setRequestsData] = useState([]);

    // Fetch routes data
    const { data: routes, isPending } = useQuery({
        queryKey: ["routes"],
        queryFn: async () => {
            const response = await fetch("/api/routes");
            if (!response.ok) {
                throw new Error("Failed to fetch routes");
            }
            return response.json();
        },
    });

    // Process the route data when it changes
    useEffect(() => {
        if (!routes || routes.length === 0) return;

        // Process response time data - last 7 days
        const rtData = processResponseTimeData(routes);
        setResponseTimeData(rtData);

        // Process status code distribution
        const statData = processStatusData(routes);
        setStatusData(statData);

        // Process requests data - last 7 days
        const reqData = processRequestsData(routes);
        setRequestsData(reqData);
    }, [routes]);

    // Process response time data
    const processResponseTimeData = (routesData) => {
        // Create an object to store daily averages
        const dailyData = {};

        // Get the last 7 days
        const dateLabels = getLast7Days();

        // Initialize the daily data object with zeros
        dateLabels.forEach(dateStr => {
            dailyData[dateStr] = { total: 0, count: 0 };
        });

        // Aggregate all response times
        routesData.forEach(route => {
            if (route.RequestLog && route.RequestLog.length > 0) {
                route.RequestLog.forEach(log => {
                    const logDate = new Date(log.createdAt);
                    const dateStr = logDate.toISOString().split('T')[0];

                    // Check if the date is within our range
                    if (dailyData[dateStr]) {
                        dailyData[dateStr].total += log.responseTime || 0;
                        dailyData[dateStr].count += 1;
                    }
                });
            }
        });

        // Convert to array format for the chart
        return dateLabels.map(date => {
            const shortDate = new Date(date).toLocaleDateString('en-US', { weekday: 'short' });
            const avg = dailyData[date].count > 0
                ? Math.round(dailyData[date].total / dailyData[date].count)
                : 0;

            return {
                name: shortDate,
                value: avg
            };
        });
    };

    // Process status code data
    const processStatusData = (routesData) => {
        const statusCounts = {
            '2xx': 0,
            '3xx': 0,
            '4xx': 0,
            '5xx': 0
        };

        routesData.forEach(route => {
            if (route.RequestLog && route.RequestLog.length > 0) {
                route.RequestLog.forEach(log => {
                    const statusCode = log.statusCode || 0;
                    if (statusCode >= 200 && statusCode < 300) {
                        statusCounts['2xx']++;
                    } else if (statusCode >= 300 && statusCode < 400) {
                        statusCounts['3xx']++;
                    } else if (statusCode >= 400 && statusCode < 500) {
                        statusCounts['4xx']++;
                    } else if (statusCode >= 500) {
                        statusCounts['5xx']++;
                    }
                });
            }
        });

        return Object.entries(statusCounts).map(([name, value]) => ({
            name,
            value
        }));
    };

    // Process requests data
    const processRequestsData = (routesData) => {
        const dailyRequests = {};

        // Get the last 7 days
        const dateLabels = getLast7Days();

        // Initialize the daily data
        dateLabels.forEach(dateStr => {
            dailyRequests[dateStr] = 0;
        });

        // Count requests by day
        routesData.forEach(route => {
            if (route.RequestLog && route.RequestLog.length > 0) {
                route.RequestLog.forEach(log => {
                    const logDate = new Date(log.createdAt);
                    const dateStr = logDate.toISOString().split('T')[0];

                    // Check if the date is within our range
                    if (dailyRequests[dateStr] !== undefined) {
                        dailyRequests[dateStr]++;
                    }
                });
            }
        });

        // Convert to array format for the chart
        return dateLabels.map(date => {
            const shortDate = new Date(date).toLocaleDateString('en-US', { weekday: 'short' });
            return {
                name: shortDate,
                value: dailyRequests[date]
            };
        });
    };

    // Helper to get the last 7 days as strings
    const getLast7Days = () => {
        const dates = [];
        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            dates.push(date.toISOString().split('T')[0]);
        }
        return dates;
    };

    // Show loading state or empty state
    if (isPending) {
        return (
            <div className="flex flex-col gap-3">
                <Card className="transition-all duration-200 hover:shadow-md">
                    <CardHeader>
                        <CardTitle>Loading stats...</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[300px] flex items-center justify-center">
                            <div className="w-12 h-12 border-4 border-t-primary border-r-transparent border-b-primary border-l-transparent rounded-full animate-spin"></div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (!routes || routes.length === 0) {
        return (
            <div className="flex flex-col gap-3">
                <Card className="transition-all duration-200 hover:shadow-md">
                    <CardHeader>
                        <CardTitle>No data available</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[300px] flex items-center justify-center">
                            <p className="text-muted-foreground">Create routes to see analytics</p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-3">
            {/* Response Time Chart */}
            <Card className="transition-all duration-200 hover:shadow-md lg:col-span-2">
                <CardHeader>
                    <CardTitle>Response Time (ms)</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart
                                data={responseTimeData}
                                margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                            >
                                <defs>
                                    <linearGradient id="responseTimeGradient" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.8} />
                                        <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0.1} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                                <XAxis
                                    dataKey="name"
                                    tick={{ fontSize: 12 }}
                                    tickLine={false}
                                    axisLine={{ opacity: 0.3 }}
                                />
                                <YAxis
                                    tick={{ fontSize: 12 }}
                                    tickLine={false}
                                    axisLine={{ opacity: 0.3 }}
                                />
                                <Tooltip
                                    contentStyle={{
                                        borderRadius: '8px',
                                        boxShadow: '0 2px 10px rgba(0, 0, 0, 0.12)',
                                        border: 'none',
                                        backgroundColor: 'hsl(var(--background))',
                                        color: 'hsl(var(--foreground))'
                                    }}
                                    formatter={(value) => [`${value} ms`, 'Avg. Response Time']}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="value"
                                    stroke="hsl(var(--chart-1))"
                                    fillOpacity={1}
                                    fill="url(#responseTimeGradient)"
                                    strokeWidth={2}
                                    activeDot={{ r: 6 }}
                                    animationDuration={1500}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </CardContent>
            </Card>

            {/* Status Breakdown Pie Chart */}
            <Card className="transition-all duration-200 hover:shadow-md">
                <CardHeader>
                    <CardTitle>Status Breakdown</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={statusData}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    outerRadius={80}
                                    innerRadius={40}
                                    paddingAngle={5}
                                    dataKey="value"
                                    animationDuration={1500}
                                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                >
                                    {statusData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Legend
                                    layout="horizontal"
                                    verticalAlign="bottom"
                                    align="center"
                                    wrapperStyle={{ fontSize: 12, paddingTop: 20 }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </CardContent>
            </Card>

            {/* Requests Bar Chart */}
            <Card className="transition-all duration-200 hover:shadow-md col-span-1 lg:col-span-3">
                <CardHeader>
                    <CardTitle>Total Requests This Week</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                                data={requestsData}
                                margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                            >
                                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                                <XAxis
                                    dataKey="name"
                                    tick={{ fontSize: 12 }}
                                    tickLine={false}
                                    axisLine={{ opacity: 0.3 }}
                                />
                                <YAxis
                                    tick={{ fontSize: 12 }}
                                    tickLine={false}
                                    axisLine={{ opacity: 0.3 }}
                                />
                                <Tooltip
                                    contentStyle={{
                                        borderRadius: '8px',
                                        boxShadow: '0 2px 10px rgba(0, 0, 0, 0.12)',
                                        border: 'none',
                                        backgroundColor: 'hsl(var(--background))',
                                        color: 'hsl(var(--foreground))'
                                    }}
                                    formatter={(value) => [`${value} requests`, 'Total Requests']}
                                />
                                <Bar
                                    dataKey="value"
                                    fill="hsl(var(--chart-2))"
                                    radius={[4, 4, 0, 0]}
                                    animationDuration={1500}
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}