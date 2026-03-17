import { AdminHeader } from "@/components/admin/admin-header";
import { ReviewsList } from "@/components/admin/reviews/reviews-list";

export default function ReviewsPage() {
  return (
    <>
      <AdminHeader title="Reviews" />
      <div className="p-6">
        <h2 className="mb-6 text-3xl font-bold font-heading">Reviews</h2>
        <ReviewsList />
      </div>
    </>
  );
}
