import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { ToastProvider } from "@/components/ui/Toast";

// Font (Plus Jakarta Sans, Russo One) dimuat lewat @font-face di v7.css.
export const metadata = {
  title: "BengkelinAja | Laju Jaya",
  description: "Pantau status servis motor dan kelola bengkel Laju Jaya.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <body>
        <AuthProvider>
          <ToastProvider>{children}</ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
