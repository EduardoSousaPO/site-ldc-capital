"use client";

import { useState, ReactNode, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FileText,
  Plus,
  Settings,
  LogOut,
  Menu,
  X,
  User,
  BookOpen
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { signOut, getCurrentUser, User as AuthUser } from "@/lib/auth-supabase";

interface AdminLayoutProps {
  children: ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const currentUser = await getCurrentUser();
        
        if (!currentUser || (currentUser.role !== "ADMIN" && currentUser.role !== "EDITOR")) {
          router.push("/admin/login");
          return;
        }
        
        setUser(currentUser);
      } catch (error) {
        console.error('Auth error:', error);
        router.push("/admin/login");
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="w-8 h-8 border-4 border-[#262d3d]/30 border-t-[#262d3d] rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const navigation = [
    {
      name: "Dashboard",
      href: "/admin/dashboard",
      icon: LayoutDashboard,
      current: pathname === "/admin/dashboard"
    },
    {
      name: "Postagens",
      href: "/admin/posts",
      icon: FileText,
      current: pathname.startsWith("/admin/posts")
    },
    {
      name: "Nova Postagem",
      href: "/admin/posts/new",
      icon: Plus,
      current: pathname === "/admin/posts/new"
    },
    {
      name: "Materiais",
      href: "/admin/materials",
      icon: BookOpen,
      current: pathname.startsWith("/admin/materials")
    },
    {
      name: "Configurações",
      href: "/admin/settings",
      icon: Settings,
      current: pathname === "/admin/settings"
    }
  ];

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <div className="flex h-screen bg-gray-100 font-sans">
      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-[#262d3d] text-white transform ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0 transition-transform duration-200 ease-in-out`}
      >
        <div className="flex items-center justify-between h-20 px-6 border-b border-white/10">
          <Link href="/admin/dashboard" className="flex items-center">
            <Image
              src="/images/LDC Capital - Logo Final_Aplicação Branca + Colorida.png"
              alt="LDC Capital Admin"
              width={640}
              height={160}
              className="h-12 w-auto"
              priority
            />
          </Link>
          <Button
            variant="ghost"
            className="lg:hidden text-white hover:bg-white/10"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="h-6 w-6" />
          </Button>
        </div>
        <nav className="mt-6">
          {navigation.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center px-6 py-3 text-sm font-medium transition-colors duration-200 ${
                item.current
                  ? "bg-[#344645] text-white"
                  : "text-gray-300 hover:bg-[#344645] hover:text-white"
              }`}
              onClick={() => setSidebarOpen(false)}
            >
              <item.icon className="mr-4 h-5 w-5" />
              {item.name}
            </Link>
          ))}
        </nav>
        <div className="absolute bottom-0 w-full p-6 border-t border-white/10">
          <div className="flex items-center mb-4">
            <User className="h-8 w-8 text-gray-300 mr-3" />
            <div>
              <p className="text-sm font-medium">{user.name || user.email}</p>
              <p className="text-xs text-gray-400">{user.role}</p>
            </div>
          </div>
          <Button
            variant="ghost"
            className="w-full justify-start text-red-300 hover:bg-red-900/30 hover:text-red-100"
            onClick={handleSignOut}
          >
            <LogOut className="mr-4 h-5 w-5" />
            Sair
          </Button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col lg:ml-64">
        <header className="flex items-center justify-between h-16 bg-white shadow-sm px-6 lg:px-8">
          <Button
            variant="ghost"
            className="lg:hidden text-[#262d3d] hover:bg-gray-100"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-6 w-6" />
          </Button>
          <div className="flex-1"></div>
          <div className="flex items-center space-x-4">
            <span className="text-sm font-medium text-gray-700 hidden sm:block">
              {user.name || user.email}
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="text-gray-500 hover:bg-gray-100"
              onClick={handleSignOut}
            >
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
