import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import { User } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Label } from "@/components/ui/label.tsx";
import { toast } from "sonner";

export default function CustomerProfile() {
  const user = useQuery(api.users.getCurrentUser, {});
  const updateProfile = useMutation(api.users.updateProfile);
  const [name, setName] = useState(user?.name ?? "");
  const [phone, setPhone] = useState(user?.phone ?? "");
  const [saving, setSaving] = useState(false);
  const handleSave = async () => {
    setSaving(true);
    try { await updateProfile({ name, phone }); toast.success("Profile updated."); }
    catch { toast.error("Failed to update profile."); }
    finally { setSaving(false); }
  };
  return (
    <div className="p-6 max-w-2xl mx-auto pb-20 md:pb-6">
      <h1 className="text-2xl font-bold mb-6 flex items-center gap-2"><User size={22} /> Profile</h1>
      <Card><CardHeader><CardTitle className="text-base">Personal Information</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5"><Label>Full name</Label><Input placeholder="John Smith" value={name} onChange={(e) => setName(e.target.value)} /></div>
          <div className="space-y-1.5"><Label>Email</Label><Input value={user?.email ?? ""} disabled className="opacity-60" /></div>
          <div className="space-y-1.5"><Label>Phone number</Label><Input placeholder="+1 234 567 8900" value={phone} onChange={(e) => setPhone(e.target.value)} /></div>
          <Button className="w-full" onClick={() => void handleSave()} disabled={saving}>{saving ? "Saving..." : "Save changes"}</Button>
        </CardContent>
      </Card>
    </div>
  );
}