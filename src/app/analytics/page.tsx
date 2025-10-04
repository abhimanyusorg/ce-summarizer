import Link from "next/link";
import { ArrowLeft, TrendingUp, Clock, ThumbsUp, Sparkles } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

async function getAnalytics() {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
    const res = await fetch(`${baseUrl}/api/analytics/overview`, {
      cache: "no-store",
    });

    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export default async function AnalyticsPage() {
  const analytics = await getAnalytics();

  if (!analytics) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500">Failed to load analytics</p>
        </div>
      </div>
    );
  }

  const coveragePercentage = analytics.totalThreads > 0
    ? Math.round((analytics.summarizedThreads / analytics.totalThreads) * 100)
    : 0;

  const approvalRate = analytics.summarizedThreads > 0
    ? Math.round((analytics.approvedSummaries / analytics.summarizedThreads) * 100)
    : 0;

  // Calculate time savings
  const avgTimePerThread = 5.5; // minutes saved per thread
  const totalTimeSaved = analytics.summarizedThreads * avgTimePerThread;
  const hoursSaved = Math.floor(totalTimeSaved / 60);
  const minutesSaved = Math.round(totalTimeSaved % 60);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href="/"
                className="p-2 hover:bg-gray-100 rounded-md transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h1>
                <p className="text-sm text-gray-500">Performance Metrics & Insights</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Threads</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{analytics.totalThreads}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Customer service emails
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Coverage</CardTitle>
              <Sparkles className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{coveragePercentage}%</div>
              <p className="text-xs text-muted-foreground mt-1">
                {analytics.summarizedThreads} of {analytics.totalThreads} threads
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Approval Rate</CardTitle>
              <ThumbsUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{approvalRate}%</div>
              <p className="text-xs text-muted-foreground mt-1">
                {analytics.approvedSummaries} approved
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Time Saved</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {hoursSaved}h {minutesSaved}m
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                ~{avgTimePerThread} min per thread
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Sentiment Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Sentiment Distribution</CardTitle>
              <CardDescription>
                Emotional tone detected in customer threads
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(analytics.sentimentBreakdown || {}).map(([sentiment, count]) => {
                  const percentage = analytics.summarizedThreads > 0
                    ? Math.round(((count as number) / analytics.summarizedThreads) * 100)
                    : 0;

                  const variantMap: Record<string, any> = {
                    satisfied: "success",
                    neutral: "secondary",
                    frustrated: "warning",
                    angry: "destructive",
                  };

                  return (
                    <div key={sentiment}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Badge variant={variantMap[sentiment] || "outline"}>
                            {sentiment}
                          </Badge>
                          <span className="text-sm text-gray-600">{count as number} threads</span>
                        </div>
                        <span className="text-sm font-medium">{percentage}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${
                            sentiment === "satisfied"
                              ? "bg-green-500"
                              : sentiment === "neutral"
                              ? "bg-gray-400"
                              : sentiment === "frustrated"
                              ? "bg-yellow-500"
                              : "bg-red-500"
                          }`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>ROI & Impact</CardTitle>
              <CardDescription>
                Estimated business value and efficiency gains
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-2">Time Efficiency</h4>
                  <div className="text-2xl font-bold text-green-600">68% faster</div>
                  <p className="text-sm text-gray-600 mt-1">
                    From 8 min to 2.5 min average per thread
                  </p>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-2">Processing Time</h4>
                  <div className="text-2xl font-bold">{analytics.avgProcessingTime}s</div>
                  <p className="text-sm text-gray-600 mt-1">
                    Average AI summary generation time
                  </p>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-2">Monthly Projection</h4>
                  <p className="text-sm text-gray-600">
                    At current rate: <strong>{analytics.summarizedThreads * 30} threads/month</strong>
                  </p>
                  <p className="text-sm text-gray-600">
                    Time saved: <strong>~{Math.round(totalTimeSaved * 30 / 60)} hours/month</strong>
                  </p>
                </div>

                <div className="pt-4 border-t">
                  <h4 className="text-sm font-medium text-gray-500 mb-2">Estimated Annual Savings</h4>
                  <div className="text-3xl font-bold text-green-600">
                    ${Math.round((totalTimeSaved * 30 * 12 / 60) * 20).toLocaleString()}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Based on $20/hr associate rate
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Additional Metrics */}
        <Card>
          <CardHeader>
            <CardTitle>Quality Metrics</CardTitle>
            <CardDescription>
              Summary quality and human oversight indicators
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <h4 className="text-sm font-medium text-gray-500 mb-2">Pending Review</h4>
                <div className="text-3xl font-bold">{analytics.pendingApproval}</div>
                <p className="text-sm text-gray-600 mt-1">
                  Awaiting human approval
                </p>
              </div>

              <div>
                <h4 className="text-sm font-medium text-gray-500 mb-2">Edit Rate</h4>
                <div className="text-3xl font-bold">{Math.round(analytics.avgEditRate * 100)}%</div>
                <p className="text-sm text-gray-600 mt-1">
                  Summaries edited before approval
                </p>
              </div>

              <div>
                <h4 className="text-sm font-medium text-gray-500 mb-2">Quality Score</h4>
                <div className="text-3xl font-bold text-green-600">
                  {approvalRate >= 90 ? "Excellent" : approvalRate >= 75 ? "Good" : "Fair"}
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  Based on approval rate
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
