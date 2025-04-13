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
import { MoreHorizontal } from "lucide-react";

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
                            {route.status === "down" || !route.responseTime
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
                                    <DropdownMenuItem>
                                        View Details
                                    </DropdownMenuItem>
                                    <DropdownMenuItem>
                                        Edit Route
                                    </DropdownMenuItem>
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
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    );
};
