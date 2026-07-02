import React, { useState } from "react";
import ReactMarkdown from "react-markdown";
import { ChevronDown, ChevronRight, CheckCircle2, XCircle, Loader2, Wrench } from "lucide-react";

const statusMap = {
  pending: { icon: Loader2, text: "Queued", cls: "text-muted-foreground", spin: true },
  running: { icon: Loader2, text: "Running", cls: "text-blue-500", spin: true },
  in_progress: { icon: Loader2, text: "Working", cls: "text-blue-500", spin: true },
  completed: { icon: CheckCircle2, text: "Done", cls: "text-emerald-500", spin: false },
  success: { icon: CheckCircle2, text: "Done", cls: "text-emerald-500", spin: false },
  failed: { icon: XCircle, text: "Failed", cls: "text-destructive", spin: false },
  error: { icon: XCircle, text: "Error", cls: "text-destructive", spin: false },
};

function FunctionDisplay({ toolCall }) {
  const [expanded, setExpanded] = useState(false);
  const rawStatus = toolCall.status || "pending";
  const lower = String(rawStatus).toLowerCase();
  const isFailed = lower === "failed" || lower === "error";
  const status = statusMap[isFailed ? "failed" : (statusMap[lower] ? lower : "pending")];
  const StatusIcon = status.icon;

  let parsedResults = toolCall.results;
  if (typeof parsedResults === "string") {
    try { parsedResults = JSON.parse(parsedResults); } catch { /* keep raw */ }
  }
  const resultIsError = typeof parsedResults === "object" && parsedResults &&
    (parsedResults.success === false || /error|failed/i.test(JSON.stringify(parsedResults)));
  const failed = isFailed || resultIsError;

  let parsedArgs = toolCall.arguments_string;
  if (typeof parsedArgs === "string") {
    try { parsedArgs = JSON.parse(parsedArgs); } catch { /* keep raw */ }
  }

  const proj = toolCall.display_projection || {};
  const hideDetails = proj.hide_details && proj.details_redacted;
  const label = failed ? (proj.error_label || "Action failed") : (status.text === "Done" ? (proj.label || "Action complete") : (proj.active_label || status.text));

  return (
    <div className="mt-2 border border-border rounded-xl bg-secondary/40 overflow-hidden">
      <button onClick={() => !hideDetails && setExpanded(!expanded)}
        className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-secondary/60 transition-colors">
        <Wrench size={13} className="text-muted-foreground shrink-0" />
        <span className="text-xs font-medium flex-1 truncate">{label}</span>
        {!hideDetails && (expanded ? <ChevronDown size={14} className="text-muted-foreground" /> : <ChevronRight size={14} className="text-muted-foreground" />)}
      </button>
      {!hideDetails && expanded && (
        <div className="px-3 pb-3 space-y-2 border-t border-border/60">
          {parsedArgs && (
            <div>
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Parameters</p>
              <pre className="text-[11px] bg-background/60 rounded-lg p-2 overflow-x-auto whitespace-pre-wrap break-words">{JSON.stringify(parsedArgs, null, 2)}</pre>
            </div>
          )}
          {parsedResults !== undefined && parsedResults !== null && (
            <div>
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Result</p>
              <pre className={`text-[11px] rounded-lg p-2 overflow-x-auto whitespace-pre-wrap break-words ${failed ? "bg-destructive/10 text-destructive" : "bg-background/60"}`}>{typeof parsedResults === "string" ? parsedResults : JSON.stringify(parsedResults, null, 2)}</pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function MessageBubble({ message }) {
  const isUser = message.role === "user";
  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 ${isUser ? "bg-primary text-primary-foreground rounded-br-md" : "bg-card border rounded-bl-md"}`}>
        {message.content && (isUser
          ? <p className="text-sm whitespace-pre-wrap">{message.content}</p>
          : <div className="text-sm prose prose-sm max-w-none prose-p:my-1 prose-ul:my-1 prose-li:my-0"><ReactMarkdown>{message.content}</ReactMarkdown></div>
        )}
        {message.tool_calls?.map((tc, idx) => <FunctionDisplay key={idx} toolCall={tc} />)}
      </div>
    </div>
  );
}