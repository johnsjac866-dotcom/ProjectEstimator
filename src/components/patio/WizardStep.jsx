import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getVisibleFields } from "@/lib/patioStages";

export default function WizardStep({ stage, data, onChange }) {
  const visibleFields = getVisibleFields(stage, data);

  function handleChange(key, value) {
    onChange({ ...data, [key]: value });
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-bold">{stage.title}</h2>
        <p className="text-sm text-muted-foreground mt-1">{stage.description}</p>
      </div>

      <div className="space-y-4">
        {visibleFields.map(field => {
          if (field.type === "pick_one" && stage.options) {
            return (
              <div key={field.key}>
                <Label className="mb-2 block">{field.label}</Label>
                <RadioGroup value={data[field.key] || ""} onValueChange={v => handleChange(field.key, v)}>
                  <div className="space-y-2">
                    {stage.options.map(opt => (
                      <label key={opt.value} className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${data[field.key] === opt.value ? "border-primary bg-primary/5" : "border-border hover:bg-muted/50"}`}>
                        <RadioGroupItem value={opt.value} />
                        <span className="text-sm">{opt.label}</span>
                      </label>
                    ))}
                  </div>
                </RadioGroup>
              </div>
            );
          }

          if (field.type === "select") {
            return (
              <div key={field.key}>
                <Label>{field.label}</Label>
                <Select value={data[field.key] || ""} onValueChange={v => handleChange(field.key, v)}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Select..." /></SelectTrigger>
                  <SelectContent>
                    {field.options.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            );
          }

          if (field.type === "number") {
            return (
              <div key={field.key}>
                <Label>{field.label}</Label>
                {field.hint && <p className="text-xs text-muted-foreground">{field.hint}</p>}
                <Input type="number" className="mt-1" value={data[field.key] || ""} onChange={e => handleChange(field.key, e.target.value)} />
              </div>
            );
          }

          if (field.type === "textarea") {
            return (
              <div key={field.key}>
                <Label>{field.label}</Label>
                <Textarea className="mt-1" rows={3} value={data[field.key] || ""} onChange={e => handleChange(field.key, e.target.value)} />
              </div>
            );
          }

          return (
            <div key={field.key}>
              <Label>{field.label}</Label>
              {field.hint && <p className="text-xs text-muted-foreground">{field.hint}</p>}
              <Input className="mt-1" value={data[field.key] || ""} onChange={e => handleChange(field.key, e.target.value)} />
            </div>
          );
        })}
      </div>
    </div>
  );
}