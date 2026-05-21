import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { getSMVisibleFields } from "@/lib/siteManagementStages";

export default function SMWizardStep({ stage, data, onChange }) {
  const visibleFields = getSMVisibleFields(stage, data);

  function handleChange(key, value) {
    onChange({ ...data, [key]: value });
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-bold">{stage.title}</h2>
        <p className="text-sm text-muted-foreground mt-1">{stage.description}</p>
      </div>

      <div className="space-y-3">
        {visibleFields.map(field => {
          if (field.type === "radio") {
            return (
              <div key={field.key}>
                <Label className="mb-2 block">{field.label}</Label>
                <RadioGroup value={data[field.key] || ""} onValueChange={v => handleChange(field.key, v)}>
                  <div className="space-y-2">
                    {field.options.map(opt => (
                      <label key={opt} className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${data[field.key] === opt ? "border-primary bg-primary/5" : "border-border hover:bg-muted/50"}`}>
                        <RadioGroupItem value={opt} />
                        <span className="text-sm font-medium">{opt}</span>
                      </label>
                    ))}
                  </div>
                </RadioGroup>
              </div>
            );
          }

          if (field.type === "checkbox") {
            const isChecked = !!data[field.key];
            return (
              <label key={field.key} className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${isChecked ? "border-amber-400 bg-amber-50/50" : "border-border hover:bg-muted/30"}`}>
                <Checkbox checked={isChecked} onCheckedChange={v => handleChange(field.key, v)} />
                <span className="text-sm">{field.label}</span>
              </label>
            );
          }

          if (field.type === "number") {
            return (
              <div key={field.key} className="ml-6">
                <Label className="text-sm">{field.label}</Label>
                <Input type="number" className="mt-1 max-w-xs" value={data[field.key] || ""} onChange={e => handleChange(field.key, e.target.value)} />
              </div>
            );
          }

          return (
            <div key={field.key} className="ml-6">
              <Label className="text-sm">{field.label}</Label>
              <Input className="mt-1" value={data[field.key] || ""} onChange={e => handleChange(field.key, e.target.value)} />
            </div>
          );
        })}
      </div>
    </div>
  );
}