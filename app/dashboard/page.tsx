"use client";

// export default function Dashboard() {
//     const { error, data, isPending } = authClient.useSession();
//     const router = useRouter();
//     useEffect(() => {
//         if (error && !isPending && !data) {
//             router.push("/auth/login"); // Redirect to login if not authenticated
//         }
//     }, [error, isPending, data, router]);

//     return (
//         <div className="flex min-h-screen items-center justify-center px-4 py-12">
//             <h1 className="text-2xl font-bold">Dashboard</h1>
//             <p className="mt-4">Welcome to your dashboard!</p>
//         </div>
//     );
// } "use client"

import { formatDistanceToNow } from "date-fns";
import { CheckCircle, Clock, MoreHorizontal, Plus, XCircle } from "lucide-react";
import { useEffect, useState } from "react";

import { Chip } from "@heroui/chip";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Input } from "@heroui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";

// Mock data for routes
const routes = [
    {
        id: "1",
        name: "API Authentication",
        url: "https://api.example.com/auth",
        method: "POST",
        status: "up",
        responseTime: 120,
        lastChecked: new Date(Date.now() - 1000 * 60 * 5), // 5 minutes ago
        frequency: 5, // minutes
        uptime: 99.8,
    },
    {
        id: "2",
        name: "User Profile Endpoint",
        url: "https://api.example.com/users/profile",
        method: "GET",
        status: "down",
        responseTime: 0,
        lastChecked: new Date(Date.now() - 1000 * 60 * 2), // 2 minutes ago
        frequency: 1, // minutes
        uptime: 95.2,
    },
    {
        id: "3",
        name: "Payment Processing",
        url: "https://api.example.com/payments/process",
        method: "POST",
        status: "degraded",
        responseTime: 850,
        lastChecked: new Date(Date.now() - 1000 * 60 * 1), // 1 minute ago
        frequency: 2, // minutes
        uptime: 98.5,
    },
    {
        id: "4",
        name: "Product Catalog",
        url: "https://api.example.com/products",
        method: "GET",
        status: "up",
        responseTime: 95,
        lastChecked: new Date(Date.now() - 1000 * 60 * 3), // 3 minutes ago
        frequency: 10, // minutes
        uptime: 99.9,
    },
    {
        id: "5",
        name: "Order Status",
        url: "https://api.example.com/orders/status",
        method: "GET",
        status: "up",
        responseTime: 110,
        lastChecked: new Date(Date.now() - 1000 * 60 * 7), // 7 minutes ago
        frequency: 5, // minutes
        uptime: 99.7,
    },
]

// Helper function to render status badge
function StatusBadge({ status }: { status: string }) {
    switch (status) {
        case "up":
            return (
                <Chip variant="dot" color="success">
                    {/* <CheckCircle className="h-3.5 w-3.5" /> */}
                    Operational
                </Chip>
            )
        case "down":
            return (
                <Chip variant="dot" color="danger">
                    {/* <XCircle className="h-3.5 w-3.5" /> */}
                    Down
                </Chip>
            )
        case "degraded":
            return (
                <Chip variant="dot" color="warning">
                    {/* <Clock className="h-3.5 w-3.5" /> */}
                    Degraded
                </Chip>
            )
        default:
            return <Chip variant="dot">{status}</Chip>
    }
}

export default function Dashboard() {
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
    const { error, data, isPending } = authClient.useSession();
    const router = useRouter();
    useEffect(() => {
        if (error && !isPending && !data) {
            router.push("/auth/login"); // Redirect to login if not authenticated
        }
    }, [error, isPending, data, router]);

    return (
        <div className="container mx-auto py-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold">Route Monitoring</h1>
                <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="mr-2 h-4 w-4" />
                            Add New Route
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[500px]">
                        <DialogHeader>
                            <DialogTitle>Add New Route</DialogTitle>
                            <DialogDescription>Enter the details of the route you want to monitor.</DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="name" className="text-right">
                                    Name
                                </Label>
                                <Input id="name" placeholder="API Authentication" className="col-span-3" />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="url" className="text-right">
                                    URL
                                </Label>
                                <Input id="url" placeholder="https://api.example.com/auth" className="col-span-3" />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="method" className="text-right">
                                    Method
                                </Label>
                                <Select>
                                    <SelectTrigger className="col-span-3">
                                        <SelectValue placeholder="GET" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="get">GET</SelectItem>
                                        <SelectItem value="post">POST</SelectItem>
                                        <SelectItem value="put">PUT</SelectItem>
                                        <SelectItem value="delete">DELETE</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="frequency" className="text-right">
                                    Check Frequency
                                </Label>
                                <Select>
                                    <SelectTrigger className="col-span-3">
                                        <SelectValue placeholder="5 minutes" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="1">1 minute</SelectItem>
                                        <SelectItem value="5">5 minutes</SelectItem>
                                        <SelectItem value="15">15 minutes</SelectItem>
                                        <SelectItem value="30">30 minutes</SelectItem>
                                        <SelectItem value="60">1 hour</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                                Cancel
                            </Button>
                            <Button onClick={() => setIsCreateDialogOpen(false)}>Add Route</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            <Tabs defaultValue="table" className="w-full">
                <TabsList className="mb-4">
                    <TabsTrigger value="table">Table View</TabsTrigger>
                    <TabsTrigger value="cards">Card View</TabsTrigger>
                </TabsList>

                <TabsContent value="table" className="space-y-4">
                    <Card>
                        <CardContent className="p-0">
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
                                            <TableCell>{route.status === "down" ? "-" : `${route.responseTime}ms`}</TableCell>
                                            <TableCell>{formatDistanceToNow(route.lastChecked, { addSuffix: true })}</TableCell>
                                            <TableCell>{route.uptime}%</TableCell>
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
                                                        <DropdownMenuItem>Check Now</DropdownMenuItem>
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
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="cards" className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {routes.map((route) => (
                            <Card key={route.id}>
                                <CardHeader className="pb-2">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <CardTitle className="text-lg">{route.name}</CardTitle>
                                            <CardDescription className="font-mono text-xs truncate mt-1">{route.url}</CardDescription>
                                        </div>
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
                                                <DropdownMenuItem>Check Now</DropdownMenuItem>
                                                <DropdownMenuItem>Pause Monitoring</DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem className="text-red-600">Delete Route</DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex justify-between items-center mb-4">
                                        <StatusBadge status={route.status} />
                                        <Chip color="secondary" variant="dot">{route.method}</Chip>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2 text-sm">
                                        <div>
                                            <p className="text-muted-foreground">Response Time</p>
                                            <p className="font-medium">{route.status === "down" ? "-" : `${route.responseTime}ms`}</p>
                                        </div>
                                        <div>
                                            <p className="text-muted-foreground">Uptime</p>
                                            <p className="font-medium">{route.uptime}%</p>
                                        </div>
                                        <div>
                                            <p className="text-muted-foreground">Frequency</p>
                                            <p className="font-medium">{route.frequency} min</p>
                                        </div>
                                        <div>
                                            <p className="text-muted-foreground">Last Checked</p>
                                            <p className="font-medium">{formatDistanceToNow(route.lastChecked, { addSuffix: true })}</p>
                                        </div>
                                    </div>
                                </CardContent>
                                <CardFooter className="pt-0">
                                    <Button variant="outline" size="sm" className="w-full">
                                        View Details
                                    </Button>
                                </CardFooter>
                            </Card>
                        ))}
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    )
}
