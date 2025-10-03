"use client";

import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatRelativeTime } from "@/lib/utils";
import { FileText, Clock, CheckCircle, AlertCircle, RotateCcw } from "lucide-react";
import { useEffect, useState } from "react";

export default function Home() {
  const [isResetting, setIsResetting] = useState(false);
  const [threads, setThreads] = useState([]);
  const [analytics, setAnalytics] = useState<{
    totalThreads: number;
    summarizedThreads: number;
    pendingApproval: number;
    approvedSummaries: number;
  } | null>(null);

  const fetchData = async () => {
    try {
      const [threadsRes, analyticsRes] = await Promise.all([
        fetch("/api/threads"),
        fetch("/api/analytics/overview")
      ]);

      if (threadsRes.ok) {
        const threadsData = await threadsRes.json();
        setThreads(threadsData.threads || []);
      }

      if (analyticsRes.ok) {
        const analyticsData = await analyticsRes.json();
        setAnalytics(analyticsData);
      }
    } catch (error) {
      console.error("Failed to fetch data:", error);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleResetData = async () => {
    if (!confirm("Are you sure you want to reset all data? This action cannot be undone.")) {
      return;
    }

    setIsResetting(true);
    try {
      const res = await fetch("/api/reset", {
        method: "POST",
      });

      if (!res.ok) {
        throw new Error("Failed to reset data");
      }

      // Refetch data to update the UI without page refresh
      await fetchData();
      alert("Data reset and reseeded successfully!");
    } catch (error) {
      alert("Failed to reset data. Please try again.");
      console.error("Reset error:", error);
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">CE Email Summarization</h1>
              <p className="text-sm text-gray-500">Customer Experience Thread Management</p>
            </div>
            <div className="flex items-center space-x-4">
              <Link target="_blank" href="/analytics" className="inline-flex items-center px-4 py-2 text-sm font-medium bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors border border-gray-300 mr-2">
                Analytics
              </Link>
              <Link target="_blank"  href="/docs" className="inline-flex items-center px-4 py-2 text-sm font-medium bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors border border-blue-300 mr-2">
                API Docs
              </Link>
              <Link target="_blank" href="/about" className="inline-flex items-center px-4 py-2 text-sm font-medium bg-green-100 text-green-700 rounded-md hover:bg-green-200 transition-colors border border-green-300">
                About Project
              </Link>
              <button
                onClick={handleResetData}
                disabled={isResetting}
                className="inline-flex ml-2 items-center px-4 py-2 text-sm font-medium bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-colors border border-red-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                {isResetting ? "Resetting..." : "Reset Data"}
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {analytics && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Threads</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics.totalThreads}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Summarized</CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics.summarizedThreads}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending Approval</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics.pendingApproval}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Approved</CardTitle>
                <AlertCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics.approvedSummaries}</div>
              </CardContent>
            </Card>
          </div>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Email Threads</CardTitle>
            <CardDescription>
              Manage customer service email threads and generate AI summaries
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {threads.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>No threads found.</p>
                </div>
              ) : (
                threads.map((thread: any) => (
                  <Link
                    key={thread.id}
                    href={`/threads/${thread.id}`}
                    className="block p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-gray-900">{thread.subject}</h3>
                          <Badge variant="outline">{thread.status}</Badge>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{thread.topic}</p>
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span>Order: {thread.orderId}</span>
                          <span>Product: {thread.product}</span>
                          <span>{formatRelativeTime(thread.createdAt)}</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
