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

export const CreateRouteDialog = ({
    isOpen,
    onOpenChange,
}: {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
}) => {
    const queryClient = useQueryClient();
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

    // Check if all required fields have values
    const isFormValid = useMemo(() => {
        return (
            formData.name.trim() !== "" &&
            formData.url.trim() !== "" &&
            formData.method !== "" &&
            formData.expectedStatusCode !== undefined &&
            formData.responseTimeThreshold !== undefined &&
            formData.monitoringInterval !== "" &&
            formData.retries !== undefined
        );
    }, [formData]);

    const handleChange = (field: string, value: string | number) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
    };
    const handleSubmit = useCallback(async () => {
        if (!isFormValid) {
            addToast({
                title: "Missing required fields",
                description: "Please fill in all required fields before submitting.",
                color: "danger",
                variant: "flat",
            });
            return;
        }

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
            queryClient.invalidateQueries({
                queryKey: ["routes"],
            });
        }
    }, [formData, queryClient, isFormValid]);

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
                        <Accordion variant="splitted" defaultExpandedKeys={
                            ["basic-info"]
                        }>
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
                                                    handleChange(
                                                        "requestBody",
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
