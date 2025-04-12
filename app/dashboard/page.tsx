"use client";
import { formatDistanceToNow } from "date-fns";
import { MoreHorizontal, Plus } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
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
import { Chip } from "@heroui/chip";
import { Input } from "@heroui/input";
import { NumberInput } from "@heroui/number-input";
import { Skeleton } from "@heroui/skeleton";
import { addToast } from "@heroui/toast";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { TableSkeleton } from "@/components/dashboard/skeleton-table";
import { SkeletonRouteCard } from "@/components/dashboard/skeleton-route-card";
import { CreateRouteDialog } from "@/components/dashboard/create-route-dialog";

// Helper function to render status badge
function StatusBadge({ status }: { status: string }) {
    switch (status) {
        case "up":
            return (
                <Chip variant="dot" color="success">
                    {/* <CheckCircle className="h-3.5 w-3.5" /> */}
                    Operational
                </Chip>
            );
        case "down":
            return (
                <Chip variant="dot" color="danger">
                    {/* <XCircle className="h-3.5 w-3.5" /> */}
                    Down
                </Chip>
            );
        case "degraded":
            return (
                <Chip variant="dot" color="warning">
                    {/* <Clock className="h-3.5 w-3.5" /> */}
                    Degraded
                </Chip>
            );
        default:
            return <Chip variant="dot">{status}</Chip>;
    }
}

export default function Dashboard() {
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const { error, data, isPending } = authClient.useSession();
    const router = useRouter();
    const { data: routes, isLoading, isPending: isRoutesPending } = useQuery<{
        id: string;
        name: string;
        url: string;
        method: string;
        status: string;
        responseTime: number;
        lastChecked?: Date | null;
        monitoringInterval: number;
        uptime: number;
    }[]>({
        queryKey: ["routes"],
        initialData: undefined,
        queryFn: async () => {
            const response = await fetch("/api/routes");
            if (!response.ok) {
                throw new Error("Network response was not ok");
            }
            return response.json();
        },
        enabled: !!data, // Only run the query if the user is authenticated
    })


    useEffect(() => {
        if (error && !isPending && !data) {
            router.push("/auth/login"); // Redirect to login if not authenticated
        }
    }, [error, isPending, data, router]);

    return (
        <div className="container flex items-center justify-center max-w-[95%] flex-col mx-auto py-6">
            <div className="flex justify-between items-center mb-6 w-full">
                <h1 className="text-3xl font-bold">Route Monitoring</h1>
                <CreateRouteDialog
                    isOpen={isCreateDialogOpen}
                    onOpenChange={setIsCreateDialogOpen}
                />
            </div>

            <Tabs defaultValue="table" className="w-full">
                <TabsList className="mb-4">
                    <TabsTrigger value="table">Table View</TabsTrigger>
                    <TabsTrigger value="cards">Card View</TabsTrigger>
                </TabsList>

                <TabsContent value="table" className="space-y-4">
                    <Card>
                        <CardContent className="p-0">
                            <div className="overflow-x-auto">
                                {isLoading || isRoutesPending ? (
                                    <TableSkeleton rowCount={5}  />
                                ) : ((routes?.length === 0 || !routes) && !isLoading) ? (
                                    <TableRow>
                                        <TableCell colSpan={8} className="text-center py-6">No routes found. Create your first route to get started.</TableCell>
                                    </TableRow>
                                ) : (
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Name</TableHead>
                                                <TableHead>URL</TableHead>
                                                <TableHead>Method</TableHead>
                                                <TableHead>Status</TableHead>
                                                <TableHead>Response Time</TableHead>
                                                <TableHead>Last Checked</TableHead>
                                                <TableHead>Uptime</TableHead>
                                                <TableHead className="text-right">Actions</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {routes.map((route) => (
                                                <TableRow key={route.id}>
                                                    <TableCell className="font-medium">{route.name}</TableCell>
                                                    <TableCell className="font-mono text-sm truncate max-w-[200px]">{route.url}</TableCell>
                                                    <TableCell>
                                                        <Chip color="secondary" variant="dot">{route.method}</Chip>
                                                    </TableCell>
                                                    <TableCell>
                                                        <StatusBadge status={route.status} />
                                                    </TableCell>
                                                    <TableCell>
                                                        {route.status === "down" || !route.responseTime
                                                            ? "-"
                                                            : `${route.responseTime}ms`}
                                                    </TableCell>
                                                    <TableCell>
                                                        {route.lastChecked
                                                            ? formatDistanceToNow(route.lastChecked, { addSuffix: true })
                                                            : "Never checked"}
                                                    </TableCell>
                                                    <TableCell>{route.uptime}</TableCell>
                                                    <TableCell className="text-right">
                                                        <DropdownMenu>
                                                            <DropdownMenuTrigger asChild>
                                                                <Button variant="ghost" className="h-8 w-8 p-0">
                                                                    <span className="sr-only">Open menu</span>
                                                                    <MoreHorizontal className="h-4 w-4" />
                                                                </Button>
                                                            </DropdownMenuTrigger>
                                                            <DropdownMenuContent align="end">
                                                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                                <DropdownMenuItem>View Details</DropdownMenuItem>
                                                                <DropdownMenuItem>Edit Route</DropdownMenuItem>
                                                                <DropdownMenuSeparator />
                                                                <DropdownMenuItem onClick={async () => {
                                                                    const response = await fetch(`/api/routes/${route.id}/run`, {
                                                                        method: "POST",
                                                                    })
                                                                    if (response.ok) {
                                                                        addToast({
                                                                            title: "Route checked successfully!",
                                                                            description: "The route has been checked.",
                                                                            color: "success",
                                                                            variant: "flat",
                                                                        });
                                                                    } else {
                                                                        addToast({
                                                                            title: "Error checking route",
                                                                            description: "There was an error checking the route.",
                                                                            color: "danger",
                                                                            variant: "flat",
                                                                        });
                                                                    }

                                                                }}>Check Now</DropdownMenuItem>
                                                                <DropdownMenuItem>Pause Monitoring</DropdownMenuItem>
                                                                <DropdownMenuSeparator />
                                                                <DropdownMenuItem className="text-red-600">Delete Route</DropdownMenuItem>
                                                            </DropdownMenuContent>
                                                        </DropdownMenu>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="cards" className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {isLoading || isPending ? (
                            Array.from({ length: 6 }, (_, index) => (
                                <SkeletonRouteCard key={index} />
                            ))
                        ) : (routes?.length === 0 || !routes) ? (
                            <Card className="col-span-full">
                                <CardContent className="text-center py-6">
                                    No routes found. Create your first route to get started.
                                </CardContent>
                            </Card>
                        ) : routes.map((route) => (
                            <Card key={route.id}>
                                <CardHeader className="pb-2">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <CardTitle className="text-lg">
                                                {route.name}
                                            </CardTitle>
                                            <CardDescription className="font-mono text-xs truncate mt-1">
                                                {route.url}
                                            </CardDescription>
                                        </div>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button
                                                    variant="ghost"
                                                    className="h-8 w-8 p-0"
                                                >
                                                    <span className="sr-only">
                                                        Open menu
                                                    </span>
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuLabel>
                                                    Actions
                                                </DropdownMenuLabel>
                                                <DropdownMenuItem>
                                                    View Details
                                                </DropdownMenuItem>
                                                <DropdownMenuItem>
                                                    Edit Route
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem>
                                                    Check Now
                                                </DropdownMenuItem>
                                                <DropdownMenuItem>
                                                    Pause Monitoring
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem className="text-red-600">
                                                    Delete Route
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex justify-between items-center mb-4">
                                        <StatusBadge status={route.status} />
                                        <Chip color="secondary" variant="dot">
                                            {route.method}
                                        </Chip>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2 text-sm">
                                        <div>
                                            <p className="text-muted-foreground">
                                                Response Time
                                            </p>
                                            <p className="font-medium">
                                                {route.status === "down" || !route.responseTime
                                                    ? "-"
                                                    : `${route.responseTime}ms`}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-muted-foreground">
                                                Uptime
                                            </p>
                                            <p className="font-medium">
                                                {route.uptime}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-muted-foreground">
                                                Frequency
                                            </p>
                                            <p className="font-medium">
                                                {route.monitoringInterval / 60} min
                                            </p>
                                        </div>
                                    </div>
                                </CardContent>
                                <CardFooter className="pt-0">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="w-full"
                                    >
                                        View Details
                                    </Button>
                                </CardFooter>
                            </Card>
                        ))}
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}
