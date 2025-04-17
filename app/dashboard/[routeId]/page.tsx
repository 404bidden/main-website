"use client";

import {
    QueryClient,
    QueryClientProvider,
    useMutation,
    useQuery,
} from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
    Area,
    AreaChart,
    CartesianGrid,
    Line,
    LineChart,
    XAxis,
    YAxis,
} from "recharts";

import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import {
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
} from "@/components/ui/chart";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { authClient } from "@/lib/auth-client";
import { Checkbox } from "@heroui/checkbox";
import { Chip } from "@heroui/chip";
import { Input } from "@heroui/input";

// Create a client
const queryClient = new QueryClient();

// Mock data for charts (in a real app, you'd fetch this from an API)
const generateMockTimeData = (days = 30) => {
    const data = [];
    const today = new Date();
    for (let i = days; i > 0; i--) {
        const date = new Date(today);
        date.setDate(today.getDate() - i);
        data.push({
            date: date.toISOString().split("T")[0],
            requests: Math.floor(Math.random() * 100) + 10,
            responseTime: Math.floor(Math.random() * 500) + 50,
            successRate: Math.min(
                100,
                Math.max(70, 100 - Math.floor(Math.random() * 30)),
            ),
        });
    }
    return data;
};

// Function to prepare response time data from logs
interface LogEntry {
    id: string;
    statusCode: number;
    responseTime: number;
    isSuccess: boolean;
    createdAt: string;
    routeId: string;
}

interface ResponseTimeDataPoint {
    date: string;
    responseTime: number;
    statusCode: number;
    isSuccess: boolean;
}

const prepareResponseTimeData = (
    logs: LogEntry[] | null | undefined,
): ResponseTimeDataPoint[] => {
    if (!logs || !Array.isArray(logs) || logs.length === 0) {
        return [];
    }

    return logs.map((log) => ({
        date: log.createdAt,
        responseTime: log.responseTime,
        statusCode: log.statusCode,
        isSuccess: log.isSuccess,
    }));
};

function RouteDetailsContent() {
    const { routeId } = useParams();
    const router = useRouter();
    const { data: session, error, isPending } = authClient.useSession();
    const [tab, setTab] = useState("overview");

    // Sample logs data for testing the response time chart
    const sampleLogsData = [
        {
            id: "0940f8e5-906a-4819-9b86-86ce740a471d",
            statusCode: 200,
            responseTime: 0,
            isSuccess: true,
            createdAt: "2025-04-17T11:23:08.913Z",
            routeId: "0c027ff9-d211-4b76-9555-ef8666848ed0",
        },
        {
            id: "b027b3c2-ed45-409d-9bf9-4cb75c2b0ca3",
            statusCode: 200,
            responseTime: 0,
            isSuccess: true,
            createdAt: "2025-04-17T11:23:17.706Z",
            routeId: "0c027ff9-d211-4b76-9555-ef8666848ed0",
        },
        {
            id: "fd40a994-861d-431e-8111-087a665415e2",
            statusCode: 200,
            responseTime: 0,
            isSuccess: true,
            createdAt: "2025-04-17T11:29:31.411Z",
            routeId: "0c027ff9-d211-4b76-9555-ef8666848ed0",
        },
        {
            id: "8046f8dc-1a2c-4455-9afb-8f9a6931bd22",
            statusCode: 200,
            responseTime: 269,
            isSuccess: true,
            createdAt: "2025-04-17T12:04:55.205Z",
            routeId: "0c027ff9-d211-4b76-9555-ef8666848ed0",
        },
        {
            id: "02795a1d-48da-4eb1-bd4c-7641ec420dfe",
            statusCode: 200,
            responseTime: 177,
            isSuccess: true,
            createdAt: "2025-04-17T12:14:04.348Z",
            routeId: "0c027ff9-d211-4b76-9555-ef8666848ed0",
        },
    ];

    // Fetch route details
    const {
        data: routeDetails,
        isLoading,
        isError,
        refetch,
    } = useQuery({
        queryKey: ["routeDetails", routeId],
        queryFn: async () => {
            const response = await fetch(`/api/routes/${routeId}`);
            if (!response.ok) {
                throw new Error("Failed to fetch route details");
            }
            return response.json();
        },
        enabled: !!session && !!routeId,
    });

    // Prepare logs data for the response time chart
    const responseTimeData = prepareResponseTimeData(
        routeDetails?.logs || sampleLogsData,
    );
    const timeData = generateMockTimeData();

    // Delete route mutation
    const deleteMutation = useMutation({
        mutationFn: async () => {
            const response = await fetch(`/api/routes/${routeId}`, {
                method: "DELETE",
            });
            if (!response.ok) {
                throw new Error("Failed to delete route");
            }
            return response.json();
        },
        onSuccess: () => {
            router.push("/dashboard");
        },
    });

    // Handle delete confirmation
    const handleDelete = () => {
        if (window.confirm("Are you sure you want to delete this route?")) {
            deleteMutation.mutate();
        }
    };

    useEffect(() => {
        if ((error && !isPending) || (!session && !isPending)) {
            router.push("/auth/login");
        }
    }, [session, error, isPending, router]);

    if (isPending || isLoading || !routeDetails) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <div className="flex flex-col items-center space-y-4">
                    <div className="w-16 h-16 border-4 border-t-primary border-r-transparent border-b-primary border-l-transparent rounded-full animate-spin"></div>
                    <p className="text-lg font-semibold">
                        Loading route data...
                    </p>
                </div>
            </div>
        );
    }

    if (isError) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <Card className="p-6 max-w-lg">
                    <h2 className="text-xl font-bold text-destructive mb-4">
                        Error Loading Route
                    </h2>
                    <p className="mb-4">
                        We couldn't load the details for this route. It may have
                        been deleted or you may not have permission to view it.
                    </p>
                    <Button onClick={() => router.push("/dashboard")}>
                        Back to Dashboard
                    </Button>
                </Card>
            </div>
        );
    }

    // Format date for display
    /**
     * Represents date formatting options
     */
    interface DateTimeFormatOptions {
        year: "numeric";
        month: "long";
        day: "numeric";
        hour: "2-digit";
        minute: "2-digit";
    }

    /**
     * Formats a date string to a human-readable format
     */
    const formatDate = (dateString: string | null | undefined): string => {
        if (!dateString) return "N/A";
        const date = new Date(dateString);
        return new Intl.DateTimeFormat("en-GB", {
            year: "numeric",
            month: "long",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        } as DateTimeFormatOptions).format(date);
    };

    return (
        <div className="container mx-auto px-4 py-8 max-w-7xl">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-bold">
                        {routeDetails.name || "Route Details"}
                    </h1>
                    <p className="text-muted-foreground">ID: {routeId}</p>
                </div>
                <div className="flex space-x-3">
                    <Button variant="outline" onClick={() => refetch()}>
                        Refresh
                    </Button>
                    <Button
                        variant="destructive"
                        onClick={handleDelete}
                        disabled={deleteMutation.isPending}
                    >
                        {deleteMutation.isPending
                            ? "Deleting..."
                            : "Delete Route"}
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <Card className="p-6 hover:shadow-md transition-shadow">
                    <h3 className="text-lg font-semibold mb-2">Status</h3>
                    <div className="flex items-center">
                        <div
                            className={`w-3 h-3 rounded-full mr-2 ${routeDetails.isActive ? "bg-green-500" : "bg-red-500"}`}
                        ></div>
                        <span>
                            {routeDetails.isActive ? "Active" : "Inactive"}
                        </span>
                    </div>
                </Card>
                <Card className="p-6 hover:shadow-md transition-shadow">
                    <h3 className="text-lg font-semibold mb-2">
                        Avg. Response Time
                    </h3>
                    <div className="text-3xl font-bold">
                        {Math.round(routeDetails.responseTime || 0)} ms
                    </div>
                </Card>
                <Card className="p-6 hover:shadow-md transition-shadow">
                    <h3 className="text-lg font-semibold mb-2">Created</h3>
                    <div>{formatDate(routeDetails.createdAt)}</div>
                </Card>
            </div>

            <Tabs value={tab} onValueChange={setTab} className="mb-6">
                <TabsList className="mb-6">
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="analytics">Analytics</TabsTrigger>
                    <TabsTrigger value="settings">Settings</TabsTrigger>
                </TabsList>

                <TabsContent value="overview">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <Card className="p-6 hover:shadow-md transition-shadow">
                            <h3 className="text-xl font-semibold mb-4">
                                Route Information
                            </h3>
                            <div className="space-y-4">
                                <div>
                                    <Input
                                        type="text"
                                        variant="bordered"
                                        label="Target URL"
                                        description="The URL to be routed to"
                                        defaultValue={routeDetails.url || ""}
                                    />
                                </div>
                                <div>
                                    <Input
                                        type="text"
                                        variant="bordered"
                                        label="Method"
                                        description="HTTP method for this route"
                                        defaultValue={
                                            routeDetails.method || "GET"
                                        }
                                    />
                                </div>
                                <div>
                                    <div className="flex items-center gap-3">
                                        <span className="text-sm font-medium">
                                            Expected Status:
                                        </span>
                                        <Chip
                                            color={
                                                routeDetails.expectedStatusCode ===
                                                200
                                                    ? "success"
                                                    : routeDetails.expectedStatusCode >=
                                                        400
                                                      ? "danger"
                                                      : routeDetails.expectedStatusCode >=
                                                          300
                                                        ? "warning"
                                                        : "primary"
                                            }
                                        >
                                            {routeDetails.expectedStatusCode ||
                                                200}
                                        </Chip>
                                    </div>
                                </div>
                                <div>
                                    <Input
                                        type="number"
                                        variant="bordered"
                                        label="Retries"
                                        description="Number of retry attempts"
                                        defaultValue={routeDetails.retries || 0}
                                    />
                                </div>
                                <div>
                                    <Input
                                        type="number"
                                        variant="bordered"
                                        label="Response Time Threshold (ms)"
                                        description="Maximum acceptable response time"
                                        defaultValue={
                                            routeDetails.responseTimeThreshold ||
                                            500
                                        }
                                    />
                                </div>
                                <div>
                                    <Input
                                        type="number"
                                        variant="bordered"
                                        label="Monitoring Interval (sec)"
                                        description="How often to check this route"
                                        defaultValue={
                                            routeDetails.monitoringInterval ||
                                            300
                                        }
                                    />
                                </div>
                            </div>
                        </Card>

                        <Card className="p-6 hover:shadow-md transition-shadow">
                            <CardHeader>
                                <CardTitle>Response Time</CardTitle>
                            </CardHeader>
                            {/* <h3 className="text-xl font-semibold mb-4">Response Time</h3> */}
                            <div className="h-64">
                                <ChartContainer
                                    className="h-[200px] w-full"
                                    config={{
                                        date: {
                                            label: "Date",
                                        },
                                        responseTime: {
                                            label: "Response Time",
                                        },
                                    }}
                                >
                                    <LineChart data={responseTimeData}>
                                        <CartesianGrid
                                            strokeDasharray="3 3"
                                            opacity={0.2}
                                        />
                                        <XAxis
                                            dataKey="date"
                                            tick={{ fontSize: 12 }}
                                            tickFormatter={(tick) => {
                                                const date = new Date(tick);
                                                return `${date.getMonth() + 1}/${date.getDate()}`;
                                            }}
                                        />
                                        <YAxis
                                            dataKey="responseTime"
                                            tick={{ fontSize: 12 }}
                                        />
                                        <ChartTooltip
                                            content={
                                                <ChartTooltipContent
                                                    formatter={(value) => [
                                                        `${value} ms`,
                                                        "Response Time",
                                                    ]}
                                                />
                                            }
                                            formatter={(value) => [
                                                `${value} ms`,
                                                "Response Time",
                                            ]}
                                        />
                                        <Line
                                            type="monotone"
                                            label="Response Time"
                                            dataKey="responseTime"
                                            strokeWidth={2}
                                            activeDot={{ r: 3 }}
                                        />
                                    </LineChart>
                                </ChartContainer>
                            </div>
                        </Card>
                    </div>
                </TabsContent>

                <TabsContent value="analytics">
                    <div className="grid grid-cols-1 gap-6">
                        {/* Function to aggregate log data */}
                        {(() => {
                            interface AggregatedLogData {
                                date: string;
                                requests: number;
                                successfulRequests: number;
                                successRate: number;
                            }

                            const aggregateLogData = (
                                logs: LogEntry[] | null | undefined,
                            ): AggregatedLogData[] => {
                                if (
                                    !logs ||
                                    !Array.isArray(logs) ||
                                    logs.length === 0
                                ) {
                                    console.warn(
                                        "No log data found to aggregate.",
                                    );
                                    return [];
                                }

                                const aggregated: {
                                    [date: string]: {
                                        requests: number;
                                        successfulRequests: number;
                                    };
                                } = {};

                                logs.forEach((log) => {
                                    try {
                                        const date = new Date(log.createdAt)
                                            .toISOString()
                                            .split("T")[0];
                                        if (!aggregated[date]) {
                                            aggregated[date] = {
                                                requests: 0,
                                                successfulRequests: 0,
                                            };
                                        }
                                        aggregated[date].requests++;
                                        if (log.isSuccess === true) {
                                            aggregated[date]
                                                .successfulRequests++;
                                        }
                                    } catch (e) {
                                        console.error(
                                            "Error processing log entry:",
                                            log,
                                            e,
                                        );
                                    }
                                });

                                return Object.entries(aggregated)
                                    .map(([date, data]) => ({
                                        date,
                                        requests: data.requests,
                                        successfulRequests:
                                            data.successfulRequests,
                                        successRate:
                                            data.requests > 0
                                                ? Math.round(
                                                      (data.successfulRequests /
                                                          data.requests) *
                                                          100,
                                                  )
                                                : 0,
                                    }))
                                    .sort(
                                        (a, b) =>
                                            new Date(a.date).getTime() -
                                            new Date(b.date).getTime(),
                                    );
                            };

                            const aggregatedData = aggregateLogData(
                                routeDetails?.logs,
                            );
                            // Show charts only if there is data from more than one day.
                            const showCharts =
                                aggregatedData && aggregatedData.length > 1;
                            const numberOfDays =
                                aggregatedData.length > 0
                                    ? aggregatedData.length
                                    : 0;

                            if (!showCharts) {
                                return (
                                    <Card className="p-6 hover:shadow-md transition-shadow col-span-1 lg:col-span-2">
                                        <CardHeader>
                                            <CardTitle>Analytics</CardTitle>
                                        </CardHeader>
                                        <div className="flex items-center justify-center h-64">
                                            <p className="text-muted-foreground text-center">
                                                {aggregatedData.length === 1
                                                    ? "Not enough data yet to display trends. Check back later."
                                                    : "No analytics data available for this route."}
                                            </p>
                                        </div>
                                    </Card>
                                );
                            }

                            // Only render the charts if showCharts is true
                            return (
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    <Card className="p-6 hover:shadow-md transition-shadow">
                                        <CardHeader>
                                            <CardTitle>
                                                Request Volume (Last{" "}
                                                {numberOfDays} Day
                                                {numberOfDays !== 1 ? "s" : ""})
                                            </CardTitle>
                                        </CardHeader>
                                        <div className="h-64">
                                            <ChartContainer
                                                className="h-[200px] w-full"
                                                config={{
                                                    date: { label: "Date" },
                                                    requests: {
                                                        label: "Requests",
                                                        color: "hsl(var(--chart-1))",
                                                    },
                                                }}
                                            >
                                                <AreaChart
                                                    accessibilityLayer
                                                    data={aggregatedData}
                                                    margin={{
                                                        left: 12,
                                                        right: 12,
                                                        top: 10,
                                                        bottom: 0,
                                                    }}
                                                >
                                                    <CartesianGrid
                                                        vertical={false}
                                                        strokeDasharray="3 3"
                                                        opacity={0.4}
                                                    />
                                                    <XAxis
                                                        dataKey="date"
                                                        tickLine={false}
                                                        axisLine={false}
                                                        tickMargin={8}
                                                        tickFormatter={(
                                                            value,
                                                        ) => {
                                                            const date =
                                                                new Date(value);
                                                            return date.toLocaleDateString(
                                                                "en-US",
                                                                {
                                                                    month: "short",
                                                                    day: "numeric",
                                                                    timeZone:
                                                                        "UTC",
                                                                },
                                                            );
                                                        }}
                                                    />
                                                    <YAxis
                                                        dataKey="requests"
                                                        tickLine={false}
                                                        axisLine={false}
                                                        tickMargin={8}
                                                        tickCount={3}
                                                        allowDecimals={false}
                                                    />
                                                    <ChartTooltip
                                                        cursor={false}
                                                        content={
                                                            <ChartTooltipContent indicator="dot" />
                                                        }
                                                    />
                                                    <Area
                                                        dataKey="requests"
                                                        type="natural"
                                                        fill="var(--color-requests)"
                                                        fillOpacity={0.4}
                                                        stroke="var(--color-requests)"
                                                        stackId="a"
                                                    />
                                                </AreaChart>
                                            </ChartContainer>
                                        </div>
                                    </Card>

                                    <Card className="p-6 hover:shadow-md transition-shadow">
                                        <CardHeader>
                                            <CardTitle>
                                                Success Rate (Last{" "}
                                                {numberOfDays} Day
                                                {numberOfDays !== 1 ? "s" : ""})
                                            </CardTitle>
                                        </CardHeader>
                                        <div className="h-64">
                                            <ChartContainer
                                                className="h-[200px] w-full"
                                                config={{
                                                    date: { label: "Date" },
                                                    successRate: {
                                                        label: "Success Rate",
                                                        color: "hsl(var(--chart-2))",
                                                    },
                                                }}
                                            >
                                                <LineChart
                                                    accessibilityLayer
                                                    data={aggregatedData}
                                                    margin={{
                                                        left: 12,
                                                        right: 12,
                                                        top: 10,
                                                        bottom: 0,
                                                    }}
                                                >
                                                    <CartesianGrid
                                                        vertical={false}
                                                        strokeDasharray="3 3"
                                                        opacity={0.4}
                                                    />
                                                    <XAxis
                                                        dataKey="date"
                                                        tickLine={false}
                                                        axisLine={false}
                                                        tickMargin={8}
                                                        tickFormatter={(
                                                            value,
                                                        ) => {
                                                            const date =
                                                                new Date(value);
                                                            return date.toLocaleDateString(
                                                                "en-US",
                                                                {
                                                                    month: "short",
                                                                    day: "numeric",
                                                                    timeZone:
                                                                        "UTC",
                                                                },
                                                            );
                                                        }}
                                                    />
                                                    <YAxis
                                                        dataKey="successRate"
                                                        tickLine={false}
                                                        axisLine={false}
                                                        tickMargin={8}
                                                        domain={[0, 100]}
                                                        tickFormatter={(
                                                            value,
                                                        ) => `${value}%`}
                                                    />
                                                    <ChartTooltip
                                                        cursor={false}
                                                        content={
                                                            <ChartTooltipContent
                                                                formatter={(
                                                                    value,
                                                                    name,
                                                                ) => [
                                                                    `${value}%`,
                                                                    name,
                                                                ]}
                                                                indicator="line"
                                                            />
                                                        }
                                                    />
                                                    <Line
                                                        dataKey="successRate"
                                                        type="natural"
                                                        stroke="var(--color-successRate)"
                                                        strokeWidth={2}
                                                        dot={{ r: 3 }}
                                                        activeDot={{ r: 5 }}
                                                    />
                                                </LineChart>
                                            </ChartContainer>
                                        </div>
                                    </Card>
                                </div>
                            );
                        })()}

                        <Card className="p-6 hover:shadow-md transition-shadow">
                            <h3 className="text-xl font-semibold mb-4">
                                Recent Requests
                            </h3>
                            <ScrollArea className="h-96">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Request ID</TableHead>
                                            <TableHead>Timestamp</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead>Response Time</TableHead>
                                            <TableHead>Tags</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {routeDetails.logs.map(
                                            (log: LogEntry, i: number) => {
                                                console.log(
                                                    JSON.stringify(log),
                                                );
                                                return (
                                                    <TableRow key={i}>
                                                        <TableCell className="font-medium text-sm">
                                                            {log.id}
                                                        </TableCell>
                                                        <TableCell>
                                                            {formatDate(
                                                                new Date(
                                                                    log.createdAt,
                                                                ).toISOString(),
                                                            )}
                                                        </TableCell>
                                                        <TableCell>
                                                            <span
                                                                className={`px-2 py-1 rounded-full text-xs ${i % 5 === 0 ? "bg-destructive/20 text-destructive" : "bg-success/20 text-success"}`}
                                                            >
                                                                {i % 5 === 0
                                                                    ? "500"
                                                                    : "200"}
                                                            </span>
                                                        </TableCell>
                                                        <TableCell>
                                                            {Math.floor(
                                                                Math.random() *
                                                                    500,
                                                            ) + 50}
                                                            ms
                                                        </TableCell>
                                                        <TableCell>
                                                            <div className="flex space-x-2">
                                                                {log.isSuccess ? (
                                                                    <Chip color="success">
                                                                        Success
                                                                    </Chip>
                                                                ) : (
                                                                    <Chip color="danger">
                                                                        Failed
                                                                    </Chip>
                                                                )}
                                                                {log.responseTime >
                                                                    routeDetails.responseTimeThreshold *
                                                                        0.8 && (
                                                                    <Chip color="warning">
                                                                        Slow
                                                                    </Chip>
                                                                )}
                                                            </div>
                                                        </TableCell>
                                                    </TableRow>
                                                );
                                            },
                                        )}
                                    </TableBody>
                                </Table>
                            </ScrollArea>
                        </Card>
                    </div>
                </TabsContent>

                <TabsContent value="settings">
                    <Card className="p-6 hover:shadow-md transition-shadow">
                        <h3 className="text-xl font-semibold mb-4">
                            Route Settings
                        </h3>
                        <p className="text-muted-foreground mb-6">
                            Edit your route settings here. This is a placeholder
                            for the route settings form.
                        </p>

                        <div className="space-y-4">
                            <div>
                                <Input
                                    type="text"
                                    variant="bordered"
                                    label="Route Name"
                                    description="A friendly name for your route."
                                    defaultValue={routeDetails.name}
                                />
                            </div>

                            <div>
                                <Input
                                    type="text"
                                    variant="bordered"
                                    label="Target URL"
                                    description="The URL that will be monitored."
                                    defaultValue={routeDetails.targetUrl}
                                />
                            </div>

                            <div className="flex items-center space-x-3">
                                <Checkbox
                                    defaultChecked={routeDetails.isActive}
                                >
                                    Enabled
                                </Checkbox>
                            </div>

                            <div className="pt-4">
                                <Button>Save Changes</Button>
                            </div>
                        </div>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}

export default function RouteDetailsPage() {
    return (
        <QueryClientProvider client={queryClient}>
            <RouteDetailsContent />
        </QueryClientProvider>
    );
}
