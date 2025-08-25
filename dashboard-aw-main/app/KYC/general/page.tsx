"use client"
import { SidebarProvider } from "@/components/ui/sidebar";
import { NavBar } from "@/components/components/NavBar";
import { SideBar } from "@/components/components/SideBar";
import { useEffect, useState, Suspense } from "react";
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { useRouter } from 'next/navigation'
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"

const FormSchema = z.object({
    keyword: z.string().nonempty("Keyword is required"),
    lname: z.string().optional(),
    fname: z.string().optional(),
    location: z.string().optional(),
    title: z.string().optional(),
    company: z.string().optional(),
    dateRange: z.enum(['day', 'month', 'year']).optional(),
    website: z.enum(['none','linkedin.com', 'facebook.com', 'twitter.com', 'instagram.com']).optional(),
})

const defaultValues = {
    keyword: "",
    lname: "",
    fname: "",
    location: "",
    title: "",
    company: "",
    dateRange: undefined,
    website: undefined,
}

function KYCFormContent() {
    const router = useRouter()
    const [sideMenu, setSideMenu] = useState<any[]>([])
    const form = useForm<z.infer<typeof FormSchema>>({
        resolver: zodResolver(FormSchema),
        defaultValues,
    })

    function onSubmit(data: z.infer<typeof FormSchema>) {
        let searchQuery = data.keyword;
        if (data.fname) searchQuery += ` "${data.fname}"`;
        if (data.lname) searchQuery += ` "${data.lname}"`;
        if (data.location) searchQuery += ` "${data.location}"`;
        if (data.title) searchQuery += ` "${data.title}"`;
        if (data.company) searchQuery += ` "${data.company}"`;
        if (data.website && data.website != "none") searchQuery += ` site:${data.website}`;

        router.push(`/KYC/general/${searchQuery}`);
    }

    return (
        <SidebarProvider defaultOpen>
            <SideBar title="General KYC" key={sideMenu.length} />
            <div className="p-3 flex-1">
                <NavBar />

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="mx-32 flex flex-col gap-6 items-center p-2">
                        <FormField
                            control={form.control}
                            name="keyword"
                            render={({ field }) => (
                                <FormItem className="w-full">
                                    <FormLabel>Keyword</FormLabel>
                                    <FormControl>
                                        <Input className="h-[60px]" {...field} placeholder="Keyword..." />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <div className="flex gap-2 w-full">
                            <FormField
                                control={form.control}
                                name="fname"
                                render={({ field }) => (
                                    <FormItem className="w-full">
                                        <FormLabel>First Name (Optional)</FormLabel>
                                        <FormControl>
                                            <Input {...field} placeholder="(Optional) First Name..." />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="lname"
                                render={({ field }) => (
                                    <FormItem className="w-full">
                                        <FormLabel>Last Name (Optional)</FormLabel>
                                        <FormControl>
                                            <Input {...field} placeholder="(Optional) Last Name..." />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                        <div className="flex gap-2 w-full">
                            <FormField
                                control={form.control}
                                name="location"
                                render={({ field }) => (
                                    <FormItem className="w-full">
                                        <FormLabel>Location (Optional)</FormLabel>
                                        <FormControl>
                                            <Input {...field} placeholder="(Optional) Location..." />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="title"
                                render={({ field }) => (
                                    <FormItem className="w-full">
                                        <FormLabel>Job Title (Optional)</FormLabel>
                                        <FormControl>
                                            <Input {...field} placeholder="(Optional) Job Title..." />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="company"
                                render={({ field }) => (
                                    <FormItem className="w-full">
                                        <FormLabel>Company Name (Optional)</FormLabel>
                                        <FormControl>
                                            <Input {...field} placeholder="(Optional) Company Name..." />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                        </div>
                        <div className="flex gap-2 w-full">
                            <FormField
                                control={form.control}
                                name="dateRange"
                                render={({ field }) => (
                                    <FormItem className="w-full">
                                        <FormLabel>Date Range (Optional)</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select Date Range (Optional)" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="day">Day</SelectItem>
                                                <SelectItem value="month">Month</SelectItem>
                                                <SelectItem value="year">Year</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="website"
                                render={({ field }) => (
                                    <FormItem className="w-full">
                                        <FormLabel>Website (Optional)</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select Website (Optional)" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="none">None</SelectItem>
                                                <SelectItem value="linkedin.com">LinkedIn</SelectItem>
                                                <SelectItem value="facebook.com">Facebook</SelectItem>
                                                <SelectItem value="twitter.com">Twitter</SelectItem>
                                                <SelectItem value="instagram.com">Instagram</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                        <button type="submit" className="min-w-[50px] w-full m-2 p-2 rounded-md bg-gray-100 hover:bg-gray-200 border border-slate-200">
                            Enter
                        </button>
                    </form>
                </Form>
            </div>
        </SidebarProvider>
    )
}

export default function KYCForm() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <KYCFormContent />
        </Suspense>
    );
}

