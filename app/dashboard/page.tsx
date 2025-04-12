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

const SkeletonRouteCard = () => (
    <Card className="animate-pulse">
        <CardHeader className="pb-2">
            <div className="flex justify-between items-start">
                <div className="space-y-2">
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="h-3 w-48" />
                </div>
                <Skeleton className="h-8 w-8 rounded-full" />
            </div>
        </CardHeader>
        <CardContent>
            <div className="flex justify-between items-center mb-4">
                <Skeleton className="h-6 w-20 rounded-full" />
                <Skeleton className="h-6 w-16 rounded-full" />
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                    <Skeleton className="h-4 w-24 mb-2" />
                    <Skeleton className="h-5 w-16" />
                </div>
                <div>
                    <Skeleton className="h-4 w-16 mb-2" />
                    <Skeleton className="h-5 w-16" />
                </div>
                <div>
                    <Skeleton className="h-4 w-20 mb-2" />
                    <Skeleton className="h-5 w-16" />
                </div>
            </div>
        </CardContent>
        <CardFooter className="pt-0">
            <Skeleton className="h-9 w-full rounded-md" />
        </CardFooter>
    </Card>
)

const CreateRouteDialog = ({
    isOpen,
    onOpenChange,
}: {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
}) => {
    const [formData, setFormData] = useState({
        // Basic Information
        name: "",
        description: "",
        url: "",
        method: "GET",
        // Request Details
        requestHeaders: "",
        requestBody: "",
        // Monitoring Configuration
        expectedStatusCode: 200,
        responseTimeThreshold: 500,
        monitoringInterval: "300",
        retries: 3,
        alertEmail: "",
    });

    const handleChange = (field: string, value: string | number) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
    };
    const handleSubmit = useCallback(async () => {
        console.log("Submitting form data:", formData);
        const response = await fetch("/api/routes", {
            method: "POST",
            body: JSON.stringify(formData),
        });
        if (response.ok) {
            addToast({
                title: "Successfully created route!",
                description: "Your route has been successfully created.",
                color: "success",
                variant: "flat",
            });
            onOpenChange(false);
        }
    }, [formData]);

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogTrigger asChild>
                <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Add New Route
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle>Add New Route</DialogTitle>
                    <DialogDescription>
                        Enter the details of the route you want to monitor.
                    </DialogDescription>
                </DialogHeader>
                <ScrollArea className="max-h-[70vh] pl-4">
                    <div className="py-4 pr-5 space-y-4">
                        {/* Basic Information */}
                        <div className="rounded-lg border border-zinc-200 dark:border-zinc-700/50 p-3">
                            <h3 className="font-medium mb-3">
                                Basic Information
                            </h3>
                            <div className="space-y-4">
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label
                                        htmlFor="name"
                                        className="text-right"
                                    >
                                        Name
                                    </Label>
                                    <Input
                                        variant="bordered"
                                        isRequired
                                        id="name"
                                        placeholder="API Authentication"
                                        className="col-span-3"
                                        value={formData.name}
                                        onValueChange={(value) =>
                                            handleChange("name", value)
                                        }
                                    />
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label
                                        htmlFor="description"
                                        className="text-right"
                                    >
                                        Description
                                    </Label>
                                    <Input
                                        variant="bordered"
                                        id="description"
                                        placeholder="Authentication endpoint for API"
                                        className="col-span-3"
                                        value={formData.description}
                                        onValueChange={(value) =>
                                            handleChange("description", value)
                                        }
                                    />
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="url" className="text-right">
                                        URL
                                    </Label>
                                    <Input
                                        isRequired
                                        variant="bordered"
                                        id="url"
                                        placeholder="https://api.example.com/auth"
                                        className="col-span-3"
                                        value={formData.url}
                                        onValueChange={(value) =>
                                            handleChange("url", value)
                                        }
                                    />
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label
                                        htmlFor="method"
                                        className="text-right"
                                    >
                                        Method
                                    </Label>
                                    <Select
                                        required
                                        value={formData.method}
                                        onValueChange={(value) =>
                                            handleChange("method", value)
                                        }
                                    >
                                        <SelectTrigger className="col-span-3">
                                            <SelectValue placeholder="GET" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="GET">
                                                GET
                                            </SelectItem>
                                            <SelectItem value="POST">
                                                POST
                                            </SelectItem>
                                            <SelectItem value="PUT">
                                                PUT
                                            </SelectItem>
                                            <SelectItem value="DELETE">
                                                DELETE
                                            </SelectItem>
                                            <SelectItem value="PATCH">
                                                PATCH
                                            </SelectItem>
                                            <SelectItem value="HEAD">
                                                HEAD
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </div>

                        {/* Request Details */}
                        <div className="rounded-lg border border-zinc-200 dark:border-zinc-700/50 p-3">
                            <h3 className="font-medium mb-3">
                                Request Details
                            </h3>
                            <div className="space-y-4">
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label
                                        htmlFor="requestHeaders"
                                        className="text-right"
                                    >
                                        Request Headers
                                    </Label>
                                    <Input
                                        variant="bordered"
                                        id="requestHeaders"
                                        placeholder='{"Content-Type": "application/json"}'
                                        className="col-span-3"
                                        value={formData.requestHeaders}
                                        onValueChange={(value) =>
                                            handleChange(
                                                "requestHeaders",
                                                value,
                                            )
                                        }
                                    />
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label
                                        htmlFor="requestBody"
                                        className="text-right"
                                    >
                                        Request Body
                                    </Label>
                                    <Input
                                        variant="bordered"
                                        id="requestBody"
                                        placeholder='{"username": "test", "password": "test"}'
                                        className="col-span-3"
                                        value={formData.requestBody}
                                        onValueChange={(value) =>
                                            handleChange("requestBody", value)
                                        }
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Monitoring Configuration */}
                        <div className="rounded-lg border border-zinc-200 dark:border-zinc-700/50 p-3">
                            <h3 className="font-medium mb-3">
                                Monitoring Configuration
                            </h3>
                            <div className="space-y-4">
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label
                                        htmlFor="expectedStatusCode"
                                        className="text-right"
                                    >
                                        Expected Status
                                    </Label>
                                    <NumberInput
                                        isRequired
                                        variant="bordered"
                                        id="expectedStatusCode"
                                        placeholder="200"
                                        className="col-span-3"
                                        value={formData.expectedStatusCode}
                                        onValueChange={(value) =>
                                            handleChange(
                                                "expectedStatusCode",
                                                value,
                                            )
                                        }
                                    />
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label
                                        htmlFor="responseTimeThreshold"
                                        className="text-right"
                                    >
                                        Response Time Threshold (ms)
                                    </Label>
                                    <NumberInput
                                        isRequired
                                        variant="bordered"
                                        id="responseTimeThreshold"
                                        placeholder="500"
                                        className="col-span-3"
                                        value={formData.responseTimeThreshold}
                                        onValueChange={(value) =>
                                            handleChange(
                                                "responseTimeThreshold",
                                                value,
                                            )
                                        }
                                    />
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label
                                        htmlFor="monitoringInterval"
                                        className="text-right"
                                    >
                                        Monitoring Interval
                                    </Label>
                                    <Select
                                        required
                                        value={formData.monitoringInterval}
                                        onValueChange={(value) =>
                                            handleChange(
                                                "monitoringInterval",
                                                value,
                                            )
                                        }
                                    >
                                        <SelectTrigger className="col-span-3">
                                            <SelectValue placeholder="5 minutes" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="60">
                                                1 minute
                                            </SelectItem>
                                            <SelectItem value="300">
                                                5 minutes
                                            </SelectItem>
                                            <SelectItem value="900">
                                                15 minutes
                                            </SelectItem>
                                            <SelectItem value="1800">
                                                30 minutes
                                            </SelectItem>
                                            <SelectItem value="3600">
                                                1 hour
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label
                                        htmlFor="retries"
                                        className="text-right"
                                    >
                                        Retries
                                    </Label>
                                    <NumberInput
                                        required
                                        variant="bordered"
                                        id="retries"
                                        placeholder="3"
                                        type="number"
                                        className="col-span-3"
                                        value={formData.retries}
                                        onValueChange={(value) =>
                                            handleChange("retries", value)
                                        }
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Notifications */}
                        <div className="rounded-lg border border-zinc-200 dark:border-zinc-700/50 p-3">
                            <h3 className="font-medium mb-3">Notifications</h3>
                            <div className="space-y-4">
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label
                                        htmlFor="alertEmail"
                                        className="text-right"
                                    >
                                        Alert Email
                                    </Label>
                                    <Input
                                        variant="bordered"
                                        id="alertEmail"
                                        placeholder="alerts@example.com"
                                        type="email"
                                        className="col-span-3"
                                        value={formData.alertEmail}
                                        onValueChange={(value) =>
                                            handleChange("alertEmail", value)
                                        }
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </ScrollArea>
                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                    >
                        Cancel
                    </Button>
                    <Button onClick={handleSubmit}>Add Route</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

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
