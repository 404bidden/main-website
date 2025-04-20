"use client";

import { Edit } from "lucide-react";
import { cloneElement, useCallback, useEffect, useMemo, useState } from "react";

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle
} from "@/components/ui/dialog";
import { RouteWithMetrics } from "@/types";
import { Accordion, AccordionItem } from "@heroui/accordion";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { NumberInput } from "@heroui/number-input";
import { addToast } from "@heroui/toast";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { DropdownMenuItem } from "../ui/dropdown-menu";
import { Label } from "../ui/label";
import { ScrollArea } from "../ui/scroll-area";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "../ui/select";

// Types
interface RouteFormData {
    // Basic Information
    id: string;
    name: string;
    description: string;
    url: string;
    method: string;
    // Request Details
    requestHeaders: string;
    requestBody: string;
    contentType: string;
    // Monitoring Configuration
    expectedStatusCode: number;
    responseTimeThreshold: number;
    monitoringInterval: string;
    retries: number;
    alertEmail: string;
    isActive: boolean;
}

export const EditRouteDialog = ({
    isOpen,
    onOpenChange,
    route,
}: {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    route: RouteWithMetrics;
}) => {
    const queryClient = useQueryClient();

    // Form state
    const [formData, setFormData] = useState<RouteFormData | null>(null);
    const [loading, setLoading] = useState(false);

    // Track touched fields for validation
    const [touchedFields, setTouchedFields] = useState<Record<string, boolean>>(
        {},
    );

    // Fetch route details using React Query
    const { data: routeDetailsQuery, isLoading } = useQuery({
        queryKey: ['route', route.id],
        queryFn: async () => {
            const response = await fetch(`/api/routes/${route.id}`);
            if (!response.ok) {
                throw new Error('Failed to fetch route details');
            }
            return response.json();
        },
        enabled: isOpen && !!route?.id,
    });

    // Set form data when route details are fetched
    useEffect(() => {
        if (routeDetailsQuery && !formData) {
            try {
                // Parse JSON strings from the API response
                let requestHeaders = "{}";
                let requestBody = "";

                try {
                    if (routeDetailsQuery.requestHeaders) {
                        // Store as string for editing
                        requestHeaders = routeDetailsQuery.requestHeaders;
                    }
                } catch (e) {
                    console.error("Error parsing request headers:", e);
                }

                try {
                    if (routeDetailsQuery.requestBody) {
                        // Store as string for editing
                        requestBody = routeDetailsQuery.requestBody;
                    }
                } catch (e) {
                    console.error("Error parsing request body:", e);
                }

                setFormData({
                    id: routeDetailsQuery.id,
                    name: routeDetailsQuery.name || "",
                    description: routeDetailsQuery.description || "",
                    url: routeDetailsQuery.url || "",
                    method: routeDetailsQuery.method || "GET",
                    requestHeaders: requestHeaders,
                    requestBody: requestBody,
                    contentType: "application/json", // Default, could be stored in the DB
                    expectedStatusCode: routeDetailsQuery.expectedStatusCode || 200,
                    responseTimeThreshold: routeDetailsQuery.responseTimeThreshold || 500,
                    monitoringInterval: routeDetailsQuery.monitoringInterval?.toString() || "300",
                    retries: routeDetailsQuery.retries || 3,
                    alertEmail: routeDetailsQuery.alertEmail || "",
                    isActive: routeDetailsQuery.isActive !== undefined ? routeDetailsQuery.isActive : true,
                });
            } catch (error) {
                console.error("Failed to parse route details:", error);
                addToast({
                    title: "Error",
                    description: "Failed to load route details.",
                    color: "danger",
                    variant: "flat",
                });
            }
        }
    }, [routeDetailsQuery, formData]);

    // Reset form data when dialog closes
    useEffect(() => {
        if (!isOpen) {
            setFormData(null);
            setTouchedFields({});
        }
    }, [isOpen]);

    const isValidUrl = (urlString: string): boolean => {
        try {
            if (!urlString.trim()) return false;
            const url = new URL(urlString);
            return url.protocol === "http:" || url.protocol === "https:";
        } catch (e) {
            return false;
        }
    };

    const isValidJson = (jsonString: string): boolean => {
        if (!jsonString.trim()) return true; // Empty is valid
        try {
            JSON.parse(jsonString);
            return true;
        } catch (e) {
            return false;
        }
    };

    // Derived validation states
    const isValidRequestHeaders = useMemo(
        () => formData ? isValidJson(formData.requestHeaders) : true,
        [formData?.requestHeaders],
    );

    const isValidRequestBody = useMemo(() => {
        if (!formData) return true;

        // GET requests should not have a request body
        if (formData.method === "GET" && formData.requestBody.trim() !== "") {
            return false;
        }

        // For JSON content type, validate JSON format
        if (
            formData.contentType === "application/json" &&
            formData.requestBody.trim() !== ""
        ) {
            return isValidJson(formData.requestBody);
        }

        return true;
    }, [formData?.method, formData?.requestBody, formData?.contentType]);

    // Overall form validation
    const isFormValid = useMemo(
        () => formData ? (
            formData.name.trim() !== "" &&
            isValidUrl(formData.url) &&
            formData.method !== "" &&
            formData.expectedStatusCode !== undefined &&
            formData.responseTimeThreshold !== undefined &&
            formData.monitoringInterval !== "" &&
            formData.retries !== undefined &&
            isValidRequestBody &&
            isValidRequestHeaders
        ) : false,
        [formData, isValidRequestBody, isValidRequestHeaders],
    );

    // Event handlers
    const handleChange = (field: string, value: string | number | boolean) => {
        if (!formData) return;

        setFormData((prev) => prev ? ({ ...prev, [field]: value }) : null);
        // Mark the field as touched when user interacts with it
        setTouchedFields((prev) => ({ ...prev, [field]: true }));
    };

    // Submit form to update the route
    const handleSubmit = useCallback(async () => {
        if (!formData) return;

        // Validate form
        if (!isFormValid) {
            let errorMessage =
                "Please fill in all required fields before submitting.";

            if (formData.url.trim() !== "" && !isValidUrl(formData.url)) {
                errorMessage =
                    "Please enter a valid URL (e.g., https://example.com)";
            } else if (
                formData.method === "GET" &&
                formData.requestBody.trim() !== ""
            ) {
                errorMessage = "GET requests cannot have a request body";
            } else if (
                !isValidRequestHeaders &&
                formData.requestHeaders.trim() !== ""
            ) {
                errorMessage = "Request headers must be valid JSON";
            } else if (
                !isValidRequestBody &&
                formData.requestBody.trim() !== "" &&
                formData.contentType === "application/json"
            ) {
                errorMessage =
                    "Request body must be valid JSON for application/json content type";
            }

            addToast({
                title: "Validation Error",
                description: errorMessage,
                color: "danger",
                variant: "flat",
            });
            return;
        }

        try {
            setLoading(true);

            // Prepare request data
            let requestHeaders = {};
            try {
                if (formData.requestHeaders) {
                    requestHeaders = JSON.parse(formData.requestHeaders);
                }
            } catch (e) {
                console.error("Error parsing headers for submission:", e);
            }

            let requestBody = null;
            try {
                if (formData.requestBody && formData.method !== "GET") {
                    requestBody = JSON.parse(formData.requestBody);
                }
            } catch (e) {
                // For non-JSON body, use as-is
                if (formData.requestBody) {
                    requestBody = formData.requestBody;
                }
            }

            // Prepare the request data
            const dataToSend = {
                id: formData.id,
                name: formData.name,
                description: formData.description,
                url: formData.url,
                method: formData.method,
                headers: requestHeaders,
                body: requestBody,
                expectedStatusCode: formData.expectedStatusCode,
                responseTimeThreshold: formData.responseTimeThreshold,
                monitoringInterval: formData.monitoringInterval,
                retries: formData.retries,
                alertEmail: formData.alertEmail,
                isActive: formData.isActive,
                contentType: formData.contentType
            };

            // Send PATCH request to update the route
            const response = await fetch(`/api/routes`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(dataToSend),
            });

            if (response.ok) {
                addToast({
                    title: "Route updated successfully!",
                    description: "Your route has been updated.",
                    color: "success",
                    variant: "flat",
                });

                // Close the dialog
                onOpenChange(false);

                // Refresh routes data
                queryClient.invalidateQueries({ queryKey: ["routes"] });
            } else {
                const errorData = await response.json().catch(() => ({ message: "Unknown error occurred" }));
                addToast({
                    title: "Failed to update route",
                    description: errorData.message || `Error: ${response.status}`,
                    color: "danger",
                    variant: "flat",
                });
            }
        } catch (error) {
            console.error("Error updating route:", error);
            addToast({
                title: "Error",
                description: "An unexpected error occurred while updating the route.",
                color: "danger",
                variant: "flat",
            });
        } finally {
            setLoading(false);
        }
    }, [formData, isFormValid, isValidRequestHeaders, isValidRequestBody, isValidUrl, onOpenChange, queryClient]);

    // Don't render anything if formData is not loaded yet
    if ((isLoading || !formData) && isOpen) {
        return (
            <Dialog open={isOpen} onOpenChange={onOpenChange}>
                <DialogContent className="sm:max-w-[600px]">
                    <DialogHeader>
                        <DialogTitle>Edit Route</DialogTitle>
                        <DialogDescription>
                            Loading route information...
                        </DialogDescription>
                    </DialogHeader>
                </DialogContent>
            </Dialog>
        );
    }

    // Render edit dialog
    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle>Edit Route: {formData?.name}</DialogTitle>
                    <DialogDescription>
                        Modify the details of your route
                    </DialogDescription>
                </DialogHeader>
                <ScrollArea className="max-h-[70vh] pl-4">
                    <div className="py-4 pr-5 space-y-4">
                        {/* Basic Information */}
                        <Accordion
                            variant="splitted"
                            defaultExpandedKeys={["basic-info"]}
                        >
                            <AccordionItem
                                key="basic-info"
                                title={
                                    <h3 className="font-medium mb-3">
                                        Basic Information
                                    </h3>
                                }
                            >
                                <div className="rounded-lg border border-zinc-200 dark:border-zinc-700/50 p-3">
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
                                                value={formData?.name || ""}
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
                                                value={formData?.description || ""}
                                                onValueChange={(value) =>
                                                    handleChange(
                                                        "description",
                                                        value,
                                                    )
                                                }
                                            />
                                        </div>
                                        <div className="grid grid-cols-4 items-center gap-4">
                                            <Label
                                                htmlFor="url"
                                                className="text-right"
                                            >
                                                URL
                                            </Label>
                                            <div className="col-span-3 space-y-1">
                                                <Input
                                                    isRequired
                                                    variant="bordered"
                                                    id="url"
                                                    placeholder="https://api.example.com/auth"
                                                    className="w-full"
                                                    value={formData?.url || ""}
                                                    onValueChange={(value) =>
                                                        handleChange(
                                                            "url",
                                                            value,
                                                        )
                                                    }
                                                    isInvalid={
                                                        touchedFields.url &&
                                                        !isValidUrl(
                                                            formData?.url || "",
                                                        )
                                                    }
                                                    color={
                                                        touchedFields.url &&
                                                            !isValidUrl(
                                                                formData?.url || "",
                                                            )
                                                            ? "danger"
                                                            : undefined
                                                    }
                                                />
                                                {touchedFields.url &&
                                                    !isValidUrl(
                                                        formData?.url || "",
                                                    ) && (
                                                        <p className="text-danger text-xs">
                                                            Please enter a valid
                                                            URL (e.g.,
                                                            https://example.com)
                                                        </p>
                                                    )}
                                            </div>
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
                                                value={formData?.method || "GET"}
                                                onValueChange={(value) =>
                                                    handleChange(
                                                        "method",
                                                        value,
                                                    )
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
                            </AccordionItem>
                            <AccordionItem
                                title={
                                    <h3 className="font-medium mb-3">
                                        Request Details
                                    </h3>
                                }
                            >
                                {/* Request Details */}
                                <div className="rounded-lg border border-zinc-200 dark:border-zinc-700/50 p-3">
                                    <div className="space-y-4">
                                        <div className="grid grid-cols-4 items-center gap-4">
                                            <Label
                                                htmlFor="contentType"
                                                className="text-right"
                                            >
                                                Content Type
                                            </Label>
                                            <Select
                                                value={formData?.contentType || "application/json"}
                                                onValueChange={(value) =>
                                                    handleChange(
                                                        "contentType",
                                                        value,
                                                    )
                                                }
                                            >
                                                <SelectTrigger className="col-span-3">
                                                    <SelectValue placeholder="application/json" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="application/json">
                                                        JSON (application/json)
                                                    </SelectItem>
                                                    <SelectItem value="multipart/form-data">
                                                        Form Data
                                                        (multipart/form-data)
                                                    </SelectItem>
                                                    <SelectItem value="application/x-www-form-urlencoded">
                                                        URL Encoded
                                                        (application/x-www-form-urlencoded)
                                                    </SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="grid grid-cols-4 items-center gap-4">
                                            <Label
                                                htmlFor="requestHeaders"
                                                className="text-right"
                                            >
                                                Request Headers
                                            </Label>
                                            <div className="col-span-3 space-y-1">
                                                <Input
                                                    variant="bordered"
                                                    id="requestHeaders"
                                                    placeholder='{"Content-Type": "application/json"}'
                                                    className="w-full"
                                                    value={formData?.requestHeaders || ""}
                                                    onValueChange={(value) =>
                                                        handleChange(
                                                            "requestHeaders",
                                                            value,
                                                        )
                                                    }
                                                    isInvalid={
                                                        touchedFields.requestHeaders &&
                                                        !isValidRequestHeaders
                                                    }
                                                    color={
                                                        touchedFields.requestHeaders &&
                                                            !isValidRequestHeaders
                                                            ? "danger"
                                                            : undefined
                                                    }
                                                />
                                                {touchedFields.requestHeaders &&
                                                    !isValidRequestHeaders && (
                                                        <p className="text-danger text-xs">
                                                            Headers must be in
                                                            valid JSON format
                                                        </p>
                                                    )}
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-4 items-center gap-4">
                                            <Label
                                                htmlFor="requestBody"
                                                className="text-right"
                                            >
                                                Request Body
                                            </Label>
                                            <div className="col-span-3 space-y-1">
                                                <Input
                                                    variant="bordered"
                                                    id="requestBody"
                                                    placeholder={
                                                        (formData?.contentType || "application/json") === "application/json"
                                                            ? '{"username": "test", "password": "test"}'
                                                            : "username=test&password=test"
                                                    }
                                                    className="w-full"
                                                    value={formData?.requestBody || ""}
                                                    onValueChange={(value) =>
                                                        handleChange(
                                                            "requestBody",
                                                            value,
                                                        )
                                                    }
                                                    isDisabled={
                                                        (formData?.method || "") === "GET"
                                                    }
                                                    isInvalid={
                                                        ((formData?.method || "") === "GET" &&
                                                            (formData?.requestBody || "").trim() !== "") ||
                                                        ((formData?.contentType || "") === "application/json" &&
                                                            (formData?.requestBody || "").trim() !== "" &&
                                                            !isValidJson(formData?.requestBody || ""))
                                                    }
                                                    color={
                                                        ((formData?.method || "") === "GET" &&
                                                            (formData?.requestBody || "").trim() !== "") ||
                                                            ((formData?.contentType || "") === "application/json" &&
                                                                (formData?.requestBody || "").trim() !== "" &&
                                                                !isValidJson(formData?.requestBody || ""))
                                                            ? "danger"
                                                            : undefined
                                                    }
                                                />
                                                {(formData?.method || "") === "GET" &&
                                                    (formData?.requestBody || "").trim() !== "" && (
                                                        <p className="text-danger text-xs">
                                                            GET requests cannot
                                                            have a request body
                                                        </p>
                                                    )}
                                                {(formData?.method || "") === "GET" && (
                                                    <p className="text-default-400 text-xs">
                                                        Request body is disabled
                                                        for GET requests
                                                    </p>
                                                )}
                                                {(formData?.method || "") !== "GET" &&
                                                    (formData?.contentType || "") === "application/json" &&
                                                    (formData?.requestBody || "").trim() !== "" &&
                                                    !isValidJson(formData?.requestBody || "") && (
                                                        <p className="text-danger text-xs">
                                                            Request body must be
                                                            valid JSON
                                                        </p>
                                                    )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </AccordionItem>
                            <AccordionItem
                                title={
                                    <h3 className="font-medium mb-3">
                                        Monitoring Configuration
                                    </h3>
                                }
                            >
                                {/* Monitoring Configuration */}
                                <div className="rounded-lg border border-zinc-200 dark:border-zinc-700/50 p-3">
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
                                                value={formData?.expectedStatusCode}
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
                                                value={formData?.responseTimeThreshold}
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
                                                value={formData?.monitoringInterval || "300"}
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
                                                value={formData?.retries}
                                                onValueChange={(value) =>
                                                    handleChange(
                                                        "retries",
                                                        value,
                                                    )
                                                }
                                            />
                                        </div>
                                        <div className="grid grid-cols-4 items-center gap-4">
                                            <Label
                                                htmlFor="isActive"
                                                className="text-right"
                                            >
                                                Monitoring Status
                                            </Label>
                                            <Select
                                                required
                                                value={formData?.isActive ? "active" : "paused"}
                                                onValueChange={(value) =>
                                                    handleChange(
                                                        "isActive",
                                                        value === "active",
                                                    )
                                                }
                                            >
                                                <SelectTrigger className="col-span-3">
                                                    <SelectValue placeholder="Active" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="active">
                                                        Active
                                                    </SelectItem>
                                                    <SelectItem value="paused">
                                                        Paused
                                                    </SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                </div>
                            </AccordionItem>
                            <AccordionItem
                                title={
                                    <h3 className="font-medium mb-3">
                                        Notifications
                                    </h3>
                                }
                            >
                                {/* Notifications */}
                                <div className="rounded-lg border border-zinc-200 dark:border-zinc-700/50 p-3">
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
                                                value={formData?.alertEmail || ""}
                                                onValueChange={(value) =>
                                                    handleChange(
                                                        "alertEmail",
                                                        value,
                                                    )
                                                }
                                            />
                                        </div>
                                    </div>
                                </div>
                            </AccordionItem>
                        </Accordion>
                    </div>
                </ScrollArea>
                <DialogFooter>
                    <Button
                        variant="bordered"
                        onPress={() => onOpenChange(false)}
                    >
                        Cancel
                    </Button>
                    <Button
                        onPress={handleSubmit}
                        isDisabled={!isFormValid || loading}
                        isLoading={loading}
                    >
                        Save Changes
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

// Simple button component to trigger the edit dialog
export const EditRouteButton = ({
    route,
    children
}: {
    route: RouteWithMetrics;
    children?: React.ReactNode;
}) => {
    const [isOpen, setIsOpen] = useState(false);

    // Prevent event propagation to avoid dropdown menu closing affecting the dialog
    const handleClick = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsOpen(true);
    };

    // Default trigger element is a DropdownMenuItem with stopPropagation
    const DefaultTrigger = (
        <DropdownMenuItem onSelect={(e) => {
            // Prevent the dropdown from closing the dialog
            e.preventDefault();
            setIsOpen(true);
        }}>
            <Edit className="h-4 w-4 mr-2" />
            Edit Route
        </DropdownMenuItem>
    );

    // If children are provided, clone them with the onClick handler with stopPropagation
    const triggerElement = children
        ? cloneElement(children as React.ReactElement, {
            onClick: handleClick
        })
        : DefaultTrigger;

    return (
        <>
            {triggerElement}

            <EditRouteDialog
                isOpen={isOpen}
                onOpenChange={setIsOpen}
                route={route}
            />
        </>
    );
};