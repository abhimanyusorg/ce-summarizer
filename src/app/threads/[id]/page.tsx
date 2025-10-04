import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";
import { SummaryPanel } from "./summary-panel";
import { notFound } from "next/navigation";

async function getThread(id: string) {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
    const res = await fetch(`${baseUrl}/api/threads/${id}`, {
      cache: "no-store",
    });

    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export default async function ThreadDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const thread = await getThread(id);

  if (!thread) {
    notFound();
  }

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
                <h1 className="text-2xl font-bold text-gray-900">Thread Details</h1>
                <p className="text-sm text-gray-500">{thread.id}</p>
              </div>
            </div>
            <Link href="/" className="inline-flex items-center px-4 py-2 text-sm font-medium bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors border border-gray-300">
              Back to Dashboard
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Thread Info & Messages */}
          <div className="lg:col-span-2 space-y-6">
            {/* Thread Header */}
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="mb-2">{thread.subject}</CardTitle>
                    <div className="flex items-center gap-2 mb-3">
                      <Badge variant="outline">{thread.status}</Badge>
                      <Badge variant="secondary">{thread.priority}</Badge>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Order ID:</span>
                    <span className="ml-2 font-medium">{thread.orderId}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Product:</span>
                    <span className="ml-2 font-medium">{thread.product}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Topic:</span>
                    <span className="ml-2 font-medium">{thread.topic}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Initiated by:</span>
                    <span className="ml-2 font-medium">{thread.initiatedBy}</span>
                  </div>
                </div>
              </CardHeader>
            </Card>

            {/* Message Timeline */}
            <Card>
              <CardHeader>
                <CardTitle>Message Timeline</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {thread.messages.map((message: any, index: number) => (
                    <div
                      key={message.id}
                      className={`p-4 rounded-lg ${
                        message.sender === "customer"
                          ? "bg-blue-50 border-l-4 border-blue-500"
                          : "bg-gray-50 border-l-4 border-gray-500"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Badge
                            variant={
                              message.sender === "customer" ? "default" : "secondary"
                            }
                          >
                            {message.sender === "customer" ? "Customer" : "Company"}
                          </Badge>
                          <span className="text-sm text-gray-500">
                            Message {index + 1}
                          </span>
                        </div>
                        <span className="text-xs text-gray-500">
                          {formatDate(message.timestamp)}
                        </span>
                      </div>
                      <p className="text-gray-900 whitespace-pre-wrap">{message.body}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Summary Panel */}
          <div className="lg:col-span-1">
            <div className="sticky top-6">
              <SummaryPanel threadId={thread.id} summary={thread.summary} />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
