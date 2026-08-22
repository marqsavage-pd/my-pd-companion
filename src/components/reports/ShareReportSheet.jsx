import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Mail, Link as LinkIcon, Plus, Trash2, Copy, Check, Loader2 } from "lucide-react";
import { generateClinicReportBlob } from "@/lib/clinicReport";

export default function ShareReportSheet({ open, onOpenChange, user }) {
  const [contacts, setContacts] = useState([]);
  const [selectedEmail, setSelectedEmail] = useState("");
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [showAddNew, setShowAddNew] = useState(false);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const [creatingLink, setCreatingLink] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");
  const [windowDays, setWindowDays] = useState(30);

  useEffect(() => {
    if (open) loadContacts();
  }, [open]);

  const loadContacts = async () => {
    const data = await base44.entities.ClinicContact.list("-created_date", 50);
    setContacts(data);
    if (data[0]) setSelectedEmail(data[0].email);
  };

  const handleAddContact = async () => {
    if (!newName.trim() || !newEmail.trim()) return;
    const created = await base44.entities.ClinicContact.create({ name: newName.trim(), email: newEmail.trim() });
    setContacts([created, ...contacts]);
    setSelectedEmail(created.email);
    setNewName("");
    setNewEmail("");
    setShowAddNew(false);
  };

  const handleDeleteContact = async (id) => {
    await base44.entities.ClinicContact.delete(id);
    const remaining = contacts.filter(c => c.id !== id);
    setContacts(remaining);
    if (selectedEmail === contacts.find(c => c.id === id)?.email) {
      setSelectedEmail(remaining[0]?.email || "");
    }
  };

  const handleEmailPDF = async () => {
    if (!selectedEmail) return;
    setSending(true);
    setError("");
    try {
      const blob = await generateClinicReportBlob(user, windowDays);
      const file = new File([blob], `clinical-snapshot-${new Date().toISOString().slice(0, 10)}.pdf`, { type: "application/pdf" });
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      await base44.integrations.Core.SendEmail({
        to: selectedEmail,
        subject: `PD Companion Clinical Snapshot — ${user?.full_name || "Patient"}`,
        body: `Hello,\n\nPlease find the latest clinical snapshot below:\n${file_url}\n\nGenerated ${new Date().toLocaleString()}.\n\nPD Companion`,
      });
      setSent(true);
      setTimeout(() => setSent(false), 3000);
    } catch (e) {
      setError(e.message || "Failed to send email");
    }
    setSending(false);
  };

  const handleCopyLink = async () => {
    setCreatingLink(true);
    setError("");
    try {
      const res = await base44.functions.invoke("createSharedReport", { days: 7, window_days: windowDays });
      const url = `${window.location.origin}/shared/${res.data.token}`;
      setLinkUrl(url);
      try { await navigator.clipboard.writeText(url); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch {}
    } catch (e) {
      setError(e.message || "Failed to create link");
    }
    setCreatingLink(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-2xl max-w-md">
        <DialogHeader>
          <DialogTitle className="font-heading text-xl">Share with Clinic</DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          {/* Window selector */}
          <div className="space-y-2">
            <p className="text-sm font-medium">Report Window</p>
            <div className="flex gap-2">
              {[7, 14, 30].map(d => (
                <button
                  key={d}
                  onClick={() => setWindowDays(d)}
                  className={`flex-1 py-2 rounded-xl text-sm font-medium transition-all ${windowDays === d ? "bg-primary text-primary-foreground shadow-md" : "bg-secondary text-muted-foreground"}`}
                >
                  {d} days
                </button>
              ))}
            </div>
          </div>

          {/* Email PDF */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Mail size={16} className="text-primary" /> Email PDF Report
            </div>
            {contacts.length > 0 && !showAddNew && (
              <div className="space-y-2">
                {contacts.map(c => (
                  <div key={c.id} className="flex items-center gap-2">
                    <button
                      onClick={() => setSelectedEmail(c.email)}
                      className={`flex-1 flex items-center justify-between p-3 rounded-xl border text-left transition-all ${selectedEmail === c.email ? "border-primary bg-primary/5" : "hover:bg-secondary"}`}
                    >
                      <div>
                        <p className="text-sm font-medium">{c.name}</p>
                        <p className="text-xs text-muted-foreground">{c.email}</p>
                      </div>
                    </button>
                    <button onClick={() => handleDeleteContact(c.id)} className="p-2 rounded-lg hover:bg-secondary text-muted-foreground">
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
                <button onClick={() => setShowAddNew(true)} className="flex items-center gap-1.5 text-sm text-primary font-medium hover:underline">
                  <Plus size={14} /> Add new contact
                </button>
              </div>
            )}
            {showAddNew && (
              <div className="space-y-2 p-3 rounded-xl bg-secondary">
                <Input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Contact name" className="rounded-xl" />
                <Input value={newEmail} onChange={e => setNewEmail(e.target.value)} placeholder="Email address" type="email" className="rounded-xl" />
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setShowAddNew(false)} className="rounded-xl flex-1">Cancel</Button>
                  <Button size="sm" onClick={handleAddContact} disabled={!newName.trim() || !newEmail.trim()} className="rounded-xl flex-1">Save</Button>
                </div>
              </div>
            )}
            {contacts.length === 0 && !showAddNew && (
              <button onClick={() => setShowAddNew(true)} className="w-full p-4 rounded-xl border-2 border-dashed text-sm text-muted-foreground hover:bg-secondary transition-all">
                <Plus size={16} className="mx-auto mb-1" /> Add a clinic contact
              </button>
            )}
            <Button onClick={handleEmailPDF} disabled={sending || !selectedEmail} className="w-full rounded-xl h-12">
              {sending ? <><Loader2 size={16} className="animate-spin" /> Sending...</> : sent ? <><Check size={16} /> Sent!</> : <><Mail size={16} /> Send PDF Report</>}
            </Button>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-border" />
            <span className="text-xs text-muted-foreground">or</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          {/* Copy secure link */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium">
              <LinkIcon size={16} className="text-primary" /> Secure Link
            </div>
            <p className="text-xs text-muted-foreground">Creates a read-only link valid for 7 days. Paste it into a portal message or text.</p>
            <Button onClick={handleCopyLink} disabled={creatingLink} variant="outline" className="w-full rounded-xl h-12">
              {creatingLink ? <><Loader2 size={16} className="animate-spin" /> Creating...</> : <><LinkIcon size={16} /> Create Secure Link</>}
            </Button>
            {linkUrl && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-secondary">
                <Input value={linkUrl} readOnly className="rounded-xl flex-1 text-xs" />
                <Button size="sm" onClick={() => { try { navigator.clipboard.writeText(linkUrl); } catch {} setCopied(true); setTimeout(() => setCopied(false), 2000); }} className="rounded-xl">
                  {copied ? <Check size={14} /> : <Copy size={14} />}
                </Button>
              </div>
            )}
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
      </DialogContent>
    </Dialog>
  );
}