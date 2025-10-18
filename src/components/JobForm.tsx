import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";

interface JobFormProps {
  onSubmit: (jobData: JobFormData) => void;
  onCancel: () => void;
  initialData?: Partial<JobFormData>;
}

export interface JobFormData {
  name: string;
  url: string;
  method: string;
  schedule: string;
  autoStart: boolean;
  autoStop: boolean;
  autoStopAfter: number;
  timeout: number;
  maxRetries: number;
  headers: string;
  body: string;
  enabled: boolean;
}

export function JobForm({ onSubmit, onCancel, initialData }: JobFormProps) {
  const [formData, setFormData] = useState<JobFormData>({
    name: initialData?.name || "",
    url: initialData?.url || "",
    method: initialData?.method || "GET",
    schedule: initialData?.schedule || "0 * * * *",
    autoStart: initialData?.autoStart ?? true,
    autoStop: initialData?.autoStop ?? false,
    autoStopAfter: initialData?.autoStopAfter || 3600,
    timeout: initialData?.timeout || 300,
    maxRetries: initialData?.maxRetries || 3,
    headers: initialData?.headers || "",
    body: initialData?.body || "",
    enabled: initialData?.enabled ?? true,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.url) {
      toast.error("Please fill in all required fields");
      return;
    }

    // Validate URL
    try {
      new URL(formData.url);
    } catch {
      toast.error("Please enter a valid URL");
      return;
    }

    onSubmit(formData);
    toast.success("Job saved successfully!");
  };

  const updateField = (field: keyof JobFormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const cronPresets = [
    { label: "Every minute", value: "* * * * *" },
    { label: "Every 5 minutes", value: "*/5 * * * *" },
    { label: "Every 15 minutes", value: "*/15 * * * *" },
    { label: "Every 30 minutes", value: "*/30 * * * *" },
    { label: "Every hour", value: "0 * * * *" },
    { label: "Every 6 hours", value: "0 */6 * * *" },
    { label: "Daily at midnight", value: "0 0 * * *" },
    { label: "Daily at 2 AM", value: "0 2 * * *" },
    { label: "Weekly (Monday)", value: "0 0 * * MON" },
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Job Name *</Label>
          <Input
            id="name"
            placeholder="e.g., Database Backup"
            value={formData.name}
            onChange={(e) => updateField("name", e.target.value)}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="url">Endpoint URL *</Label>
          <Input
            id="url"
            type="url"
            placeholder="https://example.com/your-php-script.php"
            value={formData.url}
            onChange={(e) => updateField("url", e.target.value)}
            required
          />
          <p className="text-xs text-muted-foreground">
            Full URL to your PHP program or any HTTP endpoint
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="method">HTTP Method</Label>
            <Select value={formData.method} onValueChange={(v) => updateField("method", v)}>
              <SelectTrigger id="method">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="GET">GET</SelectItem>
                <SelectItem value="POST">POST</SelectItem>
                <SelectItem value="PUT">PUT</SelectItem>
                <SelectItem value="DELETE">DELETE</SelectItem>
                <SelectItem value="PATCH">PATCH</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="schedule">Schedule Preset</Label>
            <Select value={formData.schedule} onValueChange={(v) => updateField("schedule", v)}>
              <SelectTrigger id="schedule">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {cronPresets.map((preset) => (
                  <SelectItem key={preset.value} value={preset.value}>
                    {preset.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="schedule-custom">Cron Expression</Label>
          <Input
            id="schedule-custom"
            placeholder="* * * * *"
            value={formData.schedule}
            onChange={(e) => updateField("schedule", e.target.value)}
            className="font-mono"
          />
          <p className="text-xs text-muted-foreground">
            Custom cron expression (minute hour day month weekday)
          </p>
        </div>

        <Separator />

        <div className="space-y-4">
          <h3 className="font-semibold">Execution Settings</h3>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Auto Start</Label>
              <p className="text-sm text-muted-foreground">Start job automatically when created</p>
            </div>
            <Switch checked={formData.autoStart} onCheckedChange={(v) => updateField("autoStart", v)} />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Auto Stop After Time</Label>
              <p className="text-sm text-muted-foreground">Automatically stop after specified duration</p>
            </div>
            <Switch checked={formData.autoStop} onCheckedChange={(v) => updateField("autoStop", v)} />
          </div>

          {formData.autoStop && (
            <div className="space-y-2">
              <Label htmlFor="autoStopAfter">Auto Stop Duration (seconds)</Label>
              <Input
                id="autoStopAfter"
                type="number"
                min="60"
                value={formData.autoStopAfter}
                onChange={(e) => updateField("autoStopAfter", parseInt(e.target.value))}
              />
              <p className="text-xs text-muted-foreground">
                Job will pause after running for {Math.floor(formData.autoStopAfter / 3600)}h{" "}
                {Math.floor((formData.autoStopAfter % 3600) / 60)}m
              </p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="timeout">Timeout (seconds)</Label>
              <Input
                id="timeout"
                type="number"
                min="1"
                value={formData.timeout}
                onChange={(e) => updateField("timeout", parseInt(e.target.value))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="maxRetries">Max Retries</Label>
              <Input
                id="maxRetries"
                type="number"
                min="0"
                max="10"
                value={formData.maxRetries}
                onChange={(e) => updateField("maxRetries", parseInt(e.target.value))}
              />
            </div>
          </div>
        </div>

        <Separator />

        <div className="space-y-4">
          <h3 className="font-semibold">Request Configuration</h3>

          <div className="space-y-2">
            <Label htmlFor="headers">Headers (JSON format)</Label>
            <Textarea
              id="headers"
              placeholder={'{\n  "Content-Type": "application/json",\n  "Authorization": "Bearer token"\n}'}
              value={formData.headers}
              onChange={(e) => updateField("headers", e.target.value)}
              className="font-mono text-sm"
              rows={4}
            />
          </div>

          {formData.method !== "GET" && (
            <div className="space-y-2">
              <Label htmlFor="body">Request Body (JSON format)</Label>
              <Textarea
                id="body"
                placeholder={'{\n  "key": "value"\n}'}
                value={formData.body}
                onChange={(e) => updateField("body", e.target.value)}
                className="font-mono text-sm"
                rows={4}
              />
            </div>
          )}
        </div>

        <Separator />

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>Enable Job</Label>
            <p className="text-sm text-muted-foreground">Job will run on schedule when enabled</p>
          </div>
          <Switch checked={formData.enabled} onCheckedChange={(v) => updateField("enabled", v)} />
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">Save Job</Button>
      </div>
    </form>
  );
}
