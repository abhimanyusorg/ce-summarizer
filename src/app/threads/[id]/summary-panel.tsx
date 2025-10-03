"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Sparkles, ThumbsUp, ThumbsDown, Edit, RefreshCw, ChevronDown, ChevronUp, Save, X } from "lucide-react";

interface SummaryPanelProps {
  threadId: string;
  summary: any | null;
  onSummaryGenerated?: () => void;
}

export function SummaryPanel({ threadId, summary: initialSummary, onSummaryGenerated }: SummaryPanelProps) {
  const [summary, setSummary] = useState(initialSummary);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showConfidenceBreakdown, setShowConfidenceBreakdown] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editForm, setEditForm] = useState({
    summaryText: "",
    keyIssue: "",
    recommendedAction: ""
  });

  const handleGenerate = async (forceRegenerate = false) => {
    setIsGenerating(true);
    setError(null);

    try {
      const response = await fetch("/api/summaries/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ threadId, forceRegenerate }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate summary");
      }

      const data = await response.json();
      setSummary(data.summary);
      onSummaryGenerated?.();
    } catch (err: any) {
      setError(err.message || "Failed to generate summary");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRegenerate = () => {
    handleGenerate(true);
  };

  const handleEdit = () => {
    if (!summary) return;
    setEditForm({
      summaryText: summary.summaryText,
      keyIssue: summary.keyIssue,
      recommendedAction: summary.recommendedAction
    });
    setIsEditing(true);
  };

  const handleSave = async () => {
    if (!summary) return;

    setIsSaving(true);
    setError(null);

    try {
      const response = await fetch(`/api/summaries/${summary.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });

      if (!response.ok) {
        throw new Error("Failed to save summary");
      }

      const data = await response.json();
      setSummary(data.summary);
      setIsEditing(false);
      onSummaryGenerated?.();
    } catch (err: any) {
      setError(err.message || "Failed to save summary");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setError(null);
  };

  const handleApprove = async (status: "approved" | "rejected") => {
    if (!summary) return;

    setIsApproving(true);
    setError(null);

    try {
      const response = await fetch(`/api/summaries/${summary.id}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, userId: "demo-user" }),
      });

      if (!response.ok) {
        throw new Error("Failed to approve summary");
      }

      const data = await response.json();
      setSummary(data.summary);
    } catch (err: any) {
      setError(err.message || "Failed to approve summary");
    } finally {
      setIsApproving(false);
    }
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case "satisfied":
        return "success";
      case "neutral":
        return "secondary";
      case "frustrated":
        return "warning";
      case "angry":
        return "destructive";
      default:
        return "outline";
    }
  };

  const getConfidenceColor = (score: number) => {
    if (score >= 0.8) return "text-green-600";
    if (score >= 0.6) return "text-yellow-600";
    return "text-red-600";
  };

  const ConfidenceBreakdown = ({ summary }: { summary: any }) => {
    const metadata = summary.metadata;
    
    if (!metadata || !metadata.criteriaScores) return null;

    return (
      <div className="mt-3 p-3 bg-gray-50 border rounded-md">
        <button
          onClick={() => setShowConfidenceBreakdown(!showConfidenceBreakdown)}
          className="flex items-center justify-between w-full text-left"
        >
          <h5 className="text-sm font-medium">Confidence Analysis</h5>
          {showConfidenceBreakdown ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </button>
        
        {showConfidenceBreakdown && (
          <div className="mt-3 space-y-3">
            <div className="space-y-2">
              <h6 className="text-xs font-medium text-gray-700">Criteria Breakdown:</h6>
              {Object.entries(metadata.criteriaScores).map(([criteria, score]: [string, any]) => {
                const displayName = criteria.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
                return (
                  <div key={criteria} className="flex justify-between items-center">
                    <span className="text-xs text-gray-600">{displayName}:</span>
                    <div className="flex items-center gap-2">
                      <div className="w-20 bg-gray-200 rounded-full h-1.5">
                        <div 
                          className={`h-1.5 rounded-full ${score >= 0.8 ? 'bg-green-500' : score >= 0.6 ? 'bg-yellow-500' : 'bg-red-500'}`}
                          style={{ width: `${score * 100}%` }}
                        />
                      </div>
                      <span className={`text-xs font-medium ${getConfidenceColor(score)}`}>
                        {Math.round(score * 100)}%
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
            
            {metadata.confidenceReasoning && (
              <div>
                <h6 className="text-xs font-medium text-gray-700 mb-1">Assessment:</h6>
                <p className="text-xs text-gray-600 italic">
                  {metadata.confidenceReasoning}
                </p>
              </div>
            )}
            
            {metadata.confidenceIssues && metadata.confidenceIssues.length > 0 && (
              <div>
                <h6 className="text-xs font-medium text-red-700 mb-1">Issues Found:</h6>
                <ul className="text-xs text-red-600 space-y-1">
                  {metadata.confidenceIssues.map((issue: string, i: number) => (
                    <li key={i} className="flex items-start gap-1">
                      <span className="text-red-500 mt-0.5">•</span>
                      <span>{issue}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            {metadata.confidenceStrengths && metadata.confidenceStrengths.length > 0 && (
              <div>
                <h6 className="text-xs font-medium text-green-700 mb-1">Strengths:</h6>
                <ul className="text-xs text-green-600 space-y-1">
                  {metadata.confidenceStrengths.map((strength: string, i: number) => (
                    <li key={i} className="flex items-start gap-1">
                      <span className="text-green-500 mt-0.5">•</span>
                      <span>{strength}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  if (!summary) {
    return (
      <div className="bg-white border rounded-lg p-6">
        <div className="text-center py-8">
          <Sparkles className="h-12 w-12 mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Summary Yet</h3>
          <p className="text-sm text-gray-500 mb-4">
            Generate an AI-powered summary to help respond to this thread quickly
          </p>
          <Button 
            onClick={() => handleGenerate(false)} 
            disabled={isGenerating}
            className="min-w-[180px]"
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                <span>Generating...</span>
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                <span>Generate Summary</span>
              </>
            )}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border rounded-lg">
      <div className="p-6 border-b">
        {/* Header: Title and Regenerate Button */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-semibold">AI Summary</h3>
            <Button
              onClick={handleRegenerate}
              disabled={isGenerating}
              variant="outline"
              size="sm"
              className="h-8 min-w-[120px]"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                  <span>Regenerating...</span>
                </>
              ) : (
                <>
                  <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
                  <span>Regenerate</span>
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Status Badges */}
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={isGenerating ? "secondary" : getSentimentColor(summary.sentiment)}>
            {summary.sentiment}
          </Badge>
          <Badge variant="outline">
              <>
                Confidence: <span className={getConfidenceColor(summary.confidenceScore)}>
                  {Math.round(summary.confidenceScore * 100)}%
                </span>
              </>
            
          </Badge>
          <Badge variant={isGenerating ? "secondary" : (summary.status === "approved" ? "success" : "warning")}>
            {summary.status}
          </Badge>
        </div>

        {summary.confidenceScore < 0.7 && (
          <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
            <p className="text-sm text-yellow-800">
              ⚠️ Low confidence score - please review carefully before approving
            </p>
            <ConfidenceBreakdown summary={summary} />
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}
      </div>

      <div className="p-6 space-y-4">
        <div>
          <h4 className="text-sm font-medium text-gray-500 mb-1">Summary</h4>
          {isEditing ? (
            <textarea
              value={editForm.summaryText}
              onChange={(e) => setEditForm(prev => ({ ...prev, summaryText: e.target.value }))}
              rows={6}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              style={{ width: '100%' }}
              placeholder="Enter summary text..."
            />
          ) : (
            <p className="text-gray-900">{summary.summaryText}</p>
          )}
        </div>

        <div>
          <h4 className="text-sm font-medium text-gray-500 mb-1">Key Issue</h4>
          {isEditing ? (
            <textarea
              value={editForm.keyIssue}
              onChange={(e) => setEditForm(prev => ({ ...prev, keyIssue: e.target.value }))}
              rows={4}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              style={{ width: '100%' }}
              placeholder="Enter key issue..."
            />
          ) : (
            <p className="text-gray-900">{summary.keyIssue}</p>
          )}
        </div>

        <div>
          <h4 className="text-sm font-medium text-gray-500 mb-1">Recommended Action</h4>
          {isEditing ? (
            <textarea
              value={editForm.recommendedAction}
              onChange={(e) => setEditForm(prev => ({ ...prev, recommendedAction: e.target.value }))}
              rows={4}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              style={{ width: '100%' }}
              placeholder="Enter recommended action..."
            />
          ) : (
            <p className="text-gray-900">{summary.recommendedAction}</p>
          )}
        </div>

        {/* Always show confidence breakdown for detailed insights */}
        <ConfidenceBreakdown summary={summary} />
      </div>

      {summary.status === "pending" && (
        <div className="p-6 border-t bg-gray-50 flex items-center justify-between">
          {isEditing ? (
            <div className="flex gap-2">
              <Button
                onClick={handleSave}
                disabled={isSaving}
                variant="default"
                className="min-w-[100px]"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    <span>Save</span>
                  </>
                )}
              </Button>
              <Button
                onClick={handleCancel}
                disabled={isSaving}
                variant="outline"
                className="min-w-[100px]"
              >
                <X className="h-4 w-4 mr-2" />
                <span>Cancel</span>
              </Button>
            </div>
          ) : (
            <div className="flex gap-2">
              <Button
                onClick={() => handleApprove("approved")}
                disabled={isApproving || isGenerating}
                variant="default"
                className="min-w-[110px]"
              >
                {isApproving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    <span>Approving...</span>
                  </>
                ) : (
                  <>
                    <ThumbsUp className="h-4 w-4 mr-2" />
                    <span>Approve</span>
                  </>
                )}
              </Button>
              <Button
                onClick={() => handleApprove("rejected")}
                disabled={isApproving || isGenerating}
                variant="destructive"
                className="min-w-[100px]"
              >
                {isApproving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    <span>Rejecting...</span>
                  </>
                ) : (
                  <>
                    <ThumbsDown className="h-4 w-4 mr-2" />
                    <span>Reject</span>
                  </>
                )}
              </Button>
            </div>
          )}
          {!isEditing && (
            <Button 
              variant="outline" 
              onClick={handleEdit}
              disabled={isGenerating || isApproving}
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
          )}
        </div>
      )}

      {summary.status === "approved" && (
        <div className="p-4 border-t bg-green-50">
          <p className="text-sm text-green-800 flex items-center">
            <ThumbsUp className="h-4 w-4 mr-2" />
            This summary has been approved
            {summary.approvedAt && ` on ${new Date(summary.approvedAt).toLocaleDateString()}`}
          </p>
        </div>
      )}
    </div>
  );
}
