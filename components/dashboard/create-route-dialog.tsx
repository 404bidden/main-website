"use client";

import { Plus } from "lucide-react";
import { useCallback, useMemo, useState } from "react";

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Accordion, AccordionItem } from "@heroui/accordion";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { NumberInput } from "@heroui/number-input";
import { addToast } from "@heroui/toast";
import { useQueryClient } from "@tanstack/react-query";
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
}

export const CreateRouteDialog = ({
    isOpen,
    onOpenChange,
}: {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
}) => {
    const queryClient = useQueryClient();

    // Form state
    const [formData, setFormData] = useState<RouteFormData>({
        // Basic Information
        name: "",
        description: "",
        url: "",
        method: "GET",
        // Request Details
        requestHeaders: "",
        requestBody: "",
        contentType: "application/json", // Default content type
        // Monitoring Configuration
        expectedStatusCode: 200,
        responseTimeThreshold: 500,
        monitoringInterval: "300",
        retries: 3,
        alertEmail: "",
    });

    // Track touched fields for validation
    const [touchedFields, setTouchedFields] = useState<Record<string, boolean>>({});

    // Validation functions
    const isValidUrl = (urlString: string): boolean => {
        try {
            if (!urlString.trim()) return false;
            const url = new URL(urlString);
            return url.protocol === 'http:' || url.protocol === 'https:';
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
    const isValidRequestHeaders = useMemo(() =>
        isValidJson(formData.requestHeaders),
        [formData.requestHeaders]);

    const isValidRequestBody = useMemo(() => {
        // GET requests should not have a request body
        if (formData.method === "GET" && formData.requestBody.trim() !== "") {
            return false;
        }

        // For JSON content type, validate JSON format
        if (formData.contentType === "application/json" && formData.requestBody.trim() !== "") {
            return isValidJson(formData.requestBody);
        }

        return true;
    }, [formData.method, formData.requestBody, formData.contentType]);

    // Overall form validation
    const isFormValid = useMemo(() => (
        formData.name.trim() !== "" &&
        isValidUrl(formData.url) &&
        formData.method !== "" &&
        formData.expectedStatusCode !== undefined &&
        formData.responseTimeThreshold !== undefined &&
        formData.monitoringInterval !== "" &&
        formData.retries !== undefined &&
        isValidRequestBody &&
        isValidRequestHeaders
    ), [formData, isValidRequestBody, isValidRequestHeaders]);

    // Event handlers
    const handleChange = (field: string, value: string | number) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
        // Mark the field as touched when user interacts with it
        setTouchedFields((prev) => ({ ...prev, [field]: true }));
    };

    // Function to test the API call before adding the route
    const testApiCall = useCallback(async () => {
        if (!isValidUrl(formData.url)) {
            addToast({
                title: "Invalid URL",
                description: "Please enter a valid URL before testing.",
                color: "danger",
                variant: "flat",
            });
            return;
        }

        try {
            addToast({
                title: "Testing Connection",
                description: "Making a test request to your API endpoint...",
                color: "primary",
                variant: "flat",
            });

            // Prepare headers
            let headers: Record<string, string> = {};
            if (formData.requestHeaders) {
                try {
                    headers = JSON.parse(formData.requestHeaders);
                } catch (e) {
                    addToast({
                        title: "Invalid Headers",
                        description: "Please provide valid JSON for headers.",
                        color: "danger",
                        variant: "flat",
                    });
                    return;
                }
            }

            // Set content type header based on selected content type
            if (formData.method !== "GET") {
                headers["Content-Type"] = formData.contentType;
            }

            // Prepare request options
            let requestOptions: RequestInit = {
                method: formData.method,
                headers,
                redirect: "follow",
            };

            // Add body for non-GET requests if provided
            if (formData.method !== "GET" && formData.requestBody.trim() !== "") {
                if (formData.contentType === "application/json") {
                    try {
                        const parsedBody = JSON.parse(formData.requestBody);
                        requestOptions.body = JSON.stringify(parsedBody);
                    } catch (e) {
                        addToast({
                            title: "Invalid Request Body",
                            description: "Please provide valid JSON for request body.",
                            color: "danger",
                            variant: "flat",
                        });
                        return;
                    }
                } else {
                    requestOptions.body = formData.requestBody;
                }
            }

            // Make the test request and measure response time
            const startTime = Date.now();
            const response = await fetch(formData.url, requestOptions);
            const responseTime = Date.now() - startTime;

            // Evaluate success criteria
            const success = response.status === formData.expectedStatusCode;
            const timeWithinThreshold = responseTime <= formData.responseTimeThreshold;

            // Show test results
            addToast({
                title: success ? "Test Successful" : "Test Failed",
                description: `Status: ${response.status} (${success ? "✓" : "✗"}) | Response time: ${responseTime}ms (${timeWithinThreshold ? "✓" : "✗"})`,
                color: success && timeWithinThreshold ? "success" : "warning",
                variant: "flat",
            });
        } catch (error) {
            console.error("Test API call failed:", error);
            addToast({
                title: "Connection Failed",
                description: "Could not connect to the specified endpoint. Please check URL and network connection.",
                color: "danger",
                variant: "flat",
            });
        }
    }, [formData, isValidUrl]);

    // Submit form to create a new route
    const handleSubmit = useCallback(async () => {
        // Validate form
        if (!isFormValid) {
            let errorMessage = "Please fill in all required fields before submitting.";

            if (formData.url.trim() !== "" && !isValidUrl(formData.url)) {
                errorMessage = "Please enter a valid URL (e.g., https://example.com)";
            } else if (formData.method === "GET" && formData.requestBody.trim() !== "") {
                errorMessage = "GET requests cannot have a request body";
            } else if (!isValidRequestHeaders && formData.requestHeaders.trim() !== "") {
                errorMessage = "Request headers must be valid JSON";
            } else if (!isValidRequestBody && formData.requestBody.trim() !== "" && formData.contentType === "application/json") {
                errorMessage = "Request body must be valid JSON for application/json content type";
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
            // Prepare request body based on content type
            let requestBody;

            if (formData.contentType === "application/json") {
                // For JSON, send as stringified JSON
                const dataToSend = {
                    ...formData,
                    headers: formData.requestHeaders ? JSON.parse(formData.requestHeaders) : {},
                    body: formData.requestBody ? JSON.parse(formData.requestBody) : null,
                };
                requestBody = JSON.stringify(dataToSend);
            } else if (formData.contentType === "multipart/form-data") {
                // For form data, create a FormData object
                const formDataObj = new FormData();
                Object.entries(formData).forEach(([key, value]) => {
                    if (key !== 'requestBody' && key !== 'requestHeaders') {
                        formDataObj.append(key, String(value));
                    }
                });

                // Handle request headers (still as JSON)
                if (formData.requestHeaders) {
                    formDataObj.append('headers', formData.requestHeaders);
                }

                // Handle request body based on content (if it's form data format)
                if (formData.requestBody && formData.method !== "GET") {
                    try {
                        // Try to parse as JSON in case it's a structured object
                        const bodyObj = JSON.parse(formData.requestBody);
                        // Add each field of the parsed JSON as a form field
                        Object.entries(bodyObj).forEach(([key, value]) => {
                            formDataObj.append(key, String(value));
                        });
                    } catch (e) {
                        // If not valid JSON, add as a single body field
                        formDataObj.append('body', formData.requestBody);
                    }
                }

                requestBody = formDataObj;
            } else {
                // Default to JSON for other content types
                requestBody = JSON.stringify(formData);
            }

            // Submit the form data to create the route
            const response = await fetch("/api/routes", {
                method: "POST",
                body: requestBody,
                headers: formData.contentType === "application/json"
                    ? { "Content-Type": "application/json" }
                    : {} // No Content-Type for FormData, browser sets it with boundary
            });

            // Handle response
            if (response.ok) {
                addToast({
                    title: "Successfully created route!",
                    description: "Your route has been successfully created.",
                    color: "success",
                    variant: "flat",
                });
                onOpenChange(false);
                queryClient.invalidateQueries({
                    queryKey: ["routes"],
                });
            } else {
                const errorData = await response.json().catch(() => ({ message: "Unknown error occurred" }));
                addToast({
                    title: "Failed to create route",
                    description: errorData.message || `Error: ${response.status}`,
                    color: "danger",
                    variant: "flat",
                });
            }
        } catch (error) {
            console.error("Error submitting form:", error);
            addToast({
                title: "Error",
                description: "An unexpected error occurred while submitting the form.",
                color: "danger",
                variant: "flat",
            });
        }
    }, [formData, queryClient, isFormValid, isValidRequestHeaders, isValidRequestBody, isValidUrl, onOpenChange]);

    // Render component
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
                        <Accordion variant="splitted" defaultExpandedKeys={["basic-info"]}>
                            <AccordionItem key="basic-info" title={
                                <h3 className="font-medium mb-3">
                                    Basic Information
                                </h3>
                            }>
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
                                                    value={formData.url}
                                                    onValueChange={(value) =>
                                                        handleChange("url", value)
                                                    }
                                                    isInvalid={touchedFields.url && !isValidUrl(formData.url)}
                                                    color={touchedFields.url && !isValidUrl(formData.url) ? "danger" : undefined}
                                                />
                                                {touchedFields.url && !isValidUrl(formData.url) && (
                                                    <p className="text-danger text-xs">Please enter a valid URL (e.g., https://example.com)</p>
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
                                                value={formData.method}
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
                            <AccordionItem title={
                                <h3 className="font-medium mb-3">
                                    Request Details
                                </h3>
                            }>
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
                                                value={formData.contentType}
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
                                                        Form Data (multipart/form-data)
                                                    </SelectItem>
                                                    <SelectItem value="application/x-www-form-urlencoded">
                                                        URL Encoded (application/x-www-form-urlencoded)
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
                                                    value={formData.requestHeaders}
                                                    onValueChange={(value) =>
                                                        handleChange(
                                                            "requestHeaders",
                                                            value,
                                                        )
                                                    }
                                                    isInvalid={touchedFields.requestHeaders && !isValidRequestHeaders}
                                                    color={touchedFields.requestHeaders && !isValidRequestHeaders ? "danger" : undefined}
                                                />
                                                {touchedFields.requestHeaders && !isValidRequestHeaders && (
                                                    <p className="text-danger text-xs">Headers must be in valid JSON format</p>
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
                                                    placeholder={formData.contentType === "application/json" ?
                                                        '{"username": "test", "password": "test"}' :
                                                        'username=test&password=test'}
                                                    className="w-full"
                                                    value={formData.requestBody}
                                                    onValueChange={(value) =>
                                                        handleChange(
                                                            "requestBody",
                                                            value,
                                                        )
                                                    }
                                                    isDisabled={formData.method === "GET"}
                                                    isInvalid={(formData.method === "GET" && formData.requestBody.trim() !== "") ||
                                                        (formData.contentType === "application/json" &&
                                                            formData.requestBody.trim() !== "" &&
                                                            !isValidJson(formData.requestBody))}
                                                    color={(formData.method === "GET" && formData.requestBody.trim() !== "") ||
                                                        (formData.contentType === "application/json" &&
                                                            formData.requestBody.trim() !== "" &&
                                                            !isValidJson(formData.requestBody)) ? "danger" : undefined}
                                                />
                                                {formData.method === "GET" && formData.requestBody.trim() !== "" && (
                                                    <p className="text-danger text-xs">GET requests cannot have a request body</p>
                                                )}
                                                {formData.method === "GET" && (
                                                    <p className="text-default-400 text-xs">Request body is disabled for GET requests</p>
                                                )}
                                                {formData.method !== "GET" && formData.contentType === "application/json" &&
                                                    formData.requestBody.trim() !== "" && !isValidJson(formData.requestBody) && (
                                                        <p className="text-danger text-xs">Request body must be valid JSON</p>
                                                    )}
                                                {formData.method !== "GET" && formData.contentType === "multipart/form-data" && (
                                                    <p className="text-default-400 text-xs">
                                                        For form data, you can enter key-value pairs in JSON format or plain text
                                                    </p>
                                                )}
                                                {formData.method !== "GET" && formData.contentType === "application/x-www-form-urlencoded" && (
                                                    <p className="text-default-400 text-xs">
                                                        For URL encoded data, use format: key1=value1&key2=value2
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </AccordionItem>
                            <AccordionItem title={
                                <h3 className="font-medium mb-3">
                                    Monitoring Configuration
                                </h3>
                            }>
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
                                                value={
                                                    formData.expectedStatusCode
                                                }
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
                                                value={
                                                    formData.responseTimeThreshold
                                                }
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
                                                value={
                                                    formData.monitoringInterval
                                                }
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
                                                    handleChange(
                                                        "retries",
                                                        value,
                                                    )
                                                }
                                            />
                                        </div>
                                    </div>
                                </div>
                            </AccordionItem>
                            <AccordionItem title={
                                <h3 className="font-medium mb-3">
                                    Notifications
                                </h3>
                            }>
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
                                                value={formData.alertEmail}
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
                        variant="bordered"
                        color="secondary"
                        onPress={testApiCall}
                        isDisabled={!isValidUrl(formData.url)}
                    >
                        Test API
                    </Button>
                    <Button
                        onPress={handleSubmit}
                        isDisabled={!isFormValid}
                    >
                        Add Route
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
