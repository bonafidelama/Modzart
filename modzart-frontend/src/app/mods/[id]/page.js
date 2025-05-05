"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { modsService } from "@/services/modsService";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "react-hot-toast";
import { useAuth } from "@/contexts/AuthContext";
import { motion } from "framer-motion";

export default function ModDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [mod, setMod] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchModDetails = async () => {
      if (!params.id) return;

      try {
        setLoading(true);
        setError(null);
        const response = await modsService.getById(params.id);
        setMod(response.data);
      } catch (error) {
        console.error("Failed to fetch mod details:", error);
        setError("Failed to load mod details. Please try again later.");
        toast.error("Could not load mod details");
      } finally {
        setLoading(false);
      }
    };

    fetchModDetails();
  }, [params.id]);

  const isOwner = user && mod && user.id === mod.user_id;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-r from-zinc-950 to-zinc-900 flex justify-center items-center">
        <p className="text-white">Loading mod details...</p>
      </div>
    );
  }

  if (error || !mod) {
    return (
      <div className="min-h-screen bg-gradient-to-r from-zinc-950 to-zinc-900 flex justify-center items-center flex-col gap-4">
        <p className="text-white text-xl">{error || "Mod not found"}</p>
        <Button 
          onClick={() => router.push('/profile')}
          className="bg-green-500 hover:bg-green-600 text-black font-bold"
        >
          Back to Profile
        </Button>
      </div>
    );
  }

  return (
    <motion.div 
      className="min-h-screen bg-gradient-to-r from-zinc-950 to-zinc-900 p-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="max-w-5xl mx-auto">
        <Button 
          onClick={() => router.push('/profile')}
          className="mb-6 bg-zinc-800 hover:bg-zinc-700 text-white"
        >
          ← Back to Profile
        </Button>
        
        <Card className="bg-zinc-800 border-zinc-700 mb-6 overflow-hidden">
          {mod.banner_url && (
            <div className="w-full h-48 relative bg-zinc-900">
              <img 
                src={mod.banner_url} 
                alt={`${mod.title} banner`} 
                className="w-full h-full object-cover"
              />
            </div>
          )}
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-3xl font-bold text-white mb-2">{mod.title}</h1>
                <p className="text-gray-400">{mod.description}</p>
              </div>
              
              {isOwner && (
                <Button 
                  onClick={() => {/* Edit functionality would go here */}}
                  className="bg-green-500 hover:bg-green-600 text-black font-bold"
                >
                  Edit Mod
                </Button>
              )}
            </div>
            
            <div className="border-t border-zinc-700 my-6 pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h2 className="text-xl font-semibold text-white mb-4">Mod Information</h2>
                  <div className="space-y-3">
                    <div>
                      <span className="text-gray-400 text-sm">Created on:</span>
                      <p className="text-white">{new Date(mod.created_at).toLocaleDateString()}</p>
                    </div>
                    {mod.updated_at && (
                      <div>
                        <span className="text-gray-400 text-sm">Last updated:</span>
                        <p className="text-white">{new Date(mod.updated_at).toLocaleDateString()}</p>
                      </div>
                    )}
                    {mod.file_size && (
                      <div>
                        <span className="text-gray-400 text-sm">File size:</span>
                        <p className="text-white">
                          {(mod.file_size / (1024 * 1024)).toFixed(2)} MB
                        </p>
                      </div>
                    )}
                    <div>
                      <span className="text-gray-400 text-sm">Type:</span>
                      <p className="text-white capitalize">{mod.type || "Standard Mod"}</p>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h2 className="text-xl font-semibold text-white mb-4">Creator</h2>
                  <div className="flex items-center space-x-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={mod.creator_avatar || "/default-avatar.png"} />
                      <AvatarFallback className="bg-zinc-700">
                        {mod.creator_name ? mod.creator_name.slice(0, 2).toUpperCase() : "??"}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-white font-medium">{mod.creator_name || "Anonymous"}</p>
                      <p className="text-sm text-gray-400">Creator</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="border-t border-zinc-700 my-6 pt-6">
              <h2 className="text-xl font-semibold text-white mb-4">Download</h2>
              <Button
                onClick={async () => {
                  try {
                    await modsService.downloadMod(mod.id);
                    toast.success("Download started!");
                  } catch (error) {
                    console.error("Download failed:", error);
                    toast.error("Download failed. Please try again.");
                  }
                }}
                className="bg-green-500 hover:bg-green-600 text-black font-bold"
              >
                Download Mod
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
}