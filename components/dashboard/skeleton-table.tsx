import { Skeleton } from "@heroui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

interface TableSkeletonProps {
    rowCount?: number
    columnCount?: number
}

export function TableSkeleton({ rowCount = 5 }: TableSkeletonProps) {
    return (
        <Table>
            <TableHeader>
                <TableRow className="rounded-lg overflow-hidden">
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
                {Array(rowCount)
                    .fill(0)
                    .map((_, rowIndex) => (
                        <TableRow key={rowIndex} className="animate-pulse rounded-lg overflow-hidden">
                            <TableCell>
                                <Skeleton className="h-5 w-24 rounded-md" />
                            </TableCell>
                            <TableCell className="font-mono">
                                <Skeleton className="h-4 w-40 rounded-md" />
                            </TableCell>
                            <TableCell>
                                <Skeleton className="h-6 w-16 rounded-full" />
                            </TableCell>
                            <TableCell>
                                <Skeleton className="h-6 w-20 rounded-full" />
                            </TableCell>
                            <TableCell>
                                <Skeleton className="h-4 w-12 rounded-md" />
                            </TableCell>
                            <TableCell>
                                <Skeleton className="h-4 w-28 rounded-md" />
                            </TableCell>
                            <TableCell>
                                <Skeleton className="h-4 w-16 rounded-md" />
                            </TableCell>
                            <TableCell className="text-right">
                                <div className="flex justify-end">
                                    <Skeleton className="h-8 w-8 rounded-full" />
                                </div>
                            </TableCell>
                        </TableRow>
                    ))}
            </TableBody>
        </Table>
    )
}
