import { useState } from "react";
import { supabaseEntity } from "@/lib/supabaseEntities";
import { useAuth } from "@/lib/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { AlertTriangle, Trash2, UserCircle, FileText, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";

const ProjectSdk = supabaseEntity("projects");
const AreaSdk = supabaseEntity("areas");

export default function Settings() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);

  const CONFIRM_PHRASE = "DELETE MY ACCOUNT";

  async function handleDeleteAccount() {
    if (confirmText !== CONFIRM_PHRASE) return;
    setDeleting(true);
    try {
      // Delete all user projects and areas first
      const projects = await ProjectSdk.list();
      for (const p of projects) {
        const areas = await AreaSdk.filter({ project_id: p.id });
        for (const a of areas) {
          await AreaSdk.delete(a.id);
        }
        await ProjectSdk.delete(p.id);
      }
      // Row deletion above only removes app data — actual auth-account removal still
      // needs a real flow (e.g. an admin-privileged Edge Function calling
      // supabase.auth.admin.deleteUser); for now we clear data and sign out.
      await logout(true);
    } catch {
      setDeleting(false);
    }
  }

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground text-sm mt-1">Manage your account preferences</p>
      </div>

      {/* Account Info */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <UserCircle className="h-5 w-5" /> Account
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            You are signed in. Your data is stored securely in the cloud.
          </p>
        </CardContent>
      </Card>

      {/* Sign Out */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <LogOut className="h-5 w-5" /> Sign Out
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">Sign out of your account on this device.</p>
            <Button variant="outline" size="sm" className="flex-shrink-0" onClick={() => logout(true)}>
              Sign Out
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Legal */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="h-5 w-5" /> Legal
          </CardTitle>
        </CardHeader>
        <CardContent>
          <a
            href="https://smooth-echium-91d.notion.site/Privacy-Policy-for-Project-Estimator-379494364ede803b8f63f6261e899424"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-primary underline underline-offset-4"
          >
            Privacy Policy
          </a>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-destructive/30">
        <CardHeader className="pb-3">
          <CardTitle className="text-base text-destructive flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" /> Danger Zone
          </CardTitle>
          <CardDescription>
            These actions are permanent and cannot be undone.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium">Delete Account</p>
              <p className="text-sm text-muted-foreground mt-0.5">
                Permanently deletes all your projects, areas, and operations. You will be signed out immediately.
              </p>
            </div>
            <Button
              variant="destructive"
              size="sm"
              className="flex-shrink-0"
              onClick={() => { setConfirmText(""); setShowDeleteDialog(true); }}
            >
              <Trash2 className="h-4 w-4 mr-1.5" /> Delete
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-destructive flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" /> Delete Account
            </DialogTitle>
            <DialogDescription className="space-y-2 pt-1">
              <p>This will <strong>permanently delete</strong>:</p>
              <ul className="list-disc list-inside text-sm space-y-1 ml-1">
                <li>All your projects and their data</li>
                <li>All areas and configured operations</li>
                <li>All estimation history</li>
              </ul>
              <p className="font-medium text-foreground mt-3">This action <em>cannot</em> be undone.</p>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <Label className="text-sm">
              Type <span className="font-mono font-bold text-destructive">{CONFIRM_PHRASE}</span> to confirm
            </Label>
            <Input
              value={confirmText}
              onChange={e => setConfirmText(e.target.value)}
              placeholder={CONFIRM_PHRASE}
              className="font-mono"
            />
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)} disabled={deleting}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={confirmText !== CONFIRM_PHRASE || deleting}
              onClick={handleDeleteAccount}
            >
              {deleting ? "Deleting..." : "Delete Everything"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}