import { TemplateForm } from "@/components/admin/newsletter/template-form";

export default async function EditTemplatePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <div className="p-6">
      <h2 className="mb-6 text-3xl font-bold font-heading">Edit Template</h2>
      <TemplateForm mode="edit" templateId={id} />
    </div>
  );
}
