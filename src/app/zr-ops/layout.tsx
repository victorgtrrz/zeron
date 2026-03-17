import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { adminAuth } from "@/lib/firebase/admin";
import { ThemeProvider } from "next-themes";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { AdminMobileNav } from "@/components/admin/admin-mobile-nav";
import { ToastProvider } from "@/components/ui/toast";

export const metadata = {
  title: {
    default: "Admin | ZERON",
    template: "%s | ZERON Admin",
  },
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("__session")?.value;

  if (!sessionCookie) {
    redirect("/es/login");
  }

  try {
    const decodedToken = await adminAuth.verifyIdToken(sessionCookie);
    if (!decodedToken.admin) {
      redirect("/es/login");
    }
  } catch {
    redirect("/es/login");
  }

  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
      <ToastProvider>
        <div className="min-h-screen bg-background">
          <AdminSidebar />
          <AdminMobileNav />

          {/* Main content area - offset for sidebar on desktop, bottom bar on mobile */}
          <main className="pb-16 md:ml-64 md:pb-0">
            {children}
          </main>
        </div>
      </ToastProvider>
    </ThemeProvider>
  );
}
