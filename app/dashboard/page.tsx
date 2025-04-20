"use client";
import { FileText, MoreHorizontal, PauseCircle, Plus, RefreshCw, Server, Trash2Icon } from "lucide-react";
import { useEffect, useState } from "react";

import { CreateRouteDialog } from "@/components/dashboard/create-route-dialog";
import { EditRouteButton } from "@/components/dashboard/edit-route-dialog";
import { RoutesTable, StatusBadge } from "@/components/dashboard/routes-table";
import { SkeletonRouteCard } from "@/components/dashboard/skeleton-route-card";
import { TableSkeleton } from "@/components/dashboard/skeleton-table";
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
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { authClient } from "@/lib/auth-client";
import { RouteWithMetrics } from "@/types";
import { Chip } from "@heroui/chip";
import { addToast } from "@heroui/toast";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

export default function Dashboard() {
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const { error, data, isPending } = authClient.useSession();
    const router = useRouter();
    const {
        data: routes,
        isLoading,
        isPending: isRoutesPending,
        refetch,
    } = useQuery<RouteWithMetrics[]>({
        queryKey: ["routes"],
        queryFn: async () => {
            const response = await fetch("/api/routes");
            if (!response.ok) {
                throw new Error("Network response was not ok");
            }
            return response.json();
        },
        enabled: !!data, // Only run the query if the user is authenticated
    });

    // Handle dialog close - refetch routes data
    const handleDialogChange = (isOpen: boolean) => {
        setIsCreateDialogOpen(isOpen);

        // If the dialog is closing, refetch the routes data
        if (!isOpen) {
            refetch();
        }
    };

    useEffect(() => {
        if ((error && !isPending) || (!data && !isPending)) {
            router.push("/auth/login"); // Redirect to login if not authenticated
        }
    }, [error, isPending, data, router]);
    const queryClient = useQueryClient()

    return (
        <div className="container flex items-center justify-center max-w-[95%] flex-col mx-auto py-6">
            <div className="flex justify-between items-center mb-6 w-full">
                <h1 className="text-3xl font-bold">Route Monitoring</h1>
                <CreateRouteDialog
                    isOpen={isCreateDialogOpen}
                    onOpenChange={handleDialogChange}
                />
            </div>

            <Tabs defaultValue="cards" className="w-full">
                <TabsList className="mb-4">
                    <TabsTrigger value="cards">Card View</TabsTrigger>
                    <TabsTrigger value="table">Table View</TabsTrigger>
                </TabsList>

                <TabsContent value="table" className="space-y-4">
                    <Card>
                        <CardContent className="p-0">
                            <div className="overflow-x-auto">
                                {isLoading || isRoutesPending ? (
                                    <TableSkeleton rowCount={5} />
                                ) : (routes?.length === 0 || !routes) &&
                                    !isLoading ? (
                                    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                                        <Server className="h-12 w-12 text-slate-200 mb-4" />
                                        <h3 className="text-lg font-medium  mb-1">
                                            No routes found
                                        </h3>
                                        <p className="mb-4 max-w-md">
                                            Create your first route to start
                                            monitoring your endpoints and get
                                            notified when they go down.
                                        </p>
                                        <Button
                                            onClick={() =>
                                                handleDialogChange(true)
                                            }
                                        >
                                            <Plus className="mr-2 h-4 w-4" />{" "}
                                            Add Your First Route
                                        </Button>
                                    </div>
                                ) : (
                                    <RoutesTable routes={routes} />
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
                        ) : routes?.length === 0 || !routes ? (
                            <Card className="col-span-full">
                                <CardContent className="text-center py-6">
                                    No routes found. Create your first route to
                                    get started.
                                </CardContent>
                            </Card>
                        ) : (
                            routes.map((route) => (
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
                                                    <DropdownMenuItem onClick={() => {
                                                        router.push(`/dashboard/routes/${route.id}`);
                                                    }}>
                                                        <FileText className="mr-2 h-4 w-4" />
                                                        View Details
                                                    </DropdownMenuItem>
                                                    <EditRouteButton route={route} />
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem
                                                        onClick={async () => {
                                                            const response = await fetch(
                                                                `/api/routes/${route.id}/run`,
                                                                {
                                                                    method: "POST",
                                                                },
                                                            );
                                                            if (response.ok) {
                                                                addToast({
                                                                    title: "Route checked successfully!",
                                                                    description:
                                                                        "The route has been checked.",
                                                                    color: "success",
                                                                    variant: "flat",
                                                                });
                                                                queryClient.invalidateQueries({
                                                                    queryKey: ["routes"],
                                                                });
                                                            } else {
                                                                addToast({
                                                                    title: "Error checking route",
                                                                    description:
                                                                        "There was an error checking the route.",
                                                                    color: "danger",
                                                                    variant: "flat",
                                                                });
                                                            }
                                                        }}
                                                    >
                                                        <RefreshCw className="mr-2 h-4 w-4" />
                                                        Check Now
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        onClick={async () => {
                                                            const response = await fetch(
                                                                `/api/routes/${route.id}`,
                                                                {
                                                                    method: "PATCH",
                                                                    headers: {
                                                                        "Content-Type": "application/json",
                                                                    },
                                                                    body: JSON.stringify({
                                                                        isActive: !route.isActive,
                                                                    }),
                                                                },
                                                            );
                                                            if (response.ok) {
                                                                addToast({
                                                                    title: `Route ${route.isActive ? "paused" : "resumed"} successfully!`,
                                                                    description: `The route has been ${route.isActive ? "paused" : "resumed"}.`,
                                                                    color: "success",
                                                                    variant: "flat",
                                                                });
                                                                queryClient.invalidateQueries({
                                                                    queryKey: ["routes"],
                                                                });
                                                            } else {
                                                                addToast({
                                                                    title: "Error toggling monitoring",
                                                                    description:
                                                                        "There was an error toggling the monitoring status.",
                                                                    color: "danger",
                                                                    variant: "flat",
                                                                });
                                                            }
                                                        }}
                                                    >
                                                        <PauseCircle className="mr-2 h-4 w-4" />
                                                        {route.isActive ? "Pause Monitoring" : "Resume Monitoring"}
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem
                                                        className="text-red-600"
                                                        onClick={async () => {
                                                            const response = await fetch(
                                                                `/api/routes/${route.id}`,
                                                                {
                                                                    method: "DELETE",
                                                                },
                                                            );
                                                            if (response.ok) {
                                                                addToast({
                                                                    title: "Route deleted successfully!",
                                                                    description:
                                                                        "The route has been deleted.",
                                                                    color: "success",
                                                                    variant: "flat",
                                                                });
                                                                queryClient.invalidateQueries({
                                                                    queryKey: ["routes"],
                                                                });
                                                            } else {
                                                                addToast({
                                                                    title: "Error deleting route",
                                                                    description:
                                                                        "There was an error deleting the route.",
                                                                    color: "danger",
                                                                    variant: "flat",
                                                                });
                                                            }
                                                        }}
                                                    >
                                                        <Trash2Icon className="mr-2 h-4 w-4" />
                                                        Delete Route
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="flex justify-between items-center mb-4">
                                            <StatusBadge
                                                status={route.status}
                                            />
                                            <Chip
                                                color="secondary"
                                                variant="dot"
                                            >
                                                {route.method}
                                            </Chip>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2 text-sm">
                                            <div>
                                                <p className="text-muted-foreground">
                                                    Response Time
                                                </p>
                                                <p className="font-medium">
                                                    {route.responseTime ===
                                                        undefined ||
                                                        route.responseTime === null
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
                                                    {route.monitoringInterval /
                                                        60}{" "}
                                                    min
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-muted-foreground">
                                                    Monitoring
                                                </p>
                                                <div className="flex items-center">
                                                    <span
                                                        className={`h-3 w-3 rounded-full mr-2 animate-pulse ${route.isActive ? "bg-green-500" : "bg-red-500"
                                                            }`}
                                                    ></span>
                                                    <p className="font-medium">
                                                        {route.isActive ? "Active" : "Paused"}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </CardContent>
                                    <CardFooter className="pt-0">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="w-full"
                                            onClick={() => {
                                                router.push(
                                                    `/dashboard/routes/${route.id}`,
                                                );
                                            }}
                                        >
                                            View Details
                                        </Button>
                                    </CardFooter>
                                </Card>
                            ))
                        )}
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}
