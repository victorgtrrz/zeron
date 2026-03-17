import { TemplateForm } from "@/components/admin/newsletter/template-form";

export default function NewTemplatePage() {
  return (
    <div className="p-6">
      <h2 className="mb-6 text-3xl font-bold font-heading">New Template</h2>
      <TemplateForm mode="create" />
    </div>
  );
}
