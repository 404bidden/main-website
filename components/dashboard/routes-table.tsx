import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { RouteWithMetrics } from "@/types";
import { Button } from "@heroui/button";
import { Chip } from "@heroui/chip";
import { addToast } from "@heroui/toast";
import { useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { FileText, LucidePauseCircle, MoreHorizontal, PauseCircle, RefreshCw, Trash2Icon } from "lucide-react";
import { useRouter } from "next/navigation";
import { EditRouteButton } from "./edit-route-dialog";

export function StatusBadge({ status }: { status: string }) {
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
export const RoutesTable = ({ routes }: { routes: RouteWithMetrics[] }) => {
    const queryClient = useQueryClient();
    const router = useRouter()
    return (
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
                        <TableCell className="font-medium">
                            {route.name}
                        </TableCell>
                        <TableCell className="font-mono text-sm truncate max-w-[200px]">
                            {route.url}
                        </TableCell>
                        <TableCell>
                            <Chip color="secondary" variant="dot">
                                {route.method}
                            </Chip>
                        </TableCell>
                        <TableCell>
                            <StatusBadge status={route.status} />
                        </TableCell>
                        <TableCell>
                            {route.responseTime === undefined ||
                                route.responseTime === null
                                ? "-"
                                : `${route.responseTime}ms`}
                        </TableCell>
                        <TableCell>
                            {route.lastChecked
                                ? formatDistanceToNow(route.lastChecked, {
                                    addSuffix: true,
                                })
                                : "Never checked"}
                        </TableCell>
                        <TableCell>{route.uptime}</TableCell>
                        <TableCell className="text-right">
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
                                    <DropdownMenuItem>
                                        <PauseCircle className="mr-2 h-4 w-4" />
                                        Pause Monitoring
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
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    );
};
