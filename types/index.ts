import { SVGProps } from "react";

export type IconSvgProps = SVGProps<SVGSVGElement> & {
    size?: number;
};


export type RouteWithMetrics = {
    id: string;
    name: string;
    url: string;
    method: string;
    status: 'up' | 'down' | 'degraded' | 'Not monitored';
    statusCode?: number;
    responseTime?: number;
    lastChecked: Date | null;
    uptime: string;
    expectedStatusCode: number;
    description?: string;
    isActive: boolean;
    monitoringInterval: number;
};
