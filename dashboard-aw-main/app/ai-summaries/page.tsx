"use client"
import { Suspense } from "react";
import { AISummariesDashboard } from "@/components/components/AISummariesDashboard";
import { SideBar } from "@/components/components/SideBar";
import { NavBar } from "@/components/components/NavBar";

export default function AISummariesPage() {
    return (
        <div className="sidebar-layout bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
            <SideBar />
            <div className="sidebar-content flex flex-col">
                <Suspense fallback={<div className="h-16 bg-gray-100 animate-pulse rounded-lg"></div>}>
                    <NavBar />
                </Suspense>
                
                <main className="main-content content-area force-full-width">
                    {/* Page Header */}
                    <div className="px-6 py-4 border-b border-gray-200/50 bg-white/80 backdrop-blur-md">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg">
                                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">AI Summaries Dashboard</h1>
                                <p className="text-gray-600">AI-powered news insights and sentiment analysis</p>
                            </div>
                        </div>
                    </div>

                    {/* Main Content */}
                    <div className="p-6">
                        <AISummariesDashboard />
                    </div>
                </main>
            </div>
        </div>
    );
}
