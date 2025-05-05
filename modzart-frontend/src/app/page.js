"use client";

import { useEffect, useState } from "react";
import { modsService } from "@/services/modsService";
import { useAuth } from "@/contexts/AuthContext";
import Input from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Search, User } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-hot-toast";
import LoginForm from "@/components/auth/LoginForm";
import RegisterForm from "@/components/auth/RegisterForm";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useRouter } from "next/navigation";

export default function HomePage() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [modsList, setMods] = useState([]);
  const [search, setSearch] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [authMode, setAuthMode] = useState(null); // 'login' or 'register'

  useEffect(() => {
    fetchMods();
  }, [search]);

  const fetchMods = async () => {
    try {
      setLoading(true);
      console.log("Attempting to fetch mods from:", `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/mods/?search=${search}`);
      const response = await modsService.list(search);
      setMods(response.data);
    } catch (error) {
      console.error("Error fetching mods:", error);
      // Log more detailed error info
      if (error.request) {
        console.log("Request was made but no response received:", error.request);
      } else if (error.response) {
        console.log("Response received with error status:", error.response.status);
        console.log("Error data:", error.response.data);
      }
      toast.error("Failed to load mods. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (modId) => {
    try {
      if (!user) {
        setAuthMode('login');
        return;
      }
      toast.loading('Preparing download...');
      const response = await modsService.download(modId);
      toast.dismiss();
      toast.success('Download starting...');
      window.location.href = response.data.download_url;
    } catch (error) {
      toast.dismiss();
      toast.error(error.response?.data?.detail || "Failed to download mod");
      console.error("Error downloading mod:", error);
    }
  };

  return (
    <motion.div
      className="min-h-screen bg-gradient-to-r from-zinc-950 to-zinc-900 text-white"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* Navigation Bar */}
      <div className="flex justify-between items-center p-4 border-b border-zinc-800">
        <div className="flex items-center gap-2">
          <img src="/Modzart-logo.svg" alt="Modzart Logo" className="w-8 h-8" />
          <span className="text-2xl font-bold">Modzart</span>
        </div>
        <div className="flex gap-6 text-sm">
          <a href="/discover" className="hover:text-green-400">Discover content</a>
          <a href="#" className="hover:text-green-400">Host a server</a>
          <a href="#" className="hover:text-green-400">Get Modzart App</a>
        </div>
        {user ? (
          <div className="flex items-center gap-4">
            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center gap-2 outline-none">
                <span className="text-sm text-green-400">{user.username}</span>
                <User className="h-4 w-4 text-green-400" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => router.push('/profile')}>
                  Profile
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout}>
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ) : (
          <div className="flex gap-2">
            <Button
              onClick={() => setAuthMode('login')}
              className="bg-green-500 hover:bg-green-600 text-black font-bold"
            >
              Sign in
            </Button>
            <Button
              onClick={() => setAuthMode('register')}
              variant="outline"
              className="border-white text-white hover:bg-zinc-800"
            >
              Sign up
            </Button>
          </div>
        )}
      </div>

      {/* Auth Modal */}
      {authMode && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <motion.div 
            className="bg-zinc-900 p-6 rounded-xl w-full max-w-md"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold">
                {authMode === 'login' ? 'Sign in' : 'Create account'}
              </h2>
              <button 
                onClick={() => setAuthMode(null)}
                className="text-zinc-500 hover:text-white"
              >
                ✕
              </button>
            </div>
            {authMode === 'login' ? (
              <LoginForm onSuccess={() => setAuthMode(null)} />
            ) : (
              <RegisterForm onSuccess={() => setAuthMode(null)} />
            )}
            <div className="mt-4 text-center text-sm text-zinc-400">
              {authMode === 'login' ? (
                <p>
                  Don't have an account?{' '}
                  <button
                    onClick={() => setAuthMode('register')}
                    className="text-green-400 hover:underline"
                  >
                    Sign up
                  </button>
                </p>
              ) : (
                <p>
                  Already have an account?{' '}
                  <button
                    onClick={() => setAuthMode('login')}
                    className="text-green-400 hover:underline"
                  >
                    Sign in
                  </button>
                </p>
              )}
            </div>
          </motion.div>
        </div>
      )}

      {/* Hero Section */}
      <div className="text-center py-20 bg-[url('/maze-bg.svg')] bg-cover bg-center">
        <motion.h1 
          className="text-5xl font-bold"
          initial={{ y: -10, opacity: 0 }} 
          animate={{ y: 0, opacity: 1 }} 
          transition={{ duration: 0.5 }}
        >
          The place for GTA V <span className="text-green-400">mods</span>
        </motion.h1>
        <motion.p 
          className="text-gray-300 mt-4 text-lg"
          initial={{ y: 10, opacity: 0 }} 
          animate={{ y: 0, opacity: 1 }} 
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          Discover, play, and share GTA V content through our open-source platform built for the community.
        </motion.p>
        {!user && (
          <div className="mt-8 flex justify-center gap-4">
            <Button 
              onClick={() => window.location.href = '/discover'}
              className="bg-green-500 hover:bg-green-600 text-black font-bold"
            >
              Discover mods
            </Button>
            <Button 
              onClick={() => setAuthMode('login')}
              variant="outline" 
              className="border-white text-white hover:bg-zinc-800"
            >
              Sign in
            </Button>
          </div>
        )}
      </div>

      {/* Search Station */}
      <div className="flex justify-center mt-12 mb-6">
        <motion.div 
          className="relative w-1/2" 
          initial={{ scale: 0.9, opacity: 0 }} 
          animate={{ scale: 1, opacity: 1 }} 
          transition={{ duration: 0.5 }}
        >
          <Search className="absolute left-3 top-3 text-gray-400" />
          <Input
            type="text"
            placeholder="Search GTA V mods..."
            className="pl-10 bg-zinc-800 border-none text-white"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </motion.div>
      </div>

      {/* Mods List */}
      <motion.div
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 px-4 pb-10"
        initial="hidden"
        animate="visible"
        variants={{
          hidden: { opacity: 0, y: 10 },
          visible: { opacity: 1, y: 0, transition: { staggerChildren: 0.2 } }
        }}
      >
        {loading ? (
          // Loading skeleton
          Array.from({ length: 6 }).map((_, i) => (
            <motion.div key={i} variants={{ hidden: { opacity: 0, scale: 0.9 }, visible: { opacity: 1, scale: 1 } }}>
              <Card className="p-4 shadow-lg bg-zinc-800 text-white animate-pulse">
                <div className="w-full h-40 bg-zinc-700 rounded-lg"></div>
                <CardContent>
                  <div className="h-6 bg-zinc-700 rounded mt-2"></div>
                  <div className="h-4 bg-zinc-700 rounded mt-2"></div>
                  <div className="h-10 bg-zinc-700 rounded mt-3"></div>
                </CardContent>
              </Card>
            </motion.div>
          ))
        ) : (
          modsList.map(mod => (
            <motion.div key={mod.id} variants={{ hidden: { opacity: 0, scale: 0.9 }, visible: { opacity: 1, scale: 1 } }}>
              <Card className="p-4 shadow-lg hover:shadow-2xl transition-shadow duration-300 bg-zinc-800 text-white">
                <CardContent>
                  <h3 className="text-lg font-semibold mt-2">{mod.title}</h3>
                  <p className="text-sm text-gray-400">{mod.description}</p>
                  <div className="mt-4 flex items-center justify-between">
                    <span className="text-sm text-gray-400">
                      Downloads: {mod.downloads}
                    </span>
                    <Button
                      onClick={() => handleDownload(mod.id)}
                      className="bg-green-500 hover:bg-green-600 text-black font-bold"
                    >
                      Download
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))
        )}
      </motion.div>
    </motion.div>
  );
}