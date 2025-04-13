import {
    Card,
    CardContent,
    CardFooter,
    CardHeader,
} from "@/components/ui/card";
import { Skeleton } from "@heroui/skeleton";

export const SkeletonRouteCard = () => (
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
);
